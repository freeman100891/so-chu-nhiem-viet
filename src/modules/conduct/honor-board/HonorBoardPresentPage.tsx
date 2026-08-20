import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { honorBoardService, type HonorBoardDetailsResult, type HonorBoardRecipientDetail } from '../../../core/services/honor-board.service';
import { settingsRepository } from '../../../core/repositories/settings.repository';
import { avatarAssetService } from '../../../core/services/avatar-asset.service';
import { avatarThemeRegistry, DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import {
  playPromotionFanfare,
  playPositiveChime,
  playStarChime,
} from '../../../shared/utilities/sound';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Crown,
  PartyPopper,
  Medal,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Award,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export const HonorBoardPresentPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<HonorBoardDetailsResult | null>(null);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS);
  const [uploadedAssetUrls, setUploadedAssetUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sound & Motion Reveal State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [podiumRevealStep, setPodiumRevealStep] = useState<number>(5); // 0..5 (5 = all revealed)
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        honorBoardService.getBoardDetails(boardId),
        settingsRepository.getSettings(),
      ]);
      setDetails(data);

      const activeSysSettings = avatarThemeRegistry.resolveGlobalSettings(settings);
      setGlobalAvatarSettings(activeSysSettings);

      const uploadedIds = activeSysSettings.levels
        .filter((l) => l.image.kind === 'UPLOADED')
        .map((l) => (l.image as { kind: 'UPLOADED'; assetId: string }).assetId);
      if (uploadedIds.length > 0) {
        const urlMap = await avatarAssetService.preloadAssetUrls(uploadedIds);
        setUploadedAssetUrls(urlMap);
      }
    } catch (err) {
      console.error('Error loading presentation data:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext ? (canvas.getContext('2d') as CanvasRenderingContext2D) : null;
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth || 1200);
    const height = (canvas.height = window.innerHeight || 800);

    const colors = ['#f59e0b', '#fbbf24', '#fde68a', '#60a5fa', '#ec4899', '#10b981', '#ffffff'];
    const particleCount = 90;
    const particles = Array.from({ length: particleCount }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 300,
      y: height / 2 - 50,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.9) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0 && p.y < height) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animate();
  }, []);

  // Sequential Reveal Sequence for Podium Slide
  const runPodiumSequence = useCallback(() => {
    setPodiumRevealStep(0);

    const t1 = setTimeout(() => {
      setPodiumRevealStep(1); // Rank 3
      playStarChime(soundEnabled);
    }, 600);

    const t2 = setTimeout(() => {
      setPodiumRevealStep(2); // Rank 2
      playPositiveChime(soundEnabled);
    }, 1400);

    const t3 = setTimeout(() => {
      setPodiumRevealStep(3); // Suspense drumroll
    }, 2200);

    const t4 = setTimeout(() => {
      setPodiumRevealStep(4); // Rank 1 champion burst
      playPromotionFanfare(soundEnabled);
      triggerConfetti();
    }, 2800);

    const t5 = setTimeout(() => {
      setPodiumRevealStep(5); // Final banner & stable stage
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [soundEnabled, triggerConfetti]);

  // Build Presentation Slides
  const slides = React.useMemo(() => {
    if (!details) return [];
    const list = [];

    // SLIDE 1: WELCOME
    list.push({
      id: 'welcome',
      title: 'Bảng Vàng Danh Hiệu',
      subtitle: details.board.title,
      type: 'welcome',
    });

    // SLIDE 2: TOP RANK PODIUM
    if (details.topRankPodium.length > 0) {
      list.push({
        id: 'top_rank',
        title: '👑 Bục Vinh Danh Cấp Bậc',
        subtitle: 'Tôn vinh 3 chiến sĩ nhỏ dẫn đầu cấp bậc và điểm thi đua xuất sắc nhất',
        type: 'podium',
        data: details.topRankPodium,
      });
    }

    // SLIDES FOR EACH TITLE GROUP
    details.groupedByTitle.forEach((grp) => {
      if (grp.title.code !== 'top_rank' && grp.recipients.length > 0) {
        list.push({
          id: grp.title.id,
          title: grp.title.name,
          subtitle: grp.title.description,
          type: 'title_group',
          titleObj: grp.title,
          data: grp.recipients,
        });
      }
    });

    // SLIDE: COLLECTIVE PROGRESS
    list.push({
      id: 'collective',
      title: '🌟 Cả Lớp Cùng Tiến Bộ',
      subtitle: 'Thành quả nỗ lực và tinh thần đoàn kết của cả tập thể',
      type: 'collective',
      data: details.collectiveMetrics,
    });

    // SLIDE: CONGRATULATIONS
    list.push({
      id: 'congrats',
      title: '🎉 Chúc Mừng Tất Cả Các Con!',
      subtitle: 'Hãy tiếp tục phấn đấu, rèn luyện và tỏa sáng trong tuần học tiếp theo!',
      type: 'congrats',
    });

    return list;
  }, [details]);

  // Start sequence when navigating to podium slide
  useEffect(() => {
    if (slides[currentSlide]?.type === 'podium') {
      const cleanup = runPodiumSequence();
      return () => {
        cleanup?.();
      };
    } else {
      setPodiumRevealStep(5);
      return undefined;
    }
  }, [currentSlide, slides, runPodiumSequence]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'r' || e.key === 'R') {
        if (slides[currentSlide]?.type === 'podium') {
          runPodiumSequence();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled((prev) => !prev);
      } else if (e.key === 'Escape') {
        navigate(`/conduct/honor-board/${boardId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides, currentSlide, navigate, boardId, runPodiumSequence]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (loading || !details) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
        <p className="text-sm font-bold text-slate-300">Đang chuẩn bị sân khấu vinh danh...</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  const rank1 = details.topRankPodium.find((r) => r.position === 1) || details.topRankPodium[0];
  const rank2 = details.topRankPodium.find((r) => r.position === 2) || details.topRankPodium[1];
  const rank3 = details.topRankPodium.find((r) => r.position === 3) || details.topRankPodium[2];

  const renderPresentPillar = (
    recipient: HonorBoardRecipientDetail | undefined,
    position: 1 | 2 | 3
  ) => {
    if (!recipient) return null;

    const is1 = position === 1;
    const is2 = position === 2;
    const is3 = position === 3;

    // Check visibility based on sequential reveal step
    const isVisible =
      podiumRevealStep >= 5 ||
      (is3 && podiumRevealStep >= 1) ||
      (is2 && podiumRevealStep >= 2) ||
      (is1 && podiumRevealStep >= 4);

    return (
      <div
        className={cn(
          'flex-1 flex flex-col items-center justify-end transition-all duration-700 max-w-[280px]',
          is1 ? 'z-20 -mt-10' : 'z-10',
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-20 scale-90 pointer-events-none'
        )}
      >
        {/* CHARACTER STAGE DISPLAY (AVATAR + NAME + RANK + CROWN) */}
        <div className="relative flex flex-col items-center text-center mb-4 w-full px-2">
          {/* RADIANT AURA FOR RANK 1 */}
          {is1 && (
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-amber-400/45 via-yellow-300/40 to-amber-500/30 blur-3xl pointer-events-none animate-aura-pulse"
              aria-hidden="true"
            />
          )}

          {/* CROWN / MEDAL BADGE */}
          {is1 && (
            <div className="relative mb-2 flex items-center justify-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 shadow-2xl ring-4 ring-white/90 animate-crown-float">
                <Crown className="w-8 h-8 fill-amber-100 stroke-amber-950" />
              </div>
            </div>
          )}

          {is2 && (
            <div className="mb-2 p-2 rounded-xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-800 shadow-xl ring-2 ring-white/80">
              <Medal className="w-6 h-6 text-slate-700" />
            </div>
          )}

          {is3 && (
            <div className="mb-2 p-2 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-amber-100 shadow-xl ring-2 ring-white/70">
              <Trophy className="w-6 h-6 text-amber-100" />
            </div>
          )}

          {/* AVATAR EMBEDDED DIRECTLY ON TOP OF PEDESTAL */}
          <div className="relative">
            <StudentAvatar
              student={recipient.student}
              score={recipient.pointsAtAward}
              rankLevelOrOrder={recipient.rankLevelAtAward}
              preferRankAvatar={true}
              globalActiveThemeId={globalAvatarSettings.presetThemeId}
              globalSettings={globalAvatarSettings}
              uploadedAssetUrls={uploadedAssetUrls}
              size={is1 ? '2xl' : 'xl'}
              shape="circle"
              className={cn(
                'border-4 transition-all duration-300',
                is1
                  ? 'border-amber-300 ring-8 ring-amber-400/40 shadow-2xl scale-110'
                  : is2
                  ? 'border-slate-200 ring-4 ring-slate-300/40 shadow-xl'
                  : 'border-amber-600 ring-4 ring-amber-600/30 shadow-lg'
              )}
            />

            {/* POSITION BADGE */}
            <span
              className={cn(
                'absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xl whitespace-nowrap flex items-center gap-1.5',
                is1
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 ring-2 ring-white'
                  : is2
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 ring-1 ring-white/80'
                  : 'bg-gradient-to-r from-amber-700 to-orange-800 ring-1 ring-white/80'
              )}
            >
              {is1 && <Sparkles className="w-3.5 h-3.5 text-yellow-200" />}
              Hạng {position}
            </span>
          </div>

          {/* STUDENT NAME (SUPPORTS 2 LINES, LARGE FOR PROJECTOR) */}
          <div className="mt-5 px-1 w-full max-w-[200px] flex flex-col items-center">
            <h3
              className={cn(
                'font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md',
                is1 ? 'text-lg sm:text-2xl text-amber-200' : 'text-base sm:text-xl'
              )}
            >
              {recipient.student?.fullName || 'Học sinh'}
            </h3>

            {/* RANK & SCORE */}
            <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
              <span className={cn(
                'text-xs sm:text-sm font-bold',
                is1 ? 'text-amber-400 font-extrabold' : 'text-slate-300'
              )}>
                {recipient.rankNameAtAward}
              </span>

              {recipient.pointsAtAward !== null && recipient.pointsAtAward !== undefined && (
                <>
                  <span className="text-slate-400 opacity-60">•</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg shadow-sm">
                    {recipient.pointsAtAward} đ
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3D-SIMULATED CEREMONIAL PODIUM PILLAR */}
        <div className="w-full flex flex-col items-center">
          {/* PODIUM STEP PLATFORM */}
          <div
            className={cn(
              'w-full h-4 rounded-t-3xl border-t-2 border-x shadow-md',
              is1
                ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 border-amber-100 shadow-[0_-6px_20px_rgba(245,158,11,0.6)]'
                : is2
                ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border-slate-100 shadow-[0_-4px_16px_rgba(148,163,184,0.4)]'
                : 'bg-gradient-to-b from-orange-600 via-amber-700 to-orange-800 border-amber-400/60 shadow-[0_-3px_12px_rgba(180,83,9,0.4)]'
            )}
          />

          {/* PODIUM PILLAR MAIN BODY */}
          <div
            className={cn(
              'w-full border-x border-b-0 flex flex-col items-center justify-between p-4 text-center relative overflow-hidden shadow-2xl',
              is1
                ? 'h-64 sm:h-72 bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-700 border-amber-300/80 text-amber-950'
                : is2
                ? 'h-48 sm:h-54 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-500 border-slate-300/80 text-slate-900'
                : 'h-36 sm:h-40 bg-gradient-to-b from-amber-700 via-orange-800 to-amber-950 border-amber-600/70 text-amber-100'
            )}
          >
            {/* SHIMMER LIGHT EFFECT */}
            <div className="absolute inset-0 shimmer-gold-effect opacity-50 pointer-events-none" />

            {/* LARGE EMBOSSED RANK NUMBER */}
            <div className="relative z-10 my-auto flex flex-col items-center">
              <span
                className={cn(
                  'font-black font-mono leading-none tracking-tighter drop-shadow-xl select-none',
                  is1 ? 'text-6xl sm:text-7xl text-amber-950' : is2 ? 'text-5xl sm:text-6xl text-slate-800' : 'text-5xl sm:text-6xl text-amber-100'
                )}
              >
                {position}
              </span>
              <span
                className={cn(
                  'text-xs font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full',
                  is1
                    ? 'bg-amber-300/70 text-amber-950'
                    : is2
                    ? 'bg-slate-100/80 text-slate-900'
                    : 'bg-orange-900/80 text-amber-100'
                )}
              >
                {is1 ? 'Quán quân' : is2 ? 'Á quân 1' : 'Á quân 2'}
              </span>
            </div>

            {/* PODIUM BASE TRIM */}
            <div className={cn(
              'w-full h-2 rounded-full opacity-70',
              is1 ? 'bg-amber-200' : is2 ? 'bg-slate-100' : 'bg-amber-400'
            )} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white select-none flex flex-col justify-between p-6 sm:p-10 overflow-hidden">
      {/* CONFETTI CANVAS OVERLAY */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* AMBIENT STAGE SPOTLIGHTS */}
      <div
        className="fixed -top-32 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-gradient-to-b from-amber-400/25 via-yellow-300/15 to-transparent blur-3xl pointer-events-none animate-spotlight-glow"
        aria-hidden="true"
      />

      {/* TOP CONTROLS TOOLBAR */}
      <div className="flex items-center justify-between z-30 pb-2">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono shadow-inner">
            {currentSlide + 1} / {slides.length}
          </span>
          <span className="text-xs text-slate-300 font-bold hidden sm:inline">
            {slide?.title}
          </span>
        </div>

        {/* ACTION BUTTONS (REPLAY, SOUND, FULLSCREEN, CLOSE) */}
        <div className="flex items-center gap-2">
          {slide?.type === 'podium' && (
            <button
              onClick={() => runPodiumSequence()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Phát lại hoạt ảnh vinh danh (Phím R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Diễn lại vinh danh</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={soundEnabled ? 'Tắt âm thanh (Phím M)' : 'Bật âm thanh (Phím M)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors hidden sm:inline-flex"
            title="Bật/Tắt toàn màn hình (Phím F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate(`/conduct/honor-board/${boardId}`)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Thoát trình chiếu (Phím Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN 16:9 SLIDE STAGE CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto z-10 max-w-6xl mx-auto w-full py-4">
        {/* SLIDE 1: WELCOME */}
        {slide?.type === 'welcome' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 mx-auto flex items-center justify-center shadow-2xl ring-4 ring-amber-300/40 animate-crown-float">
              <Trophy className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs sm:text-sm font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Lễ Vinh Danh Khen Thưởng
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tight uppercase drop-shadow-lg">
                BẢNG VÀNG THI ĐUA
              </h1>
              <p className="text-2xl sm:text-4xl font-black text-white">
                {details.board.title}
              </p>
            </div>
            <p className="text-sm sm:text-base text-amber-200/80 font-bold max-w-xl mx-auto">
              Thời gian xét: {formatDateVietnamese(details.board.startDate)} — {formatDateVietnamese(details.board.endDate)}
            </p>
          </div>
        )}

        {/* SLIDE 2: TOP RANK GRAND CEREMONIAL PODIUM */}
        {slide?.type === 'podium' && (
          <div className="space-y-6 w-full animate-fadeIn flex flex-col items-center">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black text-amber-300 tracking-tight drop-shadow-md">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-semibold">
                {slide.subtitle}
              </p>
            </div>

            {/* 3D CEREMONIAL PODIUM STAGE (ORDER: 2 - 1 - 3) */}
            <div className="flex items-end justify-center gap-4 sm:gap-10 w-full max-w-4xl pt-4 min-h-[380px]">
              {renderPresentPillar(rank2, 2)}
              {renderPresentPillar(rank1, 1)}
              {renderPresentPillar(rank3, 3)}
            </div>

            {/* WINNER CONGRATULATION BANNER (APPEARS AFTER RANK 1) */}
            {podiumRevealStep >= 4 && rank1?.student && (
              <div className="animate-podium-reveal w-full max-w-3xl pt-2">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/60 backdrop-blur-md flex items-center justify-center gap-2.5 text-sm sm:text-base font-black text-amber-200 shadow-2xl">
                  <Award className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>
                    🎉 Xin chúc mừng <span className="text-white underline underline-offset-4">{rank1.student.fullName}</span> — Quán quân dẫn đầu bảng vàng tuần này!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLIDE: TITLE GROUP */}
        {slide?.type === 'title_group' && (
          <div className="space-y-6 animate-fadeIn w-full">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black text-amber-300 tracking-tight drop-shadow-md">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-semibold">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-4 max-w-5xl mx-auto">
              {(slide.data as HonorBoardRecipientDetail[]).map((rec) => (
                <div
                  key={rec.id}
                  className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md text-center space-y-2.5 shadow-xl hover:bg-white/15 transition-all"
                >
                  <div className="flex justify-center mb-3">
                    <StudentAvatar
                      student={rec.student}
                      score={rec.pointsAtAward}
                      rankLevelOrOrder={rec.rankLevelAtAward}
                      preferRankAvatar={true}
                      globalActiveThemeId={globalAvatarSettings.presetThemeId}
                      globalSettings={globalAvatarSettings}
                      uploadedAssetUrls={uploadedAssetUrls}
                      size="lg"
                      shape="circle"
                      className="border-3 border-amber-300/80 shadow-lg ring-4 ring-amber-400/20"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">{rec.student?.fullName}</h3>
                  <p className="text-xs sm:text-sm text-amber-300 font-bold">{rec.rankNameAtAward}</p>
                  <p className="text-xs text-slate-300 italic line-clamp-2">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE: COLLECTIVE */}
        {slide?.type === 'collective' && (
          <div className="space-y-6 animate-fadeIn w-full">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black text-amber-300 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-semibold">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-slate-300 block">Chuyên cần lớp</span>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-2">{details.collectiveMetrics.attendanceRate}%</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-slate-300 block">Lượt thăng cấp</span>
                <p className="text-3xl sm:text-4xl font-black text-purple-400 font-mono mt-2">{details.collectiveMetrics.totalPromotionsInPeriod}</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-slate-300 block">Điểm tích cực</span>
                <p className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-2">+{details.collectiveMetrics.totalMeritPointsInPeriod}</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-slate-300 block">Danh hiệu đã trao</span>
                <p className="text-3xl sm:text-4xl font-black text-blue-400 font-mono mt-2">{details.collectiveMetrics.totalHonors}</p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE: CONGRATS */}
        {slide?.type === 'congrats' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-pink-500 text-white mx-auto flex items-center justify-center shadow-2xl animate-crown-float">
              <PartyPopper className="w-14 h-14" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tight drop-shadow-md">
              CHÚC MỪNG CẢ LỚP!
            </h1>
            <p className="text-lg sm:text-2xl font-extrabold text-white leading-relaxed">
              Mỗi ngày đến trường là một ngày vui và thêm nhiều điều tiến bộ!
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BUTTONS */}
      <div className="flex items-center justify-between z-30 pt-2">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm font-bold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Slide trước
        </button>

        {/* SLIDE DOTS */}
        <div className="hidden sm:flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === currentSlide ? 'w-8 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/60'
              )}
              title={`Chuyển đến Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 disabled:opacity-30 text-sm font-black flex items-center gap-2 shadow-lg transition-all"
        >
          Slide tiếp theo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


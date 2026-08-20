import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { playPromotionFanfare } from '../../../shared/utilities/sound';
import { Sparkles, Trophy, X, ChevronRight, Award, TrendingDown } from 'lucide-react';
import type { DirectLevelChangeNotification } from '../../../core/types/avatar-theme.types';
import {
  buildLevelChangeModalViewModel,
  buildBatchLevelChangeModalViewModel,
  type LevelChangeModalViewModel,
  type BatchLevelChangeModalViewModel,
  type ViewModelOptions,
} from '../../../core/services/level-up-celebration/level-change-modal-view-model';

export interface LevelUpCelebrationModalProps extends ViewModelOptions {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  notifications?: DirectLevelChangeNotification[] | null;
  viewModel?: LevelChangeModalViewModel | BatchLevelChangeModalViewModel | null;
  enableSound?: boolean;
  confettiEnabled?: boolean;
  intensity?: 'FULL' | 'BALANCED' | 'MINIMAL';
  durationMs?: number;
  onComplete?: () => void;
  isPresentationMode?: boolean;
}

type MotionPhase = 'ENTER' | 'CARD_ARRIVAL' | 'ENERGY_BUILD' | 'REVEAL' | 'SETTLE' | 'HOLD' | 'EXIT';

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  onClose,
  data,
  notifications,
  viewModel,
  enableSound = true,
  confettiEnabled = true,
  intensity = 'BALANCED',
  durationMs = 5200,
  onComplete,
  isPresentationMode = false,
  showDelta = true,
  showCurrent = true,
  privacyMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<MotionPhase>('ENTER');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const activeModalIdRef = useRef<string>('');

  // 1. Chuẩn hóa View Model qua Pure Mapper (Single hoặc Batch)
  const normalizedViewModel = useMemo(() => {
    if (viewModel) return viewModel;

    const notifs: DirectLevelChangeNotification[] = [];
    if (notifications && notifications.length > 0) {
      notifs.push(...notifications);
    } else if (data) {
      if ('notificationId' in data) {
        notifs.push(data as DirectLevelChangeNotification);
      } else {
        // Fallback convert legacy object
        notifs.push({
          notificationId: 'legacy-demo',
          mutationId: 'demo-mutation',
          studentId: data.studentId || 'demo-student',
          studentDisplayName: data.studentName || 'Học sinh',
          studentCode: data.studentCode,
          classId: 'demo-class',
          direction: data.direction || 'UP',
          previousScore: data.previousScore ?? 80,
          currentScore: data.currentScore ?? 110,
          fromLevelId: data.fromLevel?.levelId || 1,
          toLevelId: data.toLevel?.levelId || 2,
          previousLevel: data.fromLevel,
          currentLevel: data.toLevel,
          levelsChanged: data.levelsChanged || data.levelsGained || 1,
          settingsRevision: 1,
          createdAt: new Date().toISOString(),
          preferredTarget: 'PRESENTATION',
        });
      }
    }

    if (notifs.length === 0) return null;
    if (notifs.length === 1) {
      return buildLevelChangeModalViewModel(notifs[0]!, { showDelta, showCurrent, privacyMode });
    }
    return buildBatchLevelChangeModalViewModel(notifs, { showDelta, showCurrent, privacyMode });
  }, [viewModel, notifications, data, showDelta, showCurrent, privacyMode]);

  const isBatch = normalizedViewModel && 'items' in normalizedViewModel;
  const singleVM = isBatch ? null : (normalizedViewModel as LevelChangeModalViewModel | null);
  const batchVM = isBatch ? (normalizedViewModel as BatchLevelChangeModalViewModel | null) : null;

  const currentModalId = normalizedViewModel?.id || '';
  const isLevelDown = singleVM?.variant === 'LEVEL_DOWN' || batchVM?.isAllDown;

  // 2. Reduced Motion Detector
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    return undefined;
  }, []);

  // 3. Keyboard Esc dismiss handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || isPresentationMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isPresentationMode, handleClose]);

  // 4. Motion Phase Timeline (Phase 1 -> Phase 7) với Scoped Timer Guard
  useEffect(() => {
    if (!isOpen || !normalizedViewModel) {
      setPhase('ENTER');
      setAvatarError(false);
      return;
    }

    activeModalIdRef.current = currentModalId;
    setAvatarError(false);

    if (reducedMotion) {
      setPhase('HOLD');
      return;
    }

    setPhase('ENTER');

    const modalId = currentModalId;
    const effectiveDuration = isLevelDown ? Math.min(3800, durationMs) : durationMs;

    // Phase 2: Card arrival
    const tArrival = setTimeout(() => {
      if (activeModalIdRef.current === modalId) setPhase('CARD_ARRIVAL');
    }, 250);

    // Phase 3: Energy build
    const tEnergy = setTimeout(() => {
      if (activeModalIdRef.current === modalId) setPhase('ENERGY_BUILD');
    }, 700);

    // Phase 4: Upgrade reveal & Audio chime
    const tReveal = setTimeout(() => {
      if (activeModalIdRef.current === modalId) {
        setPhase('REVEAL');
        if (enableSound && !isLevelDown) {
          playPromotionFanfare(true);
        }
      }
    }, 1150);

    // Phase 5: Content settle
    const tSettle = setTimeout(() => {
      if (activeModalIdRef.current === modalId) setPhase('SETTLE');
    }, 1650);

    // Phase 6: Hold
    const tHold = setTimeout(() => {
      if (activeModalIdRef.current === modalId) setPhase('HOLD');
    }, 2150);

    // Phase 7: Exit transition
    const tExit = setTimeout(() => {
      if (activeModalIdRef.current === modalId) setPhase('EXIT');
    }, Math.max(2200, effectiveDuration - 500));

    // Complete / Close
    const tComplete = setTimeout(() => {
      if (activeModalIdRef.current === modalId) {
        if (onComplete) {
          onComplete();
        } else {
          onClose();
        }
      }
    }, effectiveDuration);

    return () => {
      clearTimeout(tArrival);
      clearTimeout(tEnergy);
      clearTimeout(tReveal);
      clearTimeout(tSettle);
      clearTimeout(tHold);
      clearTimeout(tExit);
      clearTimeout(tComplete);
    };
  }, [isOpen, normalizedViewModel, currentModalId, durationMs, enableSound, isLevelDown, reducedMotion, onComplete, onClose]);

  // 5. One-Shot Confetti Particles (Canvas Rendered, Limited Budget: 24-36 Desktop / 10-18 Mobile)
  useEffect(() => {
    if (!isOpen || !normalizedViewModel || isLevelDown || !confettiEnabled || reducedMotion || intensity === 'MINIMAL') {
      return;
    }
    if (phase !== 'REVEAL' && phase !== 'SETTLE' && phase !== 'HOLD') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext ? (canvas.getContext('2d') as CanvasRenderingContext2D) : null;
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    let animationFrameId: number;
    const parent = canvas.parentElement;
    const width = (canvas.width = parent?.clientWidth || window.innerWidth || 800);
    const height = (canvas.height = parent?.clientHeight || window.innerHeight || 600);

    const isMobile = width < 640;
    const particleBudget = isMobile
      ? (intensity === 'FULL' ? 18 : 12)
      : (intensity === 'FULL' ? 36 : 24);

    const baseAccent = singleVM?.currentLevel.cardBaseColor || '#f59e0b';
    const colorPalette = [baseAccent, '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#fbbf24', '#ffffff'];

    const particles = Array.from({ length: particleBudget }, (_, i) => ({
      x: width / 2 + (Math.random() - 0.5) * 60,
      y: height / 2 - 20,
      vx: (Math.random() - 0.5) * (isMobile ? 8 : 12),
      vy: (Math.random() - 0.75) * (isMobile ? 10 : 15),
      size: Math.random() * 6 + 4,
      color: colorPalette[i % colorPalette.length]!,
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    const startTime = Date.now();

    const renderFrame = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24; // subtle gravity
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, 1 - elapsed / 2600);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      if (elapsed < 2800) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, normalizedViewModel, isLevelDown, phase, confettiEnabled, intensity, reducedMotion, singleVM]);

  if (!isOpen || !normalizedViewModel) return null;

  const isUpgraded = phase === 'REVEAL' || phase === 'SETTLE' || phase === 'HOLD' || phase === 'EXIT';
  const isExit = phase === 'EXIT';

  const defaultAccentColor = singleVM?.currentLevel.cardBaseColor || (isLevelDown ? '#64748b' : '#f59e0b');
  const cardTheme = singleVM?.currentLevel.cardTheme;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-change-modal-title"
      aria-describedby="level-change-modal-desc"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none transition-all duration-300 ${
        isExit ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        ['--level-accent' as any]: defaultAccentColor,
        ['--level-border' as any]: cardTheme?.border || defaultAccentColor,
        ['--level-background' as any]: cardTheme?.surfaceEnd || '#ffffff',
        ['--level-foreground' as any]: cardTheme?.textPrimary || '#0f172a',
      }}
    >
      {/* 1. SCREEN READER LIVE ANNOUNCEMENT (Triggered exactly once) */}
      <div className="sr-only" aria-live="polite">
        {singleVM ? singleVM.content.ariaAnnouncement : batchVM?.header.ariaAnnouncement}
      </div>

      {/* 2. BACKDROP BLUR & DARKEN */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl transition-opacity duration-500"
        onClick={!isPresentationMode ? handleClose : undefined}
      />

      {/* 3. CONFETTI PARTICLES CANVAS (ARIA Hidden) */}
      {!isLevelDown && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-20 w-full h-full"
        />
      )}

      {/* 4. MODAL MAIN CONTAINER */}
      <div
        className={`relative z-30 w-full mx-auto flex flex-col items-center ${
          singleVM ? 'max-w-lg sm:max-w-xl' : 'max-w-4xl'
        }`}
      >
        {/* AMBIENT LIGHTING GLOW ORBS (ARIA Hidden) */}
        {!isLevelDown && (
          <>
            <div
              aria-hidden="true"
              className="absolute -top-24 -left-16 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-[100px] opacity-40 pointer-events-none transition-all duration-700 animate-pulse-slow"
              style={{ backgroundColor: defaultAccentColor }}
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-16 w-72 sm:w-80 h-72 sm:h-80 rounded-full blur-[90px] opacity-25 pointer-events-none transition-all duration-700 bg-indigo-500"
            />
          </>
        )}

        {/* CLOSE BUTTON (Teacher console only) */}
        {!isPresentationMode && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng thông báo (Esc)"
            className="absolute top-2 right-2 sm:-top-3 sm:-right-3 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white/90 hover:text-white border border-white/20 backdrop-blur-lg shadow-lg transition-all duration-200 z-40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95"
            title="Đóng thông báo (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* ========================================================================= */}
        {/* SINGLE STUDENT HERO MODAL */}
        {/* ========================================================================= */}
        {singleVM && (
          <div className="w-full flex flex-col items-center">
            {/* EYEBROW BADGE */}
            {singleVM.content.eyebrow && (
              <div className="mb-3 text-center">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 border border-yellow-200/80 animate-bounce">
                  <Sparkles className="w-4 h-4 text-amber-900" />
                  <span>{singleVM.content.eyebrow}</span>
                  <Sparkles className="w-4 h-4 text-amber-900" />
                </div>
              </div>
            )}

            {/* MAIN HERO CARD */}
            <div
              id="level-change-modal-title"
              className="w-full rounded-3xl p-6 sm:p-8 text-center shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] border border-white/80 transition-all duration-500 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/95 to-slate-100/90 backdrop-blur-2xl"
              style={{
                boxShadow: `0 25px 60px -12px ${defaultAccentColor}30, 0 0 0 1px ${defaultAccentColor}25, 0 0 40px -5px ${defaultAccentColor}15`,
              }}
            >
              {/* TOP CARD SUBTLE ACCENT RADIAL SHINE */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isLevelDown
                    ? 'radial-gradient(circle at 50% 0%, rgba(100, 116, 139, 0.12) 0%, transparent 65%)'
                    : `radial-gradient(circle at 50% 0%, ${defaultAccentColor}22 0%, ${defaultAccentColor}06 45%, transparent 70%)`,
                }}
              />

              {/* TOP COLOR ACCENT BAR */}
              <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1.5 opacity-90"
                style={{
                  background: isLevelDown
                    ? 'linear-gradient(90deg, transparent, #64748b, transparent)'
                    : `linear-gradient(90deg, transparent, ${defaultAccentColor}, transparent)`,
                }}
              />

              {/* ENERGY RINGS (Only for UP full intensity) */}
              {!reducedMotion && !isLevelDown && intensity === 'FULL' && isUpgraded && (
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-48 h-48 rounded-full border-2 border-dashed opacity-35 animate-spin-slow"
                    style={{ borderColor: defaultAccentColor }}
                  />
                  <div
                    className="w-64 h-64 rounded-full border border-dotted opacity-20 animate-reverse-spin"
                    style={{ borderColor: defaultAccentColor }}
                  />
                </div>
              )}

              {/* 1. AVATAR HERO PRESENTATION */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <div
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 shadow-2xl transition-transform duration-500 hover:scale-105"
                  style={{
                    background: isLevelDown
                      ? 'linear-gradient(135deg, #64748b, #94a3b8)'
                      : `linear-gradient(135deg, ${defaultAccentColor}, #ffffff, ${defaultAccentColor}88)`,
                    boxShadow: isLevelDown
                      ? '0 12px 28px -6px rgba(100, 116, 139, 0.4)'
                      : `0 14px 35px -6px ${defaultAccentColor}55`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-white shadow-inner">
                    {/* AVATAR IMAGE WITH GRACEFUL INITIALS FALLBACK */}
                    {!avatarError && singleVM.currentLevel.avatarSrc ? (
                      <img
                        src={singleVM.currentLevel.avatarSrc}
                        alt={singleVM.currentLevel.avatarAlt}
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-black text-xl sm:text-2xl text-white select-none"
                        style={{ backgroundColor: defaultAccentColor }}
                      >
                        {singleVM.student.initials || <Trophy className="w-12 h-12 text-white" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* LEVEL BADGE CHIP */}
                <div className="mt-3.5">
                  <span
                    className="px-4 py-1 rounded-full text-xs sm:text-sm font-black shadow-md inline-flex items-center gap-1.5 border border-white/40"
                    style={{
                      backgroundColor: defaultAccentColor,
                      color: '#ffffff',
                      boxShadow: `0 4px 14px -2px ${defaultAccentColor}60`,
                    }}
                  >
                    {isLevelDown ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {singleVM.content.levelBadgeLabel}
                  </span>
                </div>
              </div>

              {/* 2. STUDENT NAME & CELEBRATION HEADLINE */}
              <div className="space-y-1.5 mt-3 relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2 px-2">
                  {singleVM.student.displayName}
                </h2>

                <p className="text-sm sm:text-base font-bold text-slate-700">
                  {singleVM.content.headline}
                </p>

                {/* CONFIGURED LEVEL NAME */}
                <div className="inline-block px-4 py-1.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 font-extrabold text-sm sm:text-base mt-1 shadow-2xs backdrop-blur-xs">
                  {singleVM.currentLevel.shortLabel} •{' '}
                  <span style={{ color: defaultAccentColor }}>{singleVM.currentLevel.name}</span>
                </div>

                {/* 3. PREVIOUS -> CURRENT TRANSITION CHIP */}
                <div className="flex items-center justify-center gap-2 pt-2.5 text-xs sm:text-sm font-bold text-slate-600">
                  <span className="px-3 py-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
                    {singleVM.previousLevel.shortLabel} ({singleVM.previousLevel.name})
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span
                    className="px-3.5 py-1 rounded-xl font-black shadow-xs border"
                    style={{
                      backgroundColor: `${defaultAccentColor}18`,
                      borderColor: `${defaultAccentColor}60`,
                      color: defaultAccentColor,
                    }}
                  >
                    {singleVM.currentLevel.shortLabel} ({singleVM.currentLevel.name})
                  </span>
                </div>

                {/* OPTIONAL SUPPORTING TEXT */}
                {singleVM.content.supportingText && (
                  <p className="text-xs font-extrabold text-emerald-700 pt-1">
                    {singleVM.content.supportingText}
                  </p>
                )}

                {/* 4. OPTIONAL SCORE SUMMARY ROW */}
                {singleVM.score?.formattedSummary && (
                  <div className="pt-2 text-xs sm:text-sm font-extrabold text-indigo-700">
                    {singleVM.score.formattedSummary}
                  </div>
                )}
              </div>

              {/* 5. INSPIRATIONAL / NEUTRAL SUBTEXT */}
              <p
                id="level-change-modal-desc"
                className="text-xs sm:text-sm text-slate-600 italic max-w-md mx-auto mt-4 pt-3.5 border-t border-slate-200/70 leading-relaxed relative z-10"
              >
                {isLevelDown
                  ? 'Thông tin cấp bậc của học sinh đã được đồng bộ chính xác theo kết quả điểm số mới.'
                  : 'Thành tích xuất sắc! Sự nỗ lực và chăm chỉ của em đã mở khóa thành công cấp bậc mới!'}
              </p>

              {/* 6. ACTION BUTTON (Single-screen teacher controller only) */}
              {!isPresentationMode && (
                <div className="mt-5 flex justify-center relative z-10">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-8 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 border border-white/20"
                    style={{
                      backgroundColor: defaultAccentColor,
                      color: '#ffffff',
                      boxShadow: `0 8px 24px -4px ${defaultAccentColor}70`,
                    }}
                  >
                    {isLevelDown ? <Award className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                    {isLevelDown ? 'Đã hiểu' : 'Tuyệt vời!'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BATCH GRID MODAL (2+ STUDENTS) */}
        {/* ========================================================================= */}
        {batchVM && (
          <div className="w-full bg-gradient-to-b from-white via-slate-50/95 to-slate-100/90 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] border border-white/80 backdrop-blur-2xl text-center relative overflow-hidden">
            {/* TOP SHINE */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12)_0%,transparent_65%)]"
            />

            {batchVM.header.eyebrow && (
              <div className="mb-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/90 border border-amber-200/80 text-amber-950 font-black text-xs shadow-xs relative z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>{batchVM.header.eyebrow}</span>
              </div>
            )}

            <h2 id="level-change-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 mb-5 relative z-10">
              {batchVM.header.title}
            </h2>

            <div
              className={`grid gap-4 relative z-10 ${
                batchVM.items.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {batchVM.items.slice(0, 4).map((item) => {
                const itemAccent = item.currentLevel.cardBaseColor || '#f59e0b';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border bg-white/80 backdrop-blur-xs flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden"
                    style={{ borderColor: `${itemAccent}60` }}
                  >
                    {/* Top border accent line */}
                    <div
                      className="absolute top-0 inset-x-0 h-1"
                      style={{ backgroundColor: itemAccent }}
                    />

                    <div
                      className="w-16 h-16 rounded-full p-1 shadow-md mb-2.5 mt-1"
                      style={{
                        background: `linear-gradient(135deg, ${itemAccent}, #ffffff)`,
                        boxShadow: `0 6px 18px -3px ${itemAccent}40`,
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center border border-white">
                        {item.currentLevel.avatarSrc ? (
                          <img
                            src={item.currentLevel.avatarSrc}
                            alt={item.currentLevel.avatarAlt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-black text-sm text-slate-700">{item.student.initials}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 truncate max-w-full">
                      {item.student.displayName}
                    </h3>
                    <p className="text-xs font-black mt-0.5" style={{ color: itemAccent }}>
                      {item.currentLevel.shortLabel} • {item.currentLevel.name}
                    </p>
                    <span className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/70 text-[11px] font-bold text-slate-600">
                      {item.previousLevel.shortLabel} ➔ {item.currentLevel.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* OVERFLOW SUMMARY BADGE (>4 STUDENTS) */}
            {batchVM.overflowCount > 0 && (
              <div className="mt-4 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-slate-700 text-xs font-bold relative z-10">
                +{batchVM.overflowCount} học sinh khác cũng đã được cập nhật cấp bậc thành công!
              </div>
            )}

            {!isPresentationMode && (
              <div className="mt-6 flex justify-center relative z-10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-8 py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs sm:text-sm shadow-lg hover:bg-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-95"
                >
                  Hoàn tất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

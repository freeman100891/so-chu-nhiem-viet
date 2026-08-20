import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { honorBoardService, type HonorBoardDetailsResult } from '../../../core/services/honor-board.service';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Crown,
  PartyPopper,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export const HonorBoardPresentPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<HonorBoardDetailsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const data = await honorBoardService.getBoardDetails(boardId);
      setDetails(data);
    } catch (err) {
      console.error('Error loading presentation data:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

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
        title: '🥇 Dẫn Đầu Cấp Bậc Thi Đua',
        subtitle: 'Những chiến sĩ nhỏ đạt cấp bậc và thành tích xuất sắc nhất',
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        navigate(`/conduct/honor-board/${boardId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, navigate, boardId]);

  if (loading || !details) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white select-none flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
      {/* TOP CONTROLS */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
            {currentSlide + 1} / {slides.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Dùng phím mũi tên [←] [→] để chuyển slide • [Esc] để thoát
          </span>
        </div>

        <button
          onClick={() => navigate(`/conduct/honor-board/${boardId}`)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Thoát trình chiếu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* MAIN 16:9 SLIDE CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-6 z-10 max-w-5xl mx-auto w-full">
        {/* SLIDE 1: WELCOME */}
        {slide?.type === 'welcome' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-amber-400 text-amber-950 mx-auto flex items-center justify-center shadow-2xl animate-bounce">
              <Trophy className="w-14 h-14" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tight uppercase">
              BẢNG VÀNG DANH HIỆU
            </h1>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {details.board.title}
            </p>
            <p className="text-base sm:text-lg text-amber-200/80 max-w-2xl mx-auto">
              Thời gian xét: {formatDateVietnamese(details.board.startDate)} - {formatDateVietnamese(details.board.endDate)}
            </p>
          </div>
        )}

        {/* SLIDE 2: PODIUM */}
        {slide?.type === 'podium' && (
          <div className="space-y-6 animate-fadeIn w-full">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black text-amber-300 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">{slide.subtitle}</p>
            </div>

            <div className="flex items-end justify-center gap-4 sm:gap-8 pt-4">
              {details.topRankPodium.slice(0, 3).map((rec, idx) => {
                const pos = rec.position || idx + 1;
                const is1 = pos === 1;
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'flex flex-col items-center p-4 rounded-3xl border backdrop-blur-md transition-transform',
                      is1
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 scale-110 shadow-2xl ring-4 ring-amber-400/30'
                        : 'bg-white/10 border-slate-400 text-white'
                    )}
                  >
                    {is1 && <Crown className="w-8 h-8 text-amber-400 fill-current mb-2 animate-bounce" />}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 border-2 border-white/40 flex items-center justify-center text-2xl font-black mb-3">
                      {rec.student?.fullName.charAt(0)}
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white">{rec.student?.fullName}</h3>
                    <p className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">{rec.rankNameAtAward}</p>
                    <span className="mt-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase">
                      Hạng {pos}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE: TITLE GROUP */}
        {slide?.type === 'title_group' && (
          <div className="space-y-6 animate-fadeIn w-full">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black text-amber-300 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto">
              {(slide.data as import('../../../core/services/honor-board.service').HonorBoardRecipientDetail[]).map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md text-center space-y-2"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400/40 text-amber-300 font-black text-xl mx-auto flex items-center justify-center">
                    {rec.student?.fullName?.charAt(0)}
                  </div>
                  <h3 className="text-base font-black text-white">{rec.student?.fullName}</h3>
                  <p className="text-xs text-amber-300 font-bold">{rec.rankNameAtAward}</p>
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
              <p className="text-sm sm:text-base text-slate-300">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
              <div className="p-5 rounded-3xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-slate-300 block">Chuyên cần lớp</span>
                <p className="text-3xl font-black text-emerald-400 font-mono mt-2">{details.collectiveMetrics.attendanceRate}%</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-slate-300 block">Lượt thăng cấp</span>
                <p className="text-3xl font-black text-purple-400 font-mono mt-2">{details.collectiveMetrics.totalPromotionsInPeriod}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-slate-300 block">Điểm tích cực</span>
                <p className="text-3xl font-black text-amber-400 font-mono mt-2">+{details.collectiveMetrics.totalMeritPointsInPeriod}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-slate-300 block">Danh hiệu đã trao</span>
                <p className="text-3xl font-black text-blue-400 font-mono mt-2">{details.collectiveMetrics.totalHonors}</p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE: CONGRATS */}
        {slide?.type === 'congrats' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-pink-500 text-white mx-auto flex items-center justify-center shadow-2xl animate-bounce">
              <PartyPopper className="w-14 h-14" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tight">
              CHÚC MỪNG CẢ LỚP!
            </h1>
            <p className="text-lg sm:text-2xl font-extrabold text-white max-w-xl mx-auto leading-relaxed">
              Mỗi ngày đến trường là một ngày vui và thêm nhiều điều tiến bộ!
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BUTTONS */}
      <div className="flex items-center justify-between z-20">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm font-bold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Slide trước
        </button>

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

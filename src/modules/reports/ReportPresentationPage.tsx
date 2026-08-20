import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { classRepository } from '../../core/repositories/class.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import {
  reportAggregationService,
  type FullReportViewModel,
  type ReportFilterParams,
} from '../../core/services/report-aggregation.service';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Trophy,
  Award,
  CalendarCheck,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

export const ReportPresentationPage: React.FC = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<FullReportViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Load report data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const settings = await settingsRepository.getSettings();
        let yearId = settings.activeAcademicYearId;
        if (!yearId) {
          const curYear = await academicYearRepository.getCurrentYear();
          yearId = curYear?.id;
        }

        let clsId = settings.activeClassId;
        if (!clsId && yearId) {
          const classes = await classRepository.findByAcademicYear(yearId);
          clsId = classes[0]?.id;
        }

        if (yearId && clsId) {
          const today = new Date();
          const firstDayStr = getTodayDateString(new Date(today.getFullYear(), today.getMonth(), 1));
          const lastDayStr = getTodayDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));

          const filter: ReportFilterParams = {
            classId: clsId,
            academicYearId: yearId,
            termId: null,
            startDate: firstDayStr,
            endDate: lastDayStr,
            periodType: 'this_month',
            comparePreviousPeriod: false,
          };

          const data = await reportAggregationService.generateFullReport(filter);
          setReport(data);
        }
      } catch (err) {
        console.error('Error loading presentation data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalSlides = 5;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          navigate('/reports');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, navigate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loading || !report) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white text-base">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin mr-3" />
        <span>Đang chuẩn bị trang trình chiếu thành tích...</span>
      </div>
    );
  }

  // Top high ranks
  const topLevels = [...report.rankDistribution.levels]
    .filter((l) => l.count > 0)
    .reverse()
    .slice(0, 4);

  // All promotions
  const allPromotions = report.promotionHistory.flatMap((h) => h.promotions);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden z-50">
      {/* TOP HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wide uppercase">
              {report.className} · Báo Cáo Thành Tích Thi Đua
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Khoảng thời gian: {formatDateVietnamese(report.filter.startDate)} – {formatDateVietnamese(report.filter.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 h-10 px-3"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 h-10 px-3"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* SLIDE CONTENT AREA (16:9 RATIO CONTAINER) */}
      <div className="my-auto w-full max-w-6xl mx-auto py-6">
        {/* SLIDE 0: TỔNG QUAN TÍCH CỰC */}
        {currentSlide === 0 && (
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="space-y-3">
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-sm border border-emerald-500/40">
                CHÀO MỪNG CÁC CHIẾN SĨ NHỎ
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                TỔNG HỢP THI ĐUA & RÈN LUYỆN
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-2">
                <Users className="w-8 h-8 text-blue-400 mx-auto" />
                <span className="text-xs text-slate-400 font-bold block">Sĩ số lớp</span>
                <strong className="text-4xl font-black font-mono text-white block">
                  {report.kpis.activeStudentsCount.current}
                </strong>
              </div>

              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-2">
                <CalendarCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <span className="text-xs text-slate-400 font-bold block">Tỷ lệ chuyên cần</span>
                <strong className="text-4xl font-black font-mono text-emerald-400 block">
                  {report.kpis.attendanceRate.current}%
                </strong>
              </div>

              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-2">
                <Award className="w-8 h-8 text-amber-400 mx-auto" />
                <span className="text-xs text-slate-400 font-bold block">Điểm thi đua tích cực</span>
                <strong className="text-4xl font-black font-mono text-amber-400 block">
                  +{report.kpis.meritPoints.current}
                </strong>
              </div>

              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-2">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                <span className="text-xs text-slate-400 font-bold block">Lượt thăng cấp</span>
                <strong className="text-4xl font-black font-mono text-purple-400 block">
                  {allPromotions.length}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: CÁC CẤP BẬC CAO NHẤT */}
        {currentSlide === 1 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl font-black text-amber-400 flex items-center justify-center gap-3">
              <Award className="w-8 h-8" /> CÁC CHIẾN SĨ TIÊU BIỂU DẪN ĐẦU CẤP BẬC
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-5xl mx-auto">
              {topLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  className="p-5 rounded-3xl bg-slate-800/70 border border-slate-700 space-y-3"
                >
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl font-black text-white shadow-lg"
                    style={{ backgroundColor: lvl.color }}
                  >
                    {lvl.level}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{lvl.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{lvl.count} chiến sĩ nhỏ</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-700/60 text-xs">
                    {lvl.students.slice(0, 3).map((st) => (
                      <p key={st.id} className="font-bold text-amber-300 truncate">
                        {st.fullName}
                      </p>
                    ))}
                    {lvl.students.length > 3 && (
                      <p className="text-[10px] text-slate-400">và {lvl.students.length - 3} bạn khác...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 2: TUYÊN DƯƠNG THĂNG CẤP */}
        {currentSlide === 2 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl font-black text-purple-400 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8" /> CHÚC MỪNG CÁC CHIẾN SĨ VỪA THĂNG CẤP
            </h2>

            {allPromotions.length === 0 ? (
              <p className="text-slate-400 text-base py-12">
                Hãy cùng nhau cố gắng tích lũy điểm thi đua để thăng cấp trong tuần tới nhé!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4">
                {allPromotions.slice(0, 6).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-purple-950/40 border border-purple-800/60 space-y-2 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center shrink-0">
                      ★
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{p.studentName}</h4>
                      <p className="text-xs text-purple-300 font-medium">
                        Thăng cấp lên <strong className="text-amber-300">{p.rankName}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLIDE 3: BẢNG VÀNG DANH HIỆU */}
        {currentSlide === 3 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl font-black text-amber-400 flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8" /> VINH DANH BẢNG VÀNG DANH HIỆU
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
              {report.honorTitlesStats
                .filter((t) => t.recipientCount > 0)
                .slice(0, 4)
                .map((t) => (
                  <div
                    key={t.title.id}
                    className="p-5 rounded-3xl bg-slate-800/70 border border-amber-500/40 space-y-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-current" />
                      <h4 className="text-sm font-black text-amber-300 truncate">{t.title.name}</h4>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-slate-700 text-xs">
                      {t.recipients.slice(0, 3).map((r, i) => (
                        <p key={i} className="font-bold text-white truncate">
                          {r.studentName}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SLIDE 4: KHÍCH LỆ & KẾT LUẬN */}
        {currentSlide === 4 && (
          <div className="text-center space-y-6 max-w-3xl mx-auto animate-fadeIn">
            <span className="text-6xl">🌟</span>
            <h2 className="text-4xl sm:text-5xl font-black text-amber-400">
              CẢ LỚP CÙNG NHAU TIẾN BỘ!
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Mỗi ngày đến trường là một ngày vui. Chúc tất cả các con luôn chăm ngoan, đoàn kết, hăng say phát biểu và đạt thêm nhiều cấp bậc mới!
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & SLIDE INDICATORS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          className="text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 h-10 px-4 font-bold"
          leftIcon={<ChevronLeft className="w-5 h-5" />}
        >
          Trang trước [←]
        </Button>

        {/* SLIDE DOTS */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                currentSlide === idx ? 'bg-amber-400 scale-125' : 'bg-slate-700 hover:bg-slate-500'
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          className="text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 h-10 px-4 font-bold"
          rightIcon={<ChevronRight className="w-5 h-5" />}
        >
          Tiếp theo [→]
        </Button>
      </div>
    </div>
  );
};

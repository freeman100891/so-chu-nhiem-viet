import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { ThemeMascotSVG } from './ThemeMascotSVG';
import type { DashboardGreeting } from '../../../core/services/dashboard-overview.service';
import type { ThemeId } from '../../../core/services/theme.service';
import {
  CalendarCheck2,
  Tv,
  Dices,
  Sparkles,
  Award,
} from 'lucide-react';

export interface DashboardHeroProps {
  greeting: DashboardGreeting;
  themeId?: ThemeId;
  onOpenLiveClass?: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  greeting,
  themeId = 'military',
  onOpenLiveClass,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-app-surface via-app-surface to-app-primary-light/40 border border-app shadow-sm p-6 sm:p-8 transition-all">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-app-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LEFT / CENTER: GREETING & CONTEXT (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          {/* BADGE PILLS */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-app-primary-light text-app-primary text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              {greeting.className}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              {greeting.academicYearName} • {greeting.termName}
            </span>
            <span className="text-xs text-app-muted font-medium ml-1">
              {greeting.dateVietnamese}
            </span>
          </div>

          {/* MAIN SALUTATION */}
          <div className="space-y-1 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-app-main tracking-tight">
              {greeting.salutation}, <span className="text-app-primary">{greeting.teacherName}!</span>
            </h1>
            <p className="text-sm sm:text-base text-app-muted font-medium max-w-xl leading-relaxed">
              {greeting.quote}
            </p>
          </div>

          {/* 3 PRIMARY HERO ACTION BUTTONS */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              className="font-bold px-5 shadow-sm hover:shadow-md transition-all rounded-xl"
              leftIcon={<CalendarCheck2 className="w-4 h-4" />}
              onClick={() => navigate('/attendance')}
            >
              Điểm danh hôm nay
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="font-bold px-4 rounded-xl"
              leftIcon={<Tv className="w-4 h-4" />}
              onClick={() => {
                if (onOpenLiveClass) onOpenLiveClass();
                else navigate('/live-classroom');
              }}
            >
              Mở lớp trực tuyến
            </Button>

            <Button
              variant="outline"
              size="md"
              className="font-bold px-4 rounded-xl"
              leftIcon={<Dices className="w-4 h-4 text-purple-600" />}
              onClick={() => navigate('/live-classroom')}
              title="Gọi tên ngẫu nhiên học sinh trong lớp"
            >
              Gọi tên ngẫu nhiên
            </Button>
          </div>
        </div>

        {/* RIGHT: TEACHER AVATAR & FAST KPI (4/12) */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
          <div className="relative flex items-center justify-center p-2 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs border border-app/50 shadow-xs">
            {greeting.teacherAvatar ? (
              <img
                src={greeting.teacherAvatar}
                alt={greeting.teacherName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover transform transition-transform hover:scale-105"
              />
            ) : (
              <ThemeMascotSVG themeId={themeId} className="w-28 h-28 sm:w-32 sm:h-32 transform transition-transform hover:scale-105" />
            )}
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold flex items-center gap-1 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Sẵn sàng dạy tốt!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Flame, Star, Trophy, Award } from 'lucide-react';

interface ClassAchievementsCardProps {
  streakDays?: number;
  totalPositivePoints?: number;
  honoredCount?: number;
  className?: string;
}

export const ClassAchievementsCard: React.FC<ClassAchievementsCardProps> = ({
  streakDays = 4,
  totalPositivePoints = 126,
  honoredCount = 3,
  className = '',
}) => {
  return (
    <div className={`p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
            Thành Tích Lớp Mình (Team Glory)
          </h3>
        </div>
        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
          Tuần Này
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 flex flex-col items-center text-center">
          <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300 mb-1.5 shadow-2xs">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
            {streakDays} ngày
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Chuỗi chăm chỉ
          </span>
        </div>

        {/* Positive Points */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col items-center text-center">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 mb-1.5 shadow-2xs">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
            {totalPositivePoints}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Sao tích cực
          </span>
        </div>

        {/* Honored Students */}
        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center text-center">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 mb-1.5 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
            {honoredCount} bạn
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Lên bảng vàng
          </span>
        </div>
      </div>
    </div>
  );
};

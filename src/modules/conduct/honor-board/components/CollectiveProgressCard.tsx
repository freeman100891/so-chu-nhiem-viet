import React from 'react';
import type { HonorBoardDetailsResult } from '../../../../core/services/honor-board.service';
import { Users, Award, Sparkles, CheckCircle2, Target } from 'lucide-react';

export interface CollectiveProgressCardProps {
  metrics: HonorBoardDetailsResult['collectiveMetrics'];
}

export const CollectiveProgressCard: React.FC<CollectiveProgressCardProps> = ({
  metrics,
}) => {
  const percentAwarded = metrics.totalClassStudents > 0
    ? Math.round((metrics.totalStudentsAwarded / metrics.totalClassStudents) * 100)
    : 0;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/50 via-app-surface to-emerald-50/40 border border-app shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-app-main">Cả Lớp Cùng Tiến Bộ</h3>
            <p className="text-xs text-app-muted">Thành quả thi đua tập thể của cả lớp trong kỳ xét</p>
          </div>
        </div>

        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
          {percentAwarded}% học sinh được vinh danh
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-app shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Chuyên cần lớp
          </div>
          <p className="text-xl font-black text-app-main mt-1 font-mono">{metrics.attendanceRate}%</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-app shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Lượt thăng cấp
          </div>
          <p className="text-xl font-black text-app-main mt-1 font-mono">{metrics.totalPromotionsInPeriod}</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-app shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Điểm tích cực
          </div>
          <p className="text-xl font-black text-emerald-600 mt-1 font-mono">+{metrics.totalMeritPointsInPeriod}</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-app shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
            <Target className="w-3.5 h-3.5 text-blue-600" />
            Danh hiệu đã trao
          </div>
          <p className="text-xl font-black text-app-main mt-1 font-mono">{metrics.totalHonors}</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardKPIStatsData } from '../../../core/services/dashboard-overview.service';
import {
  Users,
  UserCheck,
  UserX,
  Award,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardKPIStatsProps {
  stats: DashboardKPIStatsData;
  loading?: boolean;
}

export const DashboardKPIStats: React.FC<DashboardKPIStatsProps> = ({
  stats,
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const items = [
    // 1. SĨ SỐ LỚP
    {
      title: 'Sĩ số học sinh',
      value: stats.totalStudents,
      unit: 'em',
      subtitle: 'Học sinh đang theo học',
      icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bgGradient: 'from-blue-50/70 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/10',
      borderClass: 'border-blue-200/80 dark:border-blue-800/50',
      textClass: 'text-blue-950 dark:text-blue-100',
      route: '/students',
    },
    // 2. CÓ MẶT HÔM NAY
    {
      title: 'Có mặt hôm nay',
      value: stats.isAttendanceTaken ? stats.presentToday : '--',
      unit: stats.isAttendanceTaken ? `/${stats.totalStudents}` : '',
      subtitle: stats.isAttendanceTaken
        ? stats.lateToday > 0
          ? `(trong đó ${stats.lateToday} em muộn)`
          : 'Đầy đủ đúng giờ'
        : 'Chưa chốt điểm danh',
      icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bgGradient: 'from-emerald-50/70 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/10',
      borderClass: 'border-emerald-200/80 dark:border-emerald-800/50',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      route: '/attendance',
    },
    // 3. VẮNG HÔM NAY
    {
      title: 'Vắng hôm nay',
      value: stats.isAttendanceTaken ? stats.absentToday : '--',
      unit: stats.isAttendanceTaken ? 'em' : '',
      subtitle: stats.isAttendanceTaken
        ? stats.excusedAbsentToday > 0
          ? `${stats.excusedAbsentToday} có phép • ${stats.unexcusedAbsentToday} không phép`
          : stats.absentToday === 0
          ? 'Không có em nào vắng'
          : `${stats.absentToday} không phép`
        : 'Chưa ghi nhận',
      icon: <UserX className={cn('w-5 h-5', stats.absentToday > 0 ? 'text-red-600' : 'text-slate-500')} />,
      bgGradient: stats.absentToday > 0
        ? 'from-red-50/70 to-red-100/30 dark:from-red-950/30 dark:to-red-900/10'
        : 'from-slate-50/70 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-800/10',
      borderClass: stats.absentToday > 0
        ? 'border-red-200/80 dark:border-red-800/50'
        : 'border-slate-200/80 dark:border-slate-700/50',
      textClass: stats.absentToday > 0
        ? 'text-red-950 dark:text-red-100'
        : 'text-slate-900 dark:text-slate-100',
      route: '/attendance',
    },
    // 4. ĐIỂM THI ĐUA HÔM NAY
    {
      title: 'Thi đua hôm nay',
      value: stats.todayPointsAwarded >= 0 ? `+${stats.todayPointsAwarded}` : `${stats.todayPointsAwarded}`,
      unit: 'điểm',
      subtitle: stats.todayMeritCount > 0 ? `${stats.todayMeritCount} lượt khen thưởng` : 'Chưa có ghi nhận',
      icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgGradient: 'from-amber-50/70 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10',
      borderClass: 'border-amber-200/80 dark:border-amber-800/50',
      textClass: 'text-amber-950 dark:text-amber-100',
      route: '/conduct',
    },
    // 5. HỌC SINH THĂNG CẤP
    {
      title: 'Thăng cấp thi đua',
      value: stats.recentPromotionsCount,
      unit: 'lượt',
      subtitle: 'Cấp bậc mới đạt được',
      icon: <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgGradient: 'from-purple-50/70 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/10',
      borderClass: 'border-purple-200/80 dark:border-purple-800/50',
      textClass: 'text-purple-950 dark:text-purple-100',
      route: '/conduct/ranks',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {items.map((item, idx) => (
        <div
          key={idx}
          onClick={() => navigate(item.route)}
          className={cn(
            'group relative p-4 rounded-3xl border bg-gradient-to-br transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none overflow-hidden',
            item.bgGradient,
            item.borderClass
          )}
          title={`Xem chi tiết ${item.title}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider line-clamp-1">
              {item.title}
            </span>
            <div className="p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-2xs shrink-0 transition-transform group-hover:scale-110">
              {item.icon}
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1">
            <span className={cn('text-2xl sm:text-3xl font-black font-mono tracking-tight', item.textClass)}>
              {item.value}
            </span>
            {item.unit && (
              <span className="text-xs font-bold text-app-muted">{item.unit}</span>
            )}
          </div>

          <p className="text-[11px] text-app-muted mt-1 truncate font-medium">
            {item.subtitle}
          </p>

          <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
};

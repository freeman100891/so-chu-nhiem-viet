import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import type { DashboardRecentActivityItem } from '../../../core/services/dashboard-overview.service';
import {
  CalendarCheck2,
  Award,
  Sparkles,
  Phone,
  Database,
  Tv,
  FileText,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardRecentActivitiesProps {
  activities: DashboardRecentActivityItem[];
  loading?: boolean;
}

export const DashboardRecentActivities: React.FC<DashboardRecentActivitiesProps> = ({
  activities,
  loading = false,
}) => {
  const navigate = useNavigate();

  const getActivityIcon = (type: DashboardRecentActivityItem['type']) => {
    switch (type) {
      case 'attendance':
        return <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'point':
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
      case 'rank':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      case 'parent':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'backup':
        return <Database className="w-3.5 h-3.5 text-slate-600" />;
      case 'live':
        return <Tv className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-app-primary" />;
    }
  };

  return (
    <Card
      title="Nhật Ký Hoạt Động Gần Đây"
      action={
        <span className="text-xs font-bold text-app-muted">
          {activities.length} hoạt động
        </span>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-app text-app-muted space-y-1">
            <Info className="w-6 h-6 opacity-40 mx-auto" />
            <p className="text-xs font-bold">Chưa có hoạt động nào được ghi nhận gần đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-app max-h-72 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div
                key={act.id}
                onClick={() => act.actionRoute && navigate(act.actionRoute)}
                className={cn(
                  'py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 rounded-xl transition-colors',
                  act.actionRoute ? 'cursor-pointer' : ''
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-main truncate">{act.title}</p>
                    <p className="text-[11px] text-app-muted truncate">{act.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-app-muted">
                  <Clock className="w-3 h-3 inline" />
                  <span>{act.relativeTime}</span>
                  {act.actionRoute && <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import type { DashboardTaskItem } from '../../../core/services/dashboard-overview.service';
import {
  CheckCircle2,
  CalendarX,
  FileEdit,
  PhoneCall,
  ShieldAlert,
  Tv,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardTasksCardProps {
  tasks: DashboardTaskItem[];
  loading?: boolean;
}

export const DashboardTasksCard: React.FC<DashboardTasksCardProps> = ({
  tasks,
  loading = false,
}) => {
  const navigate = useNavigate();

  const getTaskIcon = (type: DashboardTaskItem['type']) => {
    switch (type) {
      case 'attendance_missing':
        return <CalendarX className="w-4 h-4 text-red-600" />;
      case 'attendance_draft':
        return <FileEdit className="w-4 h-4 text-amber-600" />;
      case 'parent_followup':
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'backup_needed':
        return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      case 'live_session_active':
        return <Tv className="w-4 h-4 text-purple-600" />;
      default:
        return <ListTodo className="w-4 h-4 text-app-primary" />;
    }
  };

  return (
    <Card
      title="Việc Cần Làm Hôm Nay"
      action={
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-app-primary-light text-app-primary">
          {tasks.length} nhiệm vụ
        </span>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* ALL TASKS COMPLETED STATE */
          <div className="p-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Tuyệt vời! Các công việc hôm nay đã hoàn thành!
            </h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400 max-w-md mx-auto">
              Lớp học đã được điểm danh đầy đủ và dữ liệu đang trong trạng thái an toàn.
            </p>
          </div>
        ) : (
          /* TASK LIST */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => {
              const isHigh = task.priority === 'high';
              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3',
                    isHigh
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 hover:border-red-300'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'p-2 rounded-xl shrink-0 mt-0.5',
                        isHigh ? 'bg-red-100 text-red-700 dark:bg-red-900/60' : 'bg-slate-200/70 text-slate-700 dark:bg-slate-700'
                      )}
                    >
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold text-app-main truncate">{task.title}</p>
                        {isHigh && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-100 text-red-800 shrink-0">
                            Ưu tiên
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-app-muted mt-0.5 line-clamp-1">{task.description}</p>
                    </div>
                  </div>

                  <Button
                    variant={isHigh ? 'primary' : 'outline'}
                    size="sm"
                    className="text-xs font-bold shrink-0 rounded-xl"
                    onClick={() => navigate(task.actionRoute)}
                  >
                    {task.actionLabel} <ArrowRight className="w-3 h-3 ml-1 inline" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

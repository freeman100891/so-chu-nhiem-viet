import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import type { DashboardSpotlightStudent } from '../../../core/services/dashboard-overview.service';
import {
  Sparkles,
  HeartHandshake,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardStudentSpotlightCardProps {
  positiveList: DashboardSpotlightStudent[];
  attentionList: DashboardSpotlightStudent[];
  loading?: boolean;
}

export const DashboardStudentSpotlightCard: React.FC<DashboardStudentSpotlightCardProps> = ({
  positiveList,
  attentionList,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'positive' | 'attention'>('positive');

  const currentList = activeTab === 'positive' ? positiveList : attentionList;

  return (
    <Card
      title="Gương Mặt Nổi Bật & Cần Đồng Hành"
      action={
        <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('positive')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all flex items-center gap-1',
              activeTab === 'positive'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-app-muted hover:text-app-main'
            )}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            Nổi bật ({positiveList.length})
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all flex items-center gap-1',
              activeTab === 'attention'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-app-muted hover:text-app-main'
            )}
          >
            <HeartHandshake className="w-3 h-3 text-amber-600" />
            Cần đồng hành ({attentionList.length})
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-app-muted">
          {activeTab === 'positive'
            ? 'Những học sinh có nhiều nỗ lực, tích cực phát biểu và thăng tiến điểm thi đua.'
            : 'Những học sinh cần thầy cô dành thêm sự quan tâm, khích lệ và đồng hành kịp thời.'}
        </p>

        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-app text-app-muted space-y-1">
            <Info className="w-6 h-6 opacity-40 mx-auto" />
            <p className="text-xs font-bold">
              {activeTab === 'positive'
                ? 'Chưa có ghi nhận học sinh nổi bật trong tuần.'
                : 'Lớp học đang duy trì nề nếp chuyên cần rất tốt!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-app max-h-64 overflow-y-auto pr-1">
            {currentList.map((item) => (
              <div
                key={item.student.id}
                onClick={() => navigate(`/students/${item.student.id}`)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StudentAvatar
                    student={item.student}
                    size="sm"
                    className="border border-app shrink-0"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-main truncate">{item.student.fullName}</p>
                    <p className="text-[11px] text-app-muted truncate">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded-full font-mono',
                      item.badgeType === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    )}
                  >
                    {item.badgeLabel}
                  </span>
                  <ChevronRight className="w-4 h-4 text-app-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

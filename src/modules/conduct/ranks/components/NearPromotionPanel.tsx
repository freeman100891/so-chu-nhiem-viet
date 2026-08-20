import React from 'react';
import { Card } from '../../../../shared/components/Card';
import { Button } from '../../../../shared/components/Button';
import { StudentAvatar } from '../../../../shared/components/StudentAvatar';
import type { NearPromotionStudentItem } from '../../../../core/services/rank-overview-analytics.service';
import { Zap, ChevronRight, ArrowRight, Info } from 'lucide-react';

export interface NearPromotionPanelProps {
  students: NearPromotionStudentItem[];
  onSelectStudent?: (studentId: string) => void;
  onViewAll: () => void;
  loading?: boolean;
}

export const NearPromotionPanel: React.FC<NearPromotionPanelProps> = ({
  students,
  onSelectStudent,
  onViewAll,
  loading = false,
}) => {
  return (
    <Card
      title="Sắp Thăng Cấp (Cần Bồi Dưỡng)"
      action={
        students.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 font-bold p-0 hover:bg-transparent"
            onClick={onViewAll}
          >
            Xem tất cả ({students.length}) <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Những học sinh sát ngưỡng điểm thăng cấp tiếp theo cần thầy/cô khích lệ kịp thời.
        </p>

        {loading ? (
          <div className="space-y-2 py-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="py-8 text-center text-slate-400 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <Info className="w-6 h-6 mx-auto opacity-40 text-slate-500" />
            <p className="text-xs font-bold">Chưa có học sinh nào sát ngưỡng thăng cấp.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {students.map((item) => (
              <div
                key={item.studentId}
                onClick={() => onSelectStudent && onSelectStudent(item.studentId)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-1 rounded-lg transition-colors cursor-pointer"
              >
                {/* AVATAR & NAME */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <StudentAvatar
                    customAvatar={item.avatar}
                    name={item.studentName}
                    size="sm"
                    className="border border-slate-200 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-800 truncate" title={item.studentName}>
                      {item.studentName}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="font-medium text-slate-700">{item.currentRank.name}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-blue-700">{item.nextRank?.name || ''}</span>
                    </div>
                  </div>
                </div>

                {/* PROGRESS & POINTS NEEDED */}
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
                    <Zap className="w-2.5 h-2.5 text-emerald-600" />
                    Còn {item.pointsToNextRank} điểm
                  </span>
                  <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden ml-auto">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

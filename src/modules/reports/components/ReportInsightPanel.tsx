import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import type { ReportInsight, AttentionStudentItem } from '../../../core/services/report-aggregation.service';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  HeartHandshake,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface ReportInsightPanelProps {
  insights: ReportInsight[];
  attentionStudents: AttentionStudentItem[];
}

export const ReportInsightPanel: React.FC<ReportInsightPanelProps> = ({
  insights,
  attentionStudents,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. AUTOMATED INSIGHTS (7 COLS) */}
      <div className="lg:col-span-7">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-app-main">Nhận Xét & Đánh Giá Tự Động</h3>
                <p className="text-xs text-app-muted font-normal">
                  Phát hiện sư phạm tự động dựa trên dữ liệu thi đua, chuyên cần và tương tác
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-2.5 pt-2">
            {insights.map((ins) => {
              const isSuccess = ins.type === 'success';
              const isWarning = ins.type === 'warning';

              return (
                <div
                  key={ins.id}
                  className={cn(
                    'p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed',
                    isSuccess && 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200',
                    isWarning && 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200',
                    !isSuccess && !isWarning && 'bg-slate-50 dark:bg-slate-800/40 border-app text-app-main'
                  )}
                >
                  <div className="p-1 rounded-lg shrink-0 mt-0.5">
                    {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold uppercase text-[10px] tracking-wider block opacity-70 mb-0.5">
                      [{ins.category}]
                    </span>
                    <p className="font-semibold">{ins.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 2. PRIVATE ATTENTION STUDENTS PANEL (5 COLS) */}
      <div className="lg:col-span-5">
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-pink-600" />
                <div>
                  <h3 className="text-base font-black text-app-main">Học Sinh Cần Quan Tâm</h3>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Chỉ hiển thị riêng tư cho Giáo viên
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 font-mono text-xs font-black">
                {attentionStudents.length} em
              </span>
            </div>
          }
        >
          <div className="pt-2">
            {attentionStudents.length === 0 ? (
              <div className="py-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Tuyệt vời! Không có học sinh nào cần lưu ý đặc biệt.
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Tất cả các con đều duy trì chuyên cần và nề nếp tốt trong kỳ này.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-app max-h-80 overflow-y-auto pr-1">
                {attentionStudents.map((st) => (
                  <div
                    key={st.studentId}
                    onClick={() => navigate(`/students/${st.studentId}`)}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StudentAvatar
                        customAvatar={st.avatar}
                        name={st.studentName}
                        size="sm"
                        className="border border-app shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-app-main truncate">{st.studentName}</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium truncate">
                          {st.reasons.join(' • ')}
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-app-muted" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

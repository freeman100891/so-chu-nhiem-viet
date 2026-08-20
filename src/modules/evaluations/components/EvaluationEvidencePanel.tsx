import React, { useState, useEffect } from 'react';
import { Drawer } from '../../../shared/components/Drawer';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import {
  evaluationSuggestionService,
  type StudentEvidenceSummary,
} from '../../../core/services/evaluation-suggestion.service';
import type { Student, RegulationProfileCode, EvaluationPeriodCode } from '../../../core/database/types';
import {
  Lightbulb,
  Calendar,
  Award,
  Zap,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { formatDateVietnamese } from '../../../shared/utilities/date';

export interface EvaluationEvidencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classId: string;
  academicYearId: string;
  periodCode: EvaluationPeriodCode;
  regulationCode: RegulationProfileCode;
  onApplySuggestedComment: (text: string) => void;
}

export const EvaluationEvidencePanel: React.FC<EvaluationEvidencePanelProps> = ({
  isOpen,
  onClose,
  student,
  classId,
  academicYearId,
  periodCode,
  regulationCode,
  onApplySuggestedComment,
}) => {
  const [evidence, setEvidence] = useState<StudentEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      evaluationSuggestionService
        .aggregateEvidence(classId, student.id, academicYearId, periodCode, regulationCode)
        .then((res) => setEvidence(res))
        .catch((err) => console.error('Error loading evidence:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, classId, student.id, academicYearId, periodCode, regulationCode]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Minh Chứng & Gợi Ý Sư Phạm — ${student.fullName}`}>
      {loading || !evidence ? (
        <LoadingSkeleton type="card" count={3} />
      ) : (
        <div className="space-y-4 text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-center space-y-0.5">
              <Calendar className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <p className="text-[10px] text-blue-700">Chuyên cần</p>
              <p className="text-base font-bold font-mono">{evidence.attendanceRatePercent}%</p>
              <p className="text-[9px] text-blue-600">Vắng {evidence.totalAbsences} • Muộn {evidence.totalLateSessions}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-0.5">
              <Award className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-[10px] text-emerald-700">Điểm thi đua</p>
              <p className="text-base font-bold font-mono">+{evidence.totalMeritPoints}</p>
              <p className="text-[9px] text-emerald-600">Trừ {evidence.totalDemeritPoints} điểm</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-0.5">
              <Zap className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <p className="text-[10px] text-amber-700">Lớp trực tuyến</p>
              <p className="text-base font-bold font-mono">{evidence.totalLiveParticipations}</p>
              <p className="text-[9px] text-amber-600">Lượt phát biểu</p>
            </div>
          </div>

          {/* Suggested Comments Section */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-app-primary flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Gợi ý nhận xét sư phạm từ minh chứng thực tế:
            </h4>

            {evidence.suggestedComments.length === 0 ? (
              <p className="text-app-muted italic p-3 bg-app-surface-hover rounded-xl">
                Chưa có đủ số liệu thi đua/chuyên cần để tạo gợi ý tự động.
              </p>
            ) : (
              evidence.suggestedComments.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="warning" className="text-[10px]">
                      {sug.evidenceText}
                    </Badge>
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-[11px] py-1 px-2.5 h-auto"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => {
                        onApplySuggestedComment(sug.text);
                        onClose();
                      }}
                    >
                      Áp dụng câu này
                    </Button>
                  </div>
                  <p className="leading-relaxed font-medium">{sug.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Concrete Evidence Logs */}
          <div className="space-y-2 pt-2 border-t border-app">
            <h4 className="font-bold text-xs text-app-main flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-app-primary" />
              Nhật ký minh chứng đã ghi nhận ({evidence.concreteEvidenceList.length}):
            </h4>

            <div className="max-h-60 overflow-y-auto divide-y divide-app/50 pr-1 space-y-1.5">
              {evidence.concreteEvidenceList.length === 0 ? (
                <p className="text-app-muted italic text-center py-4">Chưa có nhật ký minh chứng phát sinh trong kỳ.</p>
              ) : (
                evidence.concreteEvidenceList.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-app-surface border border-app text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-app-main">{item.title}</span>
                      {item.date && (
                        <span className="text-[10px] text-app-muted font-mono">{formatDateVietnamese(item.date)}</span>
                      )}
                    </div>
                    <p className="text-app-muted">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

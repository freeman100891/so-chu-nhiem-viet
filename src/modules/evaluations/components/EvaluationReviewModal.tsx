import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import type { StudentRosterEvaluationItem } from '../../../core/services/evaluation.service';
import { AlertCircle, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export interface EvaluationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: StudentRosterEvaluationItem[];
  duplicates: Map<string, string[]>;
  onSelectStudent: (studentId: string) => void;
}

export const EvaluationReviewModal: React.FC<EvaluationReviewModalProps> = ({
  isOpen,
  onClose,
  roster,
  duplicates,
  onSelectStudent,
}) => {
  const errorStudents = roster.filter((r) => r.hasErrors);
  const warningStudents = roster.filter((r) => r.hasWarnings && !r.hasErrors);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rà Soát Lỗi & Cảnh Báo Đánh Giá Lớp Học"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Summary Metric Badges */}
        <div className="flex items-center gap-3">
          <Badge variant={errorStudents.length > 0 ? 'danger' : 'success'} className="py-1 px-3">
            {errorStudents.length > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 mr-1 inline" /> {errorStudents.length} học sinh có lỗi chặn
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Không có lỗi chặn
              </>
            )}
          </Badge>

          <Badge variant={warningStudents.length > 0 ? 'warning' : 'neutral'} className="py-1 px-3">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" /> {warningStudents.length} học sinh có cảnh báo
          </Badge>

          <Badge variant={duplicates.size > 0 ? 'warning' : 'neutral'} className="py-1 px-3">
            {duplicates.size} nhận xét bị trùng lặp
          </Badge>
        </div>

        {/* 1. Duplicate Comments Section */}
        {duplicates.size > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Cảnh báo nhận xét trùng lặp trên nhiều học sinh ({duplicates.size}):
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {Array.from(duplicates.entries()).map(([comment, students], idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white border border-amber-200 text-[11px] space-y-1">
                  <p className="font-semibold text-amber-900 italic">"{comment}"</p>
                  <p className="text-amber-800">
                    <strong>Học sinh trùng:</strong> {students.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. List of Students with Errors */}
        {errorStudents.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Danh sách học sinh có lỗi chặn ({errorStudents.length}):
            </h4>
            <div className="divide-y divide-app border border-app rounded-xl overflow-hidden bg-app-surface">
              {errorStudents.map((st) => (
                <div key={st.student.id} className="p-3 flex items-center justify-between gap-3 hover:bg-app-surface-hover">
                  <div>
                    <p className="font-bold text-app-main">{st.student.fullName} ({st.student.studentCode})</p>
                    <p className="text-[11px] text-rose-600">Còn token chưa thay thế hoặc dữ liệu bắt buộc chưa hoàn thành</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onSelectStudent(st.student.id);
                      onClose();
                    }}
                  >
                    Xem sửa
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Empty Success State */}
        {errorStudents.length === 0 && duplicates.size === 0 && (
          <div className="p-8 text-center text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-600" />
            <p className="font-bold text-sm">Hồ sơ lớp học đạt chuẩn chất lượng!</p>
            <p className="text-xs text-emerald-700">
              Không phát hiện lỗi chặn hoặc từ ngữ dán nhãn. Thầy/Cô có thể tiến hành Khóa sổ chính thức.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Đóng rà soát
          </Button>
        </div>
      </div>
    </Modal>
  );
};

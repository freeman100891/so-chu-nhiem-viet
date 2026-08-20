import React, { useState } from 'react';
import { Modal } from '../../../../shared/components/Modal';
import { Button } from '../../../../shared/components/Button';
import type { CandidateProposal } from '../../../../core/services/honor-rule-engine.service';
import type { HonorTitle } from '../../../../core/database/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../shared/utilities/cn';

export interface TieResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: HonorTitle;
  tiedCandidates: CandidateProposal[];
  onResolve: (action: 'accept_all' | 'increase_limit' | 'select_manual', selectedIds: string[], customReason?: string) => void;
}

export const TieResolutionModal: React.FC<TieResolutionModalProps> = ({
  isOpen,
  onClose,
  title,
  tiedCandidates,
  onResolve,
}) => {
  const [resolutionChoice, setResolutionChoice] = useState<'accept_all' | 'increase_limit' | 'select_manual'>('accept_all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(tiedCandidates.map((c) => c.student.id));
  const [customReason, setCustomReason] = useState<string>('');

  const toggleStudent = (stId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    );
  };

  const handleConfirm = () => {
    onResolve(resolutionChoice, selectedStudentIds, customReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xử Lý Trường Hợp Đồng Hạng Minh Bạch"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Phát hiện {tiedCandidates.length} học sinh có cùng số điểm ở danh hiệu "{title.name}"
            </p>
            <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Hệ thống không tự ý loại trừ học sinh. Thầy/Cô vui lòng chọn phương án xét giải sư phạm phù hợp nhất.
            </p>
          </div>
        </div>

        {/* TIED STUDENTS LIST */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <p className="text-xs font-bold text-app-main">Danh sách học sinh đồng hạng ({tiedCandidates[0]?.metricLabel}):</p>
          <div className="space-y-1">
            {tiedCandidates.map((cand) => (
              <div
                key={cand.student.id}
                onClick={() => resolutionChoice === 'select_manual' && toggleStudent(cand.student.id)}
                className={cn(
                  'p-2.5 rounded-xl border flex items-center justify-between transition-all',
                  resolutionChoice === 'select_manual' ? 'cursor-pointer hover:bg-slate-50' : '',
                  selectedStudentIds.includes(cand.student.id)
                    ? 'bg-app-primary-light/20 border-app-primary/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-app opacity-60'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-app-main">{cand.student.fullName}</span>
                  <span className="text-[11px] text-app-muted font-mono">{cand.metricLabel}</span>
                </div>
                {resolutionChoice === 'select_manual' && (
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(cand.student.id)}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-app-primary pointer-events-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3 RESOLUTION OPTIONS */}
        <div className="space-y-2 pt-1 border-t border-app">
          <p className="text-xs font-bold text-app-main">Phương án giải quyết:</p>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="radio"
                name="tie_res"
                checked={resolutionChoice === 'accept_all'}
                onChange={() => {
                  setResolutionChoice('accept_all');
                  setSelectedStudentIds(tiedCandidates.map((c) => c.student.id));
                }}
                className="text-app-primary"
              />
              <div>
                <span className="font-bold text-app-main block">1. Công nhận tất cả học sinh đồng hạng</span>
                <span className="text-[11px] text-app-muted">Trao danh hiệu cho toàn bộ các em có cùng kết quả xuất sắc.</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="radio"
                name="tie_res"
                checked={resolutionChoice === 'select_manual'}
                onChange={() => setResolutionChoice('select_manual')}
                className="text-app-primary"
              />
              <div>
                <span className="font-bold text-app-main block">2. Giáo viên lựa chọn thủ công</span>
                <span className="text-[11px] text-app-muted">Chọn các em phù hợp theo tiêu chí rèn luyện và nhập lý do.</span>
              </div>
            </label>
          </div>
        </div>

        {resolutionChoice === 'select_manual' && (
          <div>
            <label className="text-xs font-bold text-app-main block mb-1">Lý do sư phạm lựa chọn:</label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập lý do ưu tiên hoặc nhận xét đánh giá nề nếp..."
              className="w-full text-xs p-2.5 rounded-xl border border-app bg-app-surface focus:ring-2 focus:ring-app-primary"
              rows={2}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-app">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="font-bold"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleConfirm}
          >
            Xác nhận phương án
          </Button>
        </div>
      </div>
    </Modal>
  );
};

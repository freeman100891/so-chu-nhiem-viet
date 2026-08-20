import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Unlock, AlertTriangle } from 'lucide-react';

export interface EvaluationUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  onConfirmUnlock: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const EvaluationUnlockModal: React.FC<EvaluationUnlockModalProps> = ({
  isOpen,
  onClose,
  studentName,
  onConfirmUnlock,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Vui lòng nhập lý do mở khóa tối thiểu 5 ký tự (VD: Cập nhật điểm phúc khảo, sửa lỗi chính tả...).');
      return;
    }

    try {
      setError('');
      await onConfirmUnlock(reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mở Khóa Sổ Đánh Giá — ${studentName}`}
    >
      <div className="space-y-4 text-xs">
        {/* Warning Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cảnh báo bảo toàn dữ liệu đánh giá</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Hồ sơ học sinh sẽ được chuyển từ trạng thái <strong>Đã khóa (FINALIZED)</strong> về <strong>Bản nháp (DRAFT)</strong> để Thầy/Cô chỉnh sửa. Thao tác này sẽ được ghi nhận minh bạch vào <strong>Nhật ký kiểm soát (Audit Log)</strong>.
          </p>
        </div>

        {/* Reason Input */}
        <div className="space-y-1.5">
          <label className="font-semibold text-app-main block">
            Lý do mở khóa sổ <span className="text-rose-500">*</span>:
          </label>
          <textarea
            rows={3}
            placeholder="Nhập lý do cần mở khóa chỉnh sửa..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            className="w-full rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
          />
          {error && <p className="text-rose-500 text-[11px] font-medium">{error}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-app">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Unlock className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Xác nhận mở khóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};

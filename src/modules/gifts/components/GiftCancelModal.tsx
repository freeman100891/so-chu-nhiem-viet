import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { DetailedRedemptionRecord } from '../../../core/repositories/gift-redemption.repository';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface GiftCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DetailedRedemptionRecord | null;
  onCancelRedemption: (redemptionId: string, reason: string) => Promise<void>;
}

export const GiftCancelModal: React.FC<GiftCancelModalProps> = ({
  isOpen,
  onClose,
  record,
  onCancelRedemption,
}) => {
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!record) return null;

  const { redemption, items, studentName } = record;

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Vui lòng nhập lý do hủy giao dịch (tối thiểu 3 ký tự).');
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);
      await onCancelRedemption(redemption.id, reason.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isCancelling ? () => {} : onClose}
      title="Hủy Giao Dịch Đổi Quà & Hoàn Điểm"
    >
      <form onSubmit={handleConfirmCancel} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Xác nhận hoàn tác giao dịch đổi quà</span>
          </div>
          <p>
            Hệ thống sẽ hoàn trả <strong>+{redemption.totalPoints} điểm khả dụng</strong> cho học sinh <strong>{studentName}</strong> và khôi phục tồn kho cho các món quà có theo dõi số lượng.
          </p>
        </div>

        <div className="p-3 bg-app-surface-hover rounded-xl border border-app space-y-1 text-xs">
          <div className="text-app-muted">Chi tiết các món quà được hoàn:</div>
          <div className="font-semibold text-app-main">
            {items.map((i) => `${i.giftNameSnapshot} (x${i.quantity})`).join(', ')}
          </div>
        </div>

        <Input
          label="Lý do hủy giao dịch *"
          placeholder="Ví dụ: Học sinh đổi nhầm món, phụ huynh đề xuất hủy..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-app">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCancelling}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isCancelling}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Xác Nhận Hủy & Hoàn Điểm
          </Button>
        </div>
      </form>
    </Modal>
  );
};

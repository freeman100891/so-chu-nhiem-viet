import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { Gift } from '../../../core/database/types';
import {
  Sparkles,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export interface GiftConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentCode?: string;
  className?: string;
  cart: Map<string, number>;
  giftsMap: Map<string, Gift>;
  currentBalance: number;
  onConfirm: (note: string) => Promise<void>;
}

export const GiftConfirmModal: React.FC<GiftConfirmModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentCode,
  className,
  cart,
  giftsMap,
  currentBalance,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsList: Array<{ gift: Gift; quantity: number; lineTotal: number }> = [];
  let totalPoints = 0;
  let totalQuantity = 0;

  for (const [giftId, qty] of cart.entries()) {
    if (qty > 0) {
      const gift = giftsMap.get(giftId);
      if (gift) {
        const lineTotal = gift.pointCost * qty;
        itemsList.push({ gift, quantity: qty, lineTotal });
        totalPoints += lineTotal;
        totalQuantity += qty;
      }
    }
  }

  const balanceAfter = Math.max(0, currentBalance - totalPoints);

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(note);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Xác Nhận Đổi Quà Cho Học Sinh"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Student Target Banner */}
        <div className="p-3.5 bg-app-primary-light/50 rounded-xl border border-app-primary/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-app-muted font-medium">Học sinh nhận quà:</div>
            <div className="text-base font-bold text-app-main mt-0.5">
              {studentName} {studentCode && <span className="text-xs font-normal text-app-muted">({studentCode})</span>}
            </div>
            {className && <div className="text-xs text-app-primary font-semibold">{className}</div>}
          </div>
          <Sparkles className="w-6 h-6 text-app-primary" />
        </div>

        {/* Items Review Table */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-app-main">Danh sách quà quy đổi ({totalQuantity} món)</label>
          <div className="max-h-48 overflow-y-auto border border-app rounded-xl divide-y divide-app bg-app-surface">
            {itemsList.map(({ gift, quantity, lineTotal }) => (
              <div key={gift.id} className="p-2.5 flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-semibold text-app-main truncate">{gift.name}</div>
                  <div className="text-app-muted text-[11px]">{gift.pointCost}đ × {quantity}</div>
                </div>
                <strong className="text-app-primary font-bold">{lineTotal}đ</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Impact Card */}
        <div className="p-3 bg-app-surface-hover rounded-xl border border-app grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-app-muted block text-[11px]">Số dư trước</span>
            <strong className="text-sm text-app-main">{currentBalance}đ</strong>
          </div>
          <div>
            <span className="text-app-muted block text-[11px]">Trừ điểm đổi quà</span>
            <strong className="text-sm text-red-600">-{totalPoints}đ</strong>
          </div>
          <div>
            <span className="text-app-muted block text-[11px]">Số dư sau đổi</span>
            <strong className="text-sm text-emerald-700 font-bold">{balanceAfter}đ</strong>
          </div>
        </div>

        {/* Note input */}
        <Input
          label="Ghi chú giáo viên (tùy chọn)"
          placeholder="Ví dụ: Đổi thưởng phong trào học tốt tuần 12..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Giao dịch sẽ trừ trực tiếp vào điểm khả dụng của học sinh và cập nhật tồn kho. Cấp bậc quân hàm thi đua của học sinh <strong>không bị ảnh hưởng</strong>.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-app">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Lock className="w-4 h-4" />}
            onClick={handleConfirmSubmit}
          >
            Xác Nhận Đổi {totalPoints} Điểm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

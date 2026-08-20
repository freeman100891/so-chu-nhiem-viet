import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import type { GiftRedemption, GiftRedemptionItem } from '../../../core/database/types';
import {
  CheckCircle,
  ArrowRight,
  History,
} from 'lucide-react';

export interface GiftReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  redemption: GiftRedemption | null;
  items: GiftRedemptionItem[];
  studentName: string;
  remainingBalance: number;
  onViewHistory: () => void;
  onContinueRedeeming: () => void;
}

export const GiftReceiptModal: React.FC<GiftReceiptModalProps> = ({
  isOpen,
  onClose,
  redemption,
  items,
  studentName,
  remainingBalance,
  onViewHistory,
  onContinueRedeeming,
}) => {
  if (!redemption) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi Quà Thành Công!">
      <div className="text-center space-y-4 py-2">
        {/* Confetti / Badge Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
          <CheckCircle className="w-9 h-9" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-app-main">Chúc mừng {studentName}!</h3>
          <p className="text-xs text-app-muted mt-1">
            Đã hoàn tất quy đổi <strong>{redemption.itemCount} món quà</strong> bằng <strong>{redemption.totalPoints} điểm tích lũy</strong>.
          </p>
        </div>

        {/* Receipt Snapshot Box */}
        <div className="p-3.5 bg-app-surface-hover rounded-2xl border border-app text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-app-main border-b border-app/60 pb-2">
            <span>Món quà đã nhận</span>
            <span>Số điểm</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-app-main truncate">{item.giftNameSnapshot}</span>
                  <span className="text-app-muted text-[11px] block">Số lượng: {item.quantity}</span>
                </div>
                <strong className="text-app-primary font-bold">{item.lineTotalPoints}đ</strong>
              </div>
            ))}
          </div>

          <div className="pt-2.5 border-t border-app/60 flex items-center justify-between text-xs">
            <span className="text-app-muted font-medium">Số dư khả dụng còn lại:</span>
            <strong className="text-base text-emerald-700 font-bold">{remainingBalance} điểm</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            className="w-full justify-center"
            leftIcon={<History className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onViewHistory();
            }}
          >
            Xem Lịch Sử
          </Button>

          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onContinueRedeeming();
            }}
          >
            Đổi Thêm Quà
          </Button>
        </div>
      </div>
    </Modal>
  );
};

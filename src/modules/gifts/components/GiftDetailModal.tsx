import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import type { DetailedRedemptionRecord } from '../../../core/repositories/gift-redemption.repository';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import { Calendar, User, XCircle } from 'lucide-react';

export interface GiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DetailedRedemptionRecord | null;
}

export const GiftDetailModal: React.FC<GiftDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const { redemption, items, studentName, studentCode, className } = record;
  const isCancelled = redemption.status === 'CANCELLED';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Biên Nhận Đổi Quà">
      <div className="space-y-4 text-xs">
        {/* Header Info Banner */}
        <div className="p-3.5 bg-app-surface-hover rounded-xl border border-app space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-app-main">
              <User className="w-4 h-4 text-app-primary" />
              <span>{studentName}</span>
              {studentCode && <span className="text-xs font-normal text-app-muted">({studentCode})</span>}
            </div>

            <Badge variant={isCancelled ? 'danger' : 'success'} className="font-semibold text-xs py-1 px-2.5">
              {isCancelled ? 'Đã hủy (Đã hoàn điểm)' : 'Đã hoàn tất'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-app-muted pt-1 border-t border-app/60 text-[11px]">
            <span>{className || 'Lớp chủ nhiệm'}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateVietnamese(redemption.redeemedAt)}
            </span>
          </div>
        </div>

        {/* Snapshot Items List */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-app-main">Danh sách quà snapshot ({redemption.itemCount} món)</label>
          <div className="border border-app rounded-xl divide-y divide-app bg-app-surface max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-app-main">{item.giftNameSnapshot}</div>
                  <div className="text-[11px] text-app-muted">Đơn giá: {item.unitPointCostSnapshot}đ × Số lượng: {item.quantity}</div>
                </div>
                <strong className="text-app-primary font-bold">{item.lineTotalPoints} điểm</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Total Points */}
        <div className="p-3 bg-app-primary-light/40 rounded-xl border border-app-primary/20 flex items-center justify-between font-bold">
          <span className="text-app-main">Tổng điểm quy đổi:</span>
          <span className="text-base text-app-primary">{redemption.totalPoints} điểm</span>
        </div>

        {redemption.note && (
          <div className="p-2.5 bg-app-surface-hover rounded-xl border border-app text-app-main">
            <span className="text-app-muted font-semibold block text-[11px]">Ghi chú:</span>
            <span>{redemption.note}</span>
          </div>
        )}

        {isCancelled && (
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Thông tin hủy giao dịch</span>
            </div>
            <div>Lý do: <em>"{redemption.cancelReason || 'Không có lý do'}"</em></div>
            {redemption.cancelledAt && (
              <div className="text-[11px] text-red-700">Thời điểm hủy: {new Date(redemption.cancelledAt).toLocaleString('vi-VN')}</div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-app">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

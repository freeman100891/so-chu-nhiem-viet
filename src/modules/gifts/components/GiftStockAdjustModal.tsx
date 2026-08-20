import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import type { Gift } from '../../../core/database/types';
import { Package, Check } from 'lucide-react';

export interface GiftStockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: Gift | null;
  onAdjustStock: (giftId: string, newStock: number, reason: string) => Promise<void>;
}

export const GiftStockAdjustModal: React.FC<GiftStockAdjustModalProps> = ({
  isOpen,
  onClose,
  gift,
  onAdjustStock,
}) => {
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('Nhập thêm quà từ nguồn quỹ lớp');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gift) {
      setNewStock(gift.stockOnHand ?? 0);
      setReason('Nhập thêm quà mới');
    }
    setError(null);
  }, [gift, isOpen]);

  if (!gift) return null;

  const currentStock = gift.stockOnHand ?? 0;
  const delta = newStock - currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock < 0) {
      setError('Số lượng tồn kho phải là số nguyên không âm.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh kho.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onAdjustStock(gift.id, Math.round(newStock), reason.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Điều Chỉnh Tồn Kho Quà Tặng"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-app-surface-hover rounded-xl border border-app flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-app-main">{gift.name}</div>
            <div className="text-xs text-app-muted mt-0.5">Tồn kho hiện tại: <strong className="text-app-main">{currentStock}</strong></div>
          </div>
          <Package className="w-6 h-6 text-app-primary" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số lượng tồn kho mới *"
            type="number"
            min={0}
            step={1}
            value={newStock}
            onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
            required
          />

          <div className="p-2.5 rounded-xl border border-app flex flex-col justify-center">
            <span className="text-xs text-app-muted">Biến động:</span>
            <span className={`text-base font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-amber-600' : 'text-app-muted'}`}>
              {delta > 0 ? `+${delta} (Nhập thêm)` : delta < 0 ? `${delta} (Giảm)` : 'Không đổi'}
            </span>
          </div>
        </div>

        <Input
          label="Lý do điều chỉnh kho *"
          placeholder="Ví dụ: Nhập thêm quà từ quỹ lớp, kiểm kê định kỳ..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-app">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Check className="w-4 h-4" />}>
            Cập Nhật Tồn Kho
          </Button>
        </div>
      </form>
    </Modal>
  );
};

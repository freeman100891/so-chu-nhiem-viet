import React from 'react';
import { Drawer } from '../../../shared/components/Drawer';
import { Button } from '../../../shared/components/Button';
import type { Gift } from '../../../core/database/types';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export interface CartItemEntry {
  gift: Gift;
  quantity: number;
}

export interface GiftCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Map<string, number>;
  giftsMap: Map<string, Gift>;
  onUpdateQuantity: (giftId: string, delta: number) => void;
  onRemoveItem: (giftId: string) => void;
  onClearCart: () => void;
  studentName?: string;
  currentBalance: number;
  onProceedToConfirm: () => void;
}

export const GiftCartDrawer: React.FC<GiftCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  giftsMap,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  studentName,
  currentBalance,
  onProceedToConfirm,
}) => {
  const cartEntries: CartItemEntry[] = [];
  let totalPoints = 0;
  let totalItems = 0;

  for (const [giftId, qty] of cart.entries()) {
    if (qty > 0) {
      const gift = giftsMap.get(giftId);
      if (gift) {
        cartEntries.push({ gift, quantity: qty });
        totalPoints += gift.pointCost * qty;
        totalItems += qty;
      }
    }
  }

  const isOverBalance = totalPoints > currentBalance;
  const balanceAfter = Math.max(0, currentBalance - totalPoints);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Giỏ Đổi Quà (${totalItems} món)`}
      position="right"
      className="max-w-md w-full"
    >
      <div className="flex flex-col h-full justify-between space-y-4">
        {/* Top Header: Student & Balance Summary */}
        <div className="p-3.5 bg-app-surface-hover rounded-2xl border border-app space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-app-muted">Học sinh đổi quà:</span>
            <strong className="text-app-main text-sm">{studentName || 'Chưa chọn'}</strong>
          </div>

          <div className="pt-2 border-t border-app/60 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-app-surface rounded-xl border border-app">
              <span className="text-app-muted text-[11px] block">Số dư hiện tại</span>
              <strong className="text-sm font-bold text-app-primary">{currentBalance}đ</strong>
            </div>
            <div className="p-2 bg-app-surface rounded-xl border border-app">
              <span className="text-app-muted text-[11px] block">Tổng điểm đổi</span>
              <strong className={`text-sm font-bold ${isOverBalance ? 'text-red-600' : 'text-app-main'}`}>
                {totalPoints}đ
              </strong>
            </div>
            <div className="p-2 bg-app-surface rounded-xl border border-app">
              <span className="text-app-muted text-[11px] block">Số dư còn lại</span>
              <strong className={`text-sm font-bold ${isOverBalance ? 'text-red-600' : 'text-emerald-700'}`}>
                {balanceAfter}đ
              </strong>
            </div>
          </div>

          {isOverBalance && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Thiếu <strong>{totalPoints - currentBalance}đ</strong> để hoàn tất giỏ quà này.</span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {cartEntries.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingCart className="w-12 h-12 text-app-muted mx-auto" />
              <p className="text-sm font-semibold text-app-main">Giỏ đổi quà đang trống</p>
              <p className="text-xs text-app-muted">Hãy chọn các món quà từ danh mục bên ngoài để thêm vào giỏ.</p>
            </div>
          ) : (
            cartEntries.map(({ gift, quantity }) => {
              const isTracked = gift.inventoryMode === 'TRACKED';
              const maxStock = gift.stockOnHand ?? 0;
              const lineTotal = gift.pointCost * quantity;
              const cannotIncrease = isTracked && quantity >= maxStock;

              return (
                <div
                  key={gift.id}
                  className="p-3 bg-app-surface border border-app rounded-xl flex items-center justify-between gap-3 hover:border-app-primary/40 transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-app-main truncate">{gift.name}</h5>
                    <div className="flex items-center gap-2 text-[11px] text-app-muted mt-0.5">
                      <span>{gift.pointCost}đ / món</span>
                      <span>•</span>
                      <strong className="text-app-primary font-semibold">={lineTotal}đ</strong>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-app rounded-lg overflow-hidden bg-app-surface-hover/60">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(gift.id, -1)}
                        className="p-1 text-app-muted hover:text-app-main hover:bg-app-surface transition-colors"
                        title="Giảm số lượng"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-app-main">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(gift.id, 1)}
                        disabled={cannotIncrease}
                        className="p-1 text-app-muted hover:text-app-main hover:bg-app-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={cannotIncrease ? 'Đã đạt giới hạn tồn kho' : 'Tăng số lượng'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(gift.id)}
                      className="p-1 text-app-muted hover:text-red-600 transition-colors"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-app space-y-2 shrink-0">
          {cartEntries.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1">
              <button
                type="button"
                onClick={onClearCart}
                className="text-app-muted hover:text-red-600 font-medium transition-colors"
              >
                Xóa toàn bộ giỏ
              </button>
              <span className="font-semibold text-app-main">
                Tổng: <strong className="text-base text-app-primary">{totalPoints}</strong> điểm
              </span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center"
            disabled={cartEntries.length === 0 || isOverBalance || !studentName}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onProceedToConfirm}
          >
            Tiếp Tục Xác Nhận ({totalPoints}đ)
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

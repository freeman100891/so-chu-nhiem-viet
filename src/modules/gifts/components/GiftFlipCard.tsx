import React, { useState } from 'react';
import type { Gift, GiftCategory } from '../../../core/database/types';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useGiftImage } from '../hooks/useGiftImage';
import {
  Gift as GiftIcon,
  Sparkles,
  PenTool,
  Ruler,
  Book,
  Palette,
  Crown,
  Award,
  ShieldCheck,
  Trophy,
  Heart,
  Smile,
  Edit2,
  Package,
  RotateCcw,
  Archive,
  Plus,
  Minus,
  AlertTriangle,
  RotateCw,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift: GiftIcon,
  Sparkles,
  PenTool,
  Ruler,
  Book,
  Palette,
  Crown,
  Award,
  ShieldCheck,
  Trophy,
  Heart,
  Smile,
};

const CATEGORY_NAMES: Record<GiftCategory, string> = {
  STATIONERY: 'Dụng cụ học tập',
  BOOK: 'Sách & Tri thức',
  TOY: 'Đồ chơi & Lưu niệm',
  PRIVILEGE: 'Đặc quyền lớp học',
  SNACK: 'Bánh kẹo',
  OTHER: 'Khác',
};

export type GiftCardMode = 'catalog' | 'redemption' | 'presentation';

export interface GiftFlipCardProps {
  gift: Gift;
  mode: GiftCardMode;
  isFlipped: boolean;
  onFlipChange: (giftId: string, nextFlipped: boolean) => void;
  // Catalog actions
  onOpenEditModal?: (gift: Gift) => void;
  onOpenStockModal?: (gift: Gift) => void;
  onToggleArchive?: (gift: Gift) => void;
  // Redemption actions
  selectedStudentSelected?: boolean;
  currentBalance?: number;
  qtyInCart?: number;
  onUpdateQuantity?: (giftId: string, delta: number) => void;
}

export const GiftFlipCard: React.FC<GiftFlipCardProps> = ({
  gift,
  mode,
  isFlipped,
  onFlipChange,
  onOpenEditModal,
  onOpenStockModal,
  onToggleArchive,
  selectedStudentSelected = false,
  currentBalance = 0,
  qtyInCart = 0,
  onUpdateQuantity,
}) => {
  const [imageError, setImageError] = useState(false);

  // Hook lấy Thumbnail cho mặt trước và Full image cho mặt sau (FEAT-GIFT-003)
  const { imageUrl: thumbnailUrl } = useGiftImage(
    gift.id,
    'thumbnail',
    gift.imageVersion,
    gift.imageRef
  );

  const { imageUrl: fullImageUrl, loading: loadingFullImage } = useGiftImage(
    isFlipped ? gift.id : undefined, // Chỉ tải full image khi thẻ đang lật để tối ưu hiệu năng
    'full',
    gift.imageVersion,
    gift.imageRef
  );

  const IconComp = (gift.icon && ICON_MAP[gift.icon]) || GiftIcon;
  const isTracked = gift.inventoryMode === 'TRACKED';
  const stock = gift.stockOnHand ?? 0;
  const isOutOfStock = isTracked && stock <= 0;
  const isLowStock = isTracked && !isOutOfStock && stock <= (gift.lowStockThreshold ?? 3);
  const isArchived = gift.status === 'ARCHIVED';

  // Redemption calculations
  const isAffordable = !selectedStudentSelected || gift.pointCost <= currentBalance;
  const canIncrease = isTracked ? qtyInCart < stock : true;

  const handleToggleFlip = () => {
    onFlipChange(gift.id, !isFlipped);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleFlip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isFlipped) {
      e.preventDefault();
      onFlipChange(gift.id, false);
    }
  };

  // Presentation theme styling
  const isPresentation = mode === 'presentation';

  return (
    <article
      className={`gift-card-perspective h-[310px] sm:h-[320px] w-full select-none ${
        isPresentation ? 'group' : ''
      }`}
      onKeyDown={handleKeyDown}
      data-testid={`gift-card-${gift.id}`}
      data-flipped={isFlipped}
    >
      <div
        className={`gift-card-inner rounded-2xl sm:rounded-3xl border transition-all shadow-xs hover:shadow-md ${
          isPresentation
            ? 'bg-gradient-to-b from-slate-800 to-slate-850 border-slate-700 text-white'
            : isArchived
              ? 'opacity-75 bg-app-surface/70 border-app'
              : qtyInCart > 0
                ? 'ring-2 ring-app-primary border-app-primary bg-app-primary-light/10'
                : 'bg-app-surface border-app'
        } ${isFlipped ? 'is-flipped' : ''}`}
      >
        {/* ========================================================================= */}
        {/* FRONT FACE                                                               */}
        {/* ========================================================================= */}
        <div
          className={`gift-card-face gift-card-front p-4 flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
          aria-hidden={isFlipped}
        >
          {/* Top Interactive Area for Card Flip */}
          <button
            type="button"
            onClick={handleToggleFlip}
            onKeyDown={handleTriggerKeyDown}
            aria-label={isFlipped ? `Quay lại thông tin quà ${gift.name}` : `Xem hình ảnh lớn món quà ${gift.name}`}
            aria-pressed={isFlipped}
            tabIndex={isFlipped ? -1 : 0}
            className="flex-1 flex flex-col justify-start text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-app-primary rounded-xl p-1 -m-1 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {/* Header: Thumbnail/Icon + Category Badge + Flip Hint */}
            <div className="flex items-start justify-between gap-2 w-full">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center overflow-hidden ${
                  isPresentation
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950'
                    : 'bg-app-primary-light text-app-primary'
                }`}
              >
                {thumbnailUrl && !imageError ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="neutral"
                  className={`text-[10px] py-0.5 px-2 font-semibold ${
                    isPresentation ? 'bg-slate-700/80 text-slate-300' : ''
                  }`}
                >
                  {CATEGORY_NAMES[gift.category] || gift.category}
                </Badge>
                {gift.status === 'INACTIVE' && (
                  <Badge variant="warning" className="text-[10px] py-0.5 px-2">
                    Tạm ngừng
                  </Badge>
                )}
                {gift.status === 'ARCHIVED' && (
                  <Badge variant="danger" className="text-[10px] py-0.5 px-2">
                    Đã lưu trữ
                  </Badge>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-2.5 flex-1 min-h-0">
              <h4
                className={`font-bold text-sm sm:text-base leading-tight line-clamp-2 ${
                  isPresentation ? 'text-white' : 'text-app-main'
                }`}
                title={gift.name}
              >
                {gift.name}
              </h4>
              {gift.description && (
                <p
                  className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                    isPresentation ? 'text-slate-400' : 'text-app-muted'
                  }`}
                >
                  {gift.description}
                </p>
              )}
            </div>

            {/* 3D Flip Hint Cue */}
            <div
              className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium py-1 px-2.5 rounded-lg transition-colors ${
                isPresentation
                  ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-700'
                  : 'bg-app-surface-hover/80 text-app-primary hover:bg-app-primary-light/50'
              }`}
            >
              <RotateCw className="w-3 h-3 animate-spin-slow" />
              <span>Chạm để xem ảnh 3D</span>
            </div>
          </button>

          {/* ========================================================================= */}
          {/* BOTTOM CONTROLS CONTAINER (SEPARATE SIBLING WITH STOP PROPAGATION)        */}
          {/* ========================================================================= */}
          <div
            className={`pt-2.5 border-t mt-2 space-y-2 shrink-0 ${
              isPresentation ? 'border-slate-700/80' : 'border-app/60'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Price & Stock Display Row */}
            <div className="flex items-center justify-between text-xs">
              <div
                className={`flex items-center gap-1 font-bold text-base ${
                  isPresentation ? 'text-amber-400 text-lg' : 'text-app-primary'
                }`}
              >
                <span>{gift.pointCost}</span>
                <span className={`text-xs font-semibold ${isPresentation ? 'text-slate-400' : 'text-app-muted'}`}>
                  điểm
                </span>
              </div>

              {isTracked ? (
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isOutOfStock
                      ? isPresentation ? 'text-rose-400' : 'text-red-600'
                      : isLowStock
                        ? isPresentation ? 'text-amber-300' : 'text-amber-700'
                        : isPresentation ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  {isOutOfStock ? (
                    'Hết hàng'
                  ) : (
                    <span>
                      Còn: <strong>{stock}</strong>
                    </span>
                  )}
                  {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </span>
              ) : (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isPresentation
                      ? 'bg-amber-950/50 border border-amber-800/40 text-amber-300'
                      : 'bg-app-surface-hover text-app-muted'
                  }`}
                >
                  👑 Không giới hạn
                </span>
              )}
            </div>

            {/* Mode-Specific Action Buttons */}
            {mode === 'catalog' && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs py-1 px-2 h-7 gap-1"
                  leftIcon={<Edit2 className="w-3 h-3" />}
                  onClick={() => onOpenEditModal?.(gift)}
                  disabled={isArchived}
                >
                  Sửa
                </Button>

                {isTracked && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs py-1 px-2 h-7 gap-1"
                    leftIcon={<Package className="w-3 h-3" />}
                    onClick={() => onOpenStockModal?.(gift)}
                    disabled={isArchived}
                  >
                    Kho
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`p-1.5 h-7 w-7 rounded-lg ${
                    isArchived
                      ? 'text-emerald-700 hover:bg-emerald-50'
                      : 'text-app-muted hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={isArchived ? 'Khôi phục quà' : 'Lưu trữ quà'}
                  onClick={() => onToggleArchive?.(gift)}
                >
                  {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}

            {mode === 'redemption' && (
              <div className="pt-0.5">
                {!selectedStudentSelected ? (
                  <Button variant="outline" size="sm" className="w-full text-xs justify-center h-7 py-0.5" disabled>
                    Chọn học sinh trước
                  </Button>
                ) : isOutOfStock ? (
                  <Button variant="outline" size="sm" className="w-full text-xs justify-center h-7 py-0.5 text-red-600" disabled>
                    Tạm hết hàng
                  </Button>
                ) : !isAffordable ? (
                  <Button variant="outline" size="sm" className="w-full text-xs justify-center h-7 py-0.5 text-amber-700" disabled>
                    Thiếu {gift.pointCost - currentBalance}đ
                  </Button>
                ) : qtyInCart > 0 ? (
                  <div className="flex items-center justify-between bg-app-primary-light/60 p-0.5 rounded-xl border border-app-primary/30 h-7">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity?.(gift.id, -1)}
                      className="p-1 rounded-lg bg-app-surface text-app-main hover:bg-app-surface-hover transition-colors cursor-pointer"
                      title="Giảm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs text-app-primary px-2">Đã chọn: {qtyInCart}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity?.(gift.id, 1)}
                      disabled={!canIncrease}
                      className="p-1 rounded-lg bg-app-surface text-app-main hover:bg-app-surface-hover transition-colors disabled:opacity-40 cursor-pointer"
                      title="Tăng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs justify-center h-7 py-0.5"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => onUpdateQuantity?.(gift.id, 1)}
                  >
                    Thêm vào giỏ
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BACK FACE (Large Image View)                                             */}
        {/* ========================================================================= */}
        <div
          className={`gift-card-face gift-card-back p-4 flex flex-col justify-between rounded-2xl sm:rounded-3xl overflow-hidden ${
            isPresentation
              ? 'bg-slate-900 text-white'
              : 'bg-app-surface-hover/90 text-app-main'
          } ${!isFlipped ? 'pointer-events-none' : ''}`}
          aria-hidden={!isFlipped}
        >
          {/* Back Header */}
          <div className="flex items-center justify-between gap-2 border-b pb-2 border-app/50 shrink-0">
            <h5 className="font-bold text-xs truncate flex-1" title={gift.name}>
              {gift.name}
            </h5>
            <span className="text-[11px] font-bold text-app-primary shrink-0">
              {gift.pointCost} điểm
            </span>
          </div>

          {/* Large Image / Illustration Container */}
          <button
            type="button"
            onClick={handleToggleFlip}
            onKeyDown={handleTriggerKeyDown}
            aria-label={`Quay lại thông tin quà ${gift.name}`}
            tabIndex={isFlipped ? 0 : -1}
            className="flex-1 my-2 flex flex-col items-center justify-center p-2 rounded-xl bg-app-surface/60 border border-app/40 overflow-hidden relative cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-app-primary"
          >
            {loadingFullImage ? (
              <div className="flex flex-col items-center justify-center p-4 gap-2">
                <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
                <span className="text-[11px] text-app-muted">Đang tải ảnh 3D...</span>
              </div>
            ) : (fullImageUrl || thumbnailUrl) && !imageError ? (
              <img
                src={fullImageUrl || thumbnailUrl}
                alt={`Hình ảnh minh họa quà tặng ${gift.name}`}
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                className="max-h-[140px] sm:max-h-[150px] w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              /* Stylized Vector Backface Illustration Fallback */
              <div className="flex flex-col items-center justify-center text-center p-3 space-y-2">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-md ${
                    isPresentation
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950'
                      : 'bg-app-primary text-app-primary-fg'
                  }`}
                >
                  <IconComp className="w-9 h-9 sm:w-11 sm:h-11" />
                </div>
                <span className="text-[11px] font-semibold text-app-muted">
                  {CATEGORY_NAMES[gift.category] || gift.category}
                </span>
              </div>
            )}
          </button>

          {/* Back Footer Action to Flip Back */}
          <div className="pt-2 border-t border-app/50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-app-muted">Ảnh phóng to</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              tabIndex={isFlipped ? 0 : -1}
              className="text-xs h-7 py-1 px-2.5 gap-1"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={handleToggleFlip}
            >
              Lật lại
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

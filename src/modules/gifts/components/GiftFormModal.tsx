import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import { GiftImageUploadField } from './GiftImageUploadField';
import { useGiftImage } from '../hooks/useGiftImage';
import type { Gift, GiftCategory, GiftInventoryMode } from '../../../core/database/types';
import type { ProcessedGiftImage } from '../../../core/services/gift-image-processor.service';
import {
  Gift as GiftIcon,
  Sparkles,
  Book,
  PenTool,
  Ruler,
  Palette,
  Crown,
  Award,
  ShieldCheck,
  Trophy,
  Heart,
  Smile,
  Check,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Gift', label: 'Hộp quà', Icon: GiftIcon },
  { name: 'Sparkles', label: 'Ngôi sao', Icon: Sparkles },
  { name: 'PenTool', label: 'Bút viết', Icon: PenTool },
  { name: 'Ruler', label: 'Thước kẻ', Icon: Ruler },
  { name: 'Book', label: 'Sách', Icon: Book },
  { name: 'Palette', label: 'Màu vẽ', Icon: Palette },
  { name: 'Crown', label: 'Vương miện', Icon: Crown },
  { name: 'Award', label: 'Huy hiệu', Icon: Award },
  { name: 'ShieldCheck', label: 'Khiên bảo vệ', Icon: ShieldCheck },
  { name: 'Trophy', label: 'Cúp vàng', Icon: Trophy },
  { name: 'Heart', label: 'Trái tim', Icon: Heart },
  { name: 'Smile', label: 'Nụ cười', Icon: Smile },
];

const CATEGORY_OPTIONS = [
  { value: 'STATIONERY', label: 'Dụng cụ học tập' },
  { value: 'BOOK', label: 'Sách truyện & Tri thức' },
  { value: 'TOY', label: 'Đồ chơi & Lưu niệm' },
  { value: 'PRIVILEGE', label: 'Đặc quyền lớp học' },
  { value: 'SNACK', label: 'Bánh kẹo & Nước giải khát' },
  { value: 'OTHER', label: 'Khác' },
];

export interface GiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (giftData: {
    name: string;
    description?: string;
    category: GiftCategory;
    pointCost: number;
    inventoryMode: GiftInventoryMode;
    stockOnHand?: number;
    lowStockThreshold?: number;
    presentationVisible: boolean;
    icon: string;
    pendingImage?: ProcessedGiftImage;
    removeImage?: boolean;
  }) => Promise<void>;
  initialGift?: Gift | null;
}

export const GiftFormModal: React.FC<GiftFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGift,
}) => {
  const isEditing = Boolean(initialGift);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GiftCategory>('STATIONERY');
  const [pointCost, setPointCost] = useState<number>(20);
  const [inventoryMode, setInventoryMode] = useState<GiftInventoryMode>('TRACKED');
  const [stockOnHand, setStockOnHand] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(4);
  const [presentationVisible, setPresentationVisible] = useState<boolean>(true);
  const [selectedIcon, setSelectedIcon] = useState<string>('Gift');

  const [pendingImage, setPendingImage] = useState<ProcessedGiftImage | null>(null);
  const [isPendingRemoval, setIsPendingRemoval] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy ảnh hiện tại đã lưu nếu đang edit
  const { imageUrl: existingImageUrl } = useGiftImage(
    initialGift?.id,
    'full',
    initialGift?.imageVersion,
    initialGift?.imageRef
  );

  useEffect(() => {
    if (initialGift) {
      setName(initialGift.name);
      setDescription(initialGift.description || '');
      setCategory(initialGift.category);
      setPointCost(initialGift.pointCost);
      setInventoryMode(initialGift.inventoryMode);
      setStockOnHand(initialGift.stockOnHand ?? 0);
      setLowStockThreshold(initialGift.lowStockThreshold ?? 3);
      setPresentationVisible(initialGift.presentationVisible !== false);
      setSelectedIcon(initialGift.icon || 'Gift');
    } else {
      setName('');
      setDescription('');
      setCategory('STATIONERY');
      setPointCost(20);
      setInventoryMode('TRACKED');
      setStockOnHand(20);
      setLowStockThreshold(4);
      setPresentationVisible(true);
      setSelectedIcon('Gift');
    }
    setPendingImage(null);
    setIsPendingRemoval(false);
    setError(null);
  }, [initialGift, isOpen]);

  const handleImageChange = (processed: ProcessedGiftImage | null, remove: boolean) => {
    setPendingImage(processed);
    setIsPendingRemoval(remove);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên món quà.');
      return;
    }
    if (!pointCost || pointCost <= 0) {
      setError('Mức điểm quy đổi phải là số nguyên lớn hơn 0.');
      return;
    }
    if (inventoryMode === 'TRACKED' && (stockOnHand === undefined || stockOnHand < 0)) {
      setError('Số lượng tồn kho phải là số nguyên không âm.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        pointCost: Math.round(pointCost),
        inventoryMode,
        stockOnHand: inventoryMode === 'TRACKED' ? Math.round(stockOnHand) : undefined,
        lowStockThreshold: inventoryMode === 'TRACKED' ? Math.round(lowStockThreshold) : undefined,
        presentationVisible,
        icon: selectedIcon,
        pendingImage: pendingImage || undefined,
        removeImage: isPendingRemoval,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu món quà.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh Sửa Món Quà' : 'Thêm Món Quà Mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Gift Name */}
        <Input
          label="Tên món quà / Đặc quyền *"
          placeholder="Ví dụ: Bút chì 2B, Bộ xếp hình lego, Phiếu miễn bài tập..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {/* Image Upload & Management Field (FEAT-GIFT-003) */}
        <GiftImageUploadField
          existingImageUrl={existingImageUrl}
          hasExistingImage={Boolean(initialGift?.imageId || initialGift?.imageRef)}
          onImageChange={handleImageChange}
          disabled={saving}
        />

        {/* Category & Point Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Danh mục phân loại *"
            value={category}
            onChange={(e) => setCategory(e.target.value as GiftCategory)}
            options={CATEGORY_OPTIONS}
          />

          <Input
            label="Điểm tích lũy quy đổi (Điểm) *"
            type="number"
            min={1}
            step={1}
            value={pointCost}
            onChange={(e) => setPointCost(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>

        {/* Inventory Mode */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-app-main">Phương thức quản lý kho</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setInventoryMode('TRACKED')}
              className={`p-3 rounded-xl border text-left transition-all ${
                inventoryMode === 'TRACKED'
                  ? 'border-app-primary bg-app-primary-light/40 text-app-primary ring-1 ring-app-primary'
                  : 'border-app hover:bg-app-surface-hover text-app-muted'
              }`}
            >
              <div className="font-semibold text-xs text-app-main">Quản lý theo số lượng (Vật phẩm)</div>
              <div className="text-[11px] text-app-muted mt-0.5">Trừ tồn kho khi đổi, chặn khi hết hàng</div>
            </button>

            <button
              type="button"
              onClick={() => setInventoryMode('UNLIMITED')}
              className={`p-3 rounded-xl border text-left transition-all ${
                inventoryMode === 'UNLIMITED'
                  ? 'border-app-primary bg-app-primary-light/40 text-app-primary ring-1 ring-app-primary'
                  : 'border-app hover:bg-app-surface-hover text-app-muted'
              }`}
            >
              <div className="font-semibold text-xs text-app-main">Không giới hạn (Đặc quyền)</div>
              <div className="text-[11px] text-app-muted mt-0.5">Không theo dõi tồn kho (Ví dụ: Đổi chỗ...)</div>
            </button>
          </div>
        </div>

        {inventoryMode === 'TRACKED' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-app-surface-hover/50 rounded-xl border border-app">
            <Input
              label="Số lượng tồn kho ban đầu *"
              type="number"
              min={0}
              step={1}
              value={stockOnHand}
              onChange={(e) => setStockOnHand(parseInt(e.target.value, 10) || 0)}
              required
            />
            <Input
              label="Ngưỡng cảnh báo sắp hết hàng"
              type="number"
              min={0}
              step={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        )}

        {/* Icon Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-app-main">Biểu tượng hiển thị</label>
          <div className="grid grid-cols-6 gap-2">
            {AVAILABLE_ICONS.map((item) => {
              const IconComp = item.Icon;
              const isSelected = selectedIcon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIcon(item.name)}
                  title={item.label}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-app-primary bg-app-primary text-app-primary-fg shadow-xs scale-105'
                      : 'border-app text-app-muted hover:text-app-main hover:bg-app-surface-hover'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-app-main">Mô tả ngắn gọn</label>
          <textarea
            className="w-full px-3 py-2 border border-app rounded-xl text-sm bg-app-surface text-app-main focus:outline-hidden focus:ring-2 focus:ring-app-primary/30"
            rows={2}
            placeholder="Mô tả công dụng hoặc ý nghĩa của phần quà..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Presentation Toggle */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-app bg-app-surface-hover/30 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-app-primary border-app focus:ring-app-primary"
            checked={presentationVisible}
            onChange={(e) => setPresentationVisible(e.target.checked)}
          />
          <div className="text-xs">
            <span className="font-semibold text-app-main">Hiển thị trong chế độ trình chiếu lớp học</span>
            <p className="text-[11px] text-app-muted mt-0.5">Cho phép học sinh ngắm và chọn mục tiêu trên máy chiếu</p>
          </div>
        </label>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-app">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Check className="w-4 h-4" />}>
            {isEditing ? 'Lưu Thay Đổi' : 'Tạo Món Quà'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

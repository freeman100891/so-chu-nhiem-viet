import React, { useState, useEffect } from 'react';
import type { Gift } from '../../../core/database/types';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { GiftFlipCard } from './GiftFlipCard';
import {
  Plus,
  Search,
  Monitor,
  Gift as GiftIcon,
} from 'lucide-react';

export interface GiftCatalogTabProps {
  gifts: Gift[];
  loading: boolean;
  onOpenCreateModal: () => void;
  onOpenEditModal: (gift: Gift) => void;
  onOpenStockModal: (gift: Gift) => void;
  onToggleArchive: (gift: Gift) => void;
  onOpenPresentation: () => void;
}

export const GiftCatalogTab: React.FC<GiftCatalogTabProps> = ({
  gifts,
  loading,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenStockModal,
  onToggleArchive,
  onOpenPresentation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [flippedGiftId, setFlippedGiftId] = useState<string | null>(null);

  const filteredGifts = gifts.filter((g) => {
    if (selectedStatus === 'ACTIVE' && g.status !== 'ACTIVE') return false;
    if (selectedStatus === 'INACTIVE' && g.status !== 'INACTIVE') return false;
    if (selectedStatus === 'ARCHIVED' && g.status !== 'ARCHIVED') return false;

    if (selectedCategory !== 'ALL' && g.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchDesc = (g.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });

  // Auto reset flipped state if the flipped gift is no longer in the filtered list
  useEffect(() => {
    if (flippedGiftId && !filteredGifts.some((g) => g.id === flippedGiftId)) {
      setFlippedGiftId(null);
    }
  }, [filteredGifts, flippedGiftId]);

  const handleFlipChange = (giftId: string, nextFlipped: boolean) => {
    if (nextFlipped) {
      setFlippedGiftId(giftId);
    } else {
      if (flippedGiftId === giftId) {
        setFlippedGiftId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Action & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <Input
              placeholder="Tìm tên món quà, mô tả..."
              leftIcon={<Search className="w-4 h-4 text-app-muted" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả danh mục' },
                { value: 'STATIONERY', label: 'Dụng cụ học tập' },
                { value: 'BOOK', label: 'Sách truyện & Tri thức' },
                { value: 'TOY', label: 'Đồ chơi & Lưu niệm' },
                { value: 'PRIVILEGE', label: 'Đặc quyền lớp học' },
                { value: 'SNACK', label: 'Bánh kẹo' },
                { value: 'OTHER', label: 'Khác' },
              ]}
            />

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Đang cho phép đổi (Active)' },
                { value: 'INACTIVE', label: 'Tạm ngừng đổi (Inactive)' },
                { value: 'ARCHIVED', label: 'Đã lưu trữ (Archived)' },
              ]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Monitor className="w-4 h-4 text-app-primary" />}
              onClick={onOpenPresentation}
            >
              Trình chiếu Catalog
            </Button>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onOpenCreateModal}
            >
              Thêm Quà Mới
            </Button>
          </div>
        </div>
      </Card>

      {/* Catalog Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-app-surface-hover rounded-2xl border border-app" />
          ))}
        </div>
      ) : filteredGifts.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <GiftIcon className="w-12 h-12 text-app-muted mx-auto" />
          <h3 className="text-base font-bold text-app-main">Không tìm thấy món quà nào</h3>
          <p className="text-xs text-app-muted max-w-md mx-auto">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm, hoặc bấm "Thêm Quà Mới" để bổ sung các phần quà hấp dẫn cho học sinh.
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onOpenCreateModal}>
            Thêm Quà Mới Ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGifts.map((gift) => (
            <GiftFlipCard
              key={gift.id}
              gift={gift}
              mode="catalog"
              isFlipped={flippedGiftId === gift.id}
              onFlipChange={handleFlipChange}
              onOpenEditModal={onOpenEditModal}
              onOpenStockModal={onOpenStockModal}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

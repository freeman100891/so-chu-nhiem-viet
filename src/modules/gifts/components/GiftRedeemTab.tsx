import React, { useState, useMemo, useEffect } from 'react';
import type { ClassRoom, Student, Gift, StudentRewardBalance } from '../../../core/database/types';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { GiftFlipCard } from './GiftFlipCard';
import {
  ShoppingCart,
  Search,
  AlertCircle,
  Gift as GiftIcon,
} from 'lucide-react';

export interface GiftRedeemTabProps {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  studentBalances: Map<string, StudentRewardBalance>;
  gifts: Gift[];
  cart: Map<string, number>;
  onUpdateQuantity: (giftId: string, delta: number) => void;
  onOpenCart: () => void;
}

export const GiftRedeemTab: React.FC<GiftRedeemTabProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  selectedStudentId,
  onSelectStudent,
  studentBalances,
  gifts,
  cart,
  onUpdateQuantity,
  onOpenCart,
}) => {
  const [giftSearch, setGiftSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [flippedGiftId, setFlippedGiftId] = useState<string | null>(null);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  const balance = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentBalances.get(selectedStudentId) || null;
  }, [studentBalances, selectedStudentId]);

  const currentBalance = balance?.redeemableBalance || 0;
  const achievementScore = balance?.achievementScore || 0;
  const spentPoints = balance?.spentPoints || 0;

  // Cart Totals
  let totalCartItems = 0;
  let totalCartPoints = 0;
  for (const [giftId, qty] of cart.entries()) {
    if (qty > 0) {
      const gift = gifts.find((g) => g.id === giftId);
      if (gift) {
        totalCartItems += qty;
        totalCartPoints += gift.pointCost * qty;
      }
    }
  }

  // Filter Active Gifts
  const activeGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (g.status !== 'ACTIVE' || g.deletedAt) return false;
      if (selectedCategory !== 'ALL' && g.category !== selectedCategory) return false;
      if (onlyAffordable && g.pointCost > currentBalance) return false;

      if (giftSearch.trim()) {
        const q = giftSearch.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchDesc = (g.description || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [gifts, selectedCategory, onlyAffordable, giftSearch, currentBalance]);

  // Reset flipped card if it's no longer in the active filtered gifts or student changes
  useEffect(() => {
    if (flippedGiftId && !activeGifts.some((g) => g.id === flippedGiftId)) {
      setFlippedGiftId(null);
    }
  }, [activeGifts, flippedGiftId, selectedStudentId]);

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
      {/* Student Selector & Balance Display Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 max-w-xl">
            <Select
              label="Lớp chủ nhiệm *"
              value={selectedClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name} (Khối ${c.grade})` }))}
            />

            <Select
              label="Học sinh đổi quà *"
              value={selectedStudentId}
              onChange={(e) => onSelectStudent(e.target.value)}
              options={[
                { value: '', label: '-- Chọn học sinh --' },
                ...students.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} ${s.studentCode ? `(${s.studentCode})` : ''}`,
                })),
              ]}
            />
          </div>

          {/* Student Balance Card (if student selected) */}
          {selectedStudent ? (
            <div className="p-3 bg-app-surface-hover rounded-2xl border border-app flex items-center gap-4 shrink-0 shadow-2xs">
              <StudentAvatar
                student={selectedStudent}
                score={achievementScore}
                size="lg"
                className="ring-2 ring-app-primary/30"
              />

              <div className="space-y-1">
                <div className="font-bold text-sm text-app-main leading-tight">
                  {selectedStudent.fullName}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-app-muted">
                    Thành tích: <strong className="text-app-main">{achievementScore}đ</strong>
                  </span>
                  <span>•</span>
                  <span className="text-app-muted">
                    Đã tiêu: <strong className="text-app-main">{spentPoints}đ</strong>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-app-primary bg-app-primary-light/60 px-2 py-0.5 rounded-md">
                    Khả dụng: {currentBalance}đ
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-app-surface-hover/50 rounded-2xl border border-app text-xs text-app-muted flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-app-muted shrink-0" />
              <span>Vui lòng chọn học sinh để kiểm tra số dư và bắt đầu đổi quà.</span>
            </div>
          )}
        </div>
      </Card>

      {/* Catalog Search, Filter & Floating Cart Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search & Categories */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Tìm quà tặng..."
              leftIcon={<Search className="w-4 h-4 text-app-muted" />}
              value={giftSearch}
              onChange={(e) => setGiftSearch(e.target.value)}
            />
          </div>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả danh mục' },
              { value: 'STATIONERY', label: 'Dụng cụ học tập' },
              { value: 'BOOK', label: 'Sách & Tri thức' },
              { value: 'TOY', label: 'Đồ chơi & Lưu niệm' },
              { value: 'PRIVILEGE', label: 'Đặc quyền lớp học' },
              { value: 'SNACK', label: 'Bánh kẹo' },
              { value: 'OTHER', label: 'Khác' },
            ]}
          />

          <button
            type="button"
            onClick={() => setOnlyAffordable(!onlyAffordable)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyAffordable
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-app-surface border-app text-app-muted hover:text-app-main hover:bg-app-surface-hover'
            }`}
          >
            {onlyAffordable ? '✓ Chỉ hiện món đủ điểm' : 'Hiện tất cả món'}
          </button>
        </div>

        {/* Cart Trigger Button */}
        <Button
          variant={totalCartItems > 0 ? 'primary' : 'outline'}
          size="md"
          className="shrink-0 relative shadow-xs"
          leftIcon={<ShoppingCart className="w-4 h-4" />}
          onClick={onOpenCart}
        >
          <span>Giỏ đổi quà</span>
          {totalCartItems > 0 && (
            <span className="ml-1.5 px-2 py-0.5 bg-white text-app-primary rounded-full text-xs font-extrabold shadow-2xs">
              {totalCartItems} ({totalCartPoints}đ)
            </span>
          )}
        </Button>
      </div>

      {/* Gifts Grid for Redemption */}
      {activeGifts.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <GiftIcon className="w-10 h-10 text-app-muted mx-auto" />
          <p className="text-sm font-semibold text-app-main">Không có món quà nào phù hợp với bộ lọc</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeGifts.map((gift) => (
            <GiftFlipCard
              key={gift.id}
              gift={gift}
              mode="redemption"
              isFlipped={flippedGiftId === gift.id}
              onFlipChange={handleFlipChange}
              selectedStudentSelected={Boolean(selectedStudent)}
              currentBalance={currentBalance}
              qtyInCart={cart.get(gift.id) || 0}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))}
        </div>
      )}
    </div>
  );
};

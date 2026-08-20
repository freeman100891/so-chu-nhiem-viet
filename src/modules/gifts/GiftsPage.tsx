import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { useToast } from '../../shared/hooks/useToast';
import { db } from '../../core/database/db';
import type {
  ClassRoom,
  Student,
  Gift,
  StudentRewardBalance,
  GiftRedemptionStatus,
  GiftRedemption,
  GiftRedemptionItem,
} from '../../core/database/types';
import { giftService } from '../../core/services/gift.service';
import { giftRedemptionService } from '../../core/services/gift-redemption.service';
import { rewardBalanceService } from '../../core/services/reward-balance.service';
import { classRepository } from '../../core/repositories/class.repository';
import {
  giftRedemptionRepository,
  type DetailedRedemptionRecord,
} from '../../core/repositories/gift-redemption.repository';
import { generateUUID } from '../../shared/utilities/uuid';

// Subcomponents
import { GiftCatalogTab } from './components/GiftCatalogTab';
import { GiftRedeemTab } from './components/GiftRedeemTab';
import { GiftHistoryTab } from './components/GiftHistoryTab';
import { GiftFormModal } from './components/GiftFormModal';
import { GiftStockAdjustModal } from './components/GiftStockAdjustModal';
import { GiftCartDrawer } from './components/GiftCartDrawer';
import { GiftConfirmModal } from './components/GiftConfirmModal';
import { GiftReceiptModal } from './components/GiftReceiptModal';
import { GiftCancelModal } from './components/GiftCancelModal';
import { GiftDetailModal } from './components/GiftDetailModal';

import {
  Gift as GiftIcon,
  ShoppingBag,
  History,
} from 'lucide-react';

export type GiftTabKey = 'thuvien' | 'doiqua' | 'lichsu';

export const GiftsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<GiftTabKey>('thuvien');

  // Master Data
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentBalances, setStudentBalances] = useState<Map<string, StudentRewardBalance>>(new Map());
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [historyRecords, setHistoryRecords] = useState<DetailedRedemptionRecord[]>([]);

  // Cart & Selection
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  // Loading flags
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // History Filter
  const [historyStatusFilter, setHistoryStatusFilter] = useState<GiftRedemptionStatus | 'ALL'>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [stockGift, setStockGift] = useState<Gift | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    redemption: GiftRedemption;
    items: GiftRedemptionItem[];
    studentName: string;
    remainingBalance: number;
  } | null>(null);
  const [cancellingRecord, setCancellingRecord] = useState<DetailedRedemptionRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<DetailedRedemptionRecord | null>(null);

  // Load Classes & Settings on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const classList = await classRepository.findAll();
        const activeClasses = classList.filter((c) => c.status === 'Active' && !c.deletedAt);
        setClasses(activeClasses);

        const settings = await db.settings.get('default');
        if (settings?.activeClassId && activeClasses.some((c) => c.id === settings.activeClassId)) {
          setSelectedClassId(settings.activeClassId);
        } else if (activeClasses.length > 0) {
          setSelectedClassId(activeClasses[0]!.id);
        }
      } catch (err) {
        showError('Lỗi tải dữ liệu', (err as Error).message);
      }
    };
    initData();
  }, [showError]);

  // Load Gifts Catalog
  const reloadGifts = useCallback(async () => {
    try {
      setLoadingGifts(true);
      const list = await giftService.getCatalogGifts(true);
      setGifts(list);
    } catch (err) {
      showError('Lỗi tải danh mục quà', (err as Error).message);
    } finally {
      setLoadingGifts(false);
    }
  }, [showError]);

  useEffect(() => {
    reloadGifts();
  }, [reloadGifts]);

  // Load Students & Balances for Selected Class
  const reloadClassStudentsAndBalances = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setStudentBalances(new Map());
      return;
    }

    try {
      const enrollments = await db.classEnrollments
        .where('classId')
        .equals(selectedClassId)
        .filter((en) => en.status === 'Active' && !en.deletedAt)
        .toArray();

      const studentIds = enrollments.map((e) => e.studentId);
      const studentList = await db.students.where('id').anyOf(studentIds).filter((s) => !s.deletedAt).toArray();
      studentList.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(studentList);

      const balances = await rewardBalanceService.calculateClassBalances(selectedClassId);
      setStudentBalances(balances);
    } catch (err) {
      showError('Lỗi tải danh sách học sinh', (err as Error).message);
    }
  }, [selectedClassId, showError]);

  useEffect(() => {
    reloadClassStudentsAndBalances();
  }, [reloadClassStudentsAndBalances]);

  // Load History Records
  const reloadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const records = await giftRedemptionRepository.queryHistoryWithDetails({
        classId: selectedClassId || undefined,
        status: historyStatusFilter,
        searchQuery: historySearchQuery,
      });
      setHistoryRecords(records);
    } catch (err) {
      showError('Lỗi tải lịch sử đổi quà', (err as Error).message);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedClassId, historyStatusFilter, historySearchQuery, showError]);

  useEffect(() => {
    if (activeTab === 'lichsu') {
      reloadHistory();
    }
  }, [activeTab, reloadHistory]);

  // Handle Class Change
  const handleSelectClass = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedStudentId('');
    setCart(new Map());
  };

  // Handle Student Change
  const handleSelectStudent = (newStudentId: string) => {
    setSelectedStudentId(newStudentId);
    setCart(new Map());
  };

  // Cart operations
  const giftsMap = useMemo(() => new Map(gifts.map((g) => [g.id, g])), [gifts]);

  const handleUpdateCartQuantity = (giftId: string, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const current = next.get(giftId) || 0;
      const newQty = current + delta;
      if (newQty <= 0) {
        next.delete(giftId);
      } else {
        const gift = giftsMap.get(giftId);
        if (gift && gift.inventoryMode === 'TRACKED') {
          const maxStock = gift.stockOnHand ?? 0;
          next.set(giftId, Math.min(newQty, maxStock));
        } else {
          next.set(giftId, newQty);
        }
      }
      return next;
    });
  };

  const handleRemoveFromCart = (giftId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(giftId);
      return next;
    });
  };

  const handleClearCart = () => {
    setCart(new Map());
  };

  // Save Gift (Create / Edit)
  const handleSaveGift = async (giftData: {
    name: string;
    description?: string;
    category: any;
    pointCost: number;
    inventoryMode: any;
    stockOnHand?: number;
    lowStockThreshold?: number;
    presentationVisible: boolean;
    icon: string;
    pendingImage?: any;
    removeImage?: boolean;
  }) => {
    if (editingGift) {
      await giftService.updateGift(editingGift.id, giftData);
      showSuccess('Cập nhật thành công', `Đã lưu thay đổi món quà "${giftData.name}".`);
    } else {
      await giftService.createGift(giftData);
      showSuccess('Tạo quà thành công', `Đã thêm món quà "${giftData.name}" vào thư viện.`);
    }
    await reloadGifts();
  };

  // Adjust Stock
  const handleAdjustStock = async (giftId: string, newStock: number, reason: string) => {
    await giftService.adjustStock(giftId, newStock, reason);
    showSuccess('Cập nhật tồn kho', `Đã cập nhật số lượng tồn kho mới (${newStock} món).`);
    await reloadGifts();
  };

  // Toggle Archive
  const handleToggleArchive = async (gift: Gift) => {
    const isArchived = gift.status === 'ARCHIVED';
    await giftService.toggleArchive(gift.id, !isArchived);
    showSuccess(
      isArchived ? 'Khôi phục thành công' : 'Lưu trữ thành công',
      isArchived ? `Món quà "${gift.name}" đã hoạt động trở lại.` : `Đã chuyển món quà "${gift.name}" vào kho lưu trữ.`
    );
    await reloadGifts();
  };

  // Confirm Redemption Submission
  const handleConfirmRedemption = async (note: string) => {
    if (!selectedStudentId || !selectedClassId) {
      throw new Error('Chưa chọn học sinh.');
    }

    const cartItems = Array.from(cart.entries()).map(([giftId, quantity]) => ({ giftId, quantity }));
    const idempotencyKey = generateUUID();

    const result = await giftRedemptionService.executeRedemption({
      studentId: selectedStudentId,
      classId: selectedClassId,
      cartItems,
      note,
      idempotencyKey,
    });

    const student = students.find((s) => s.id === selectedStudentId);
    setReceiptData({
      redemption: result.redemption,
      items: result.items,
      studentName: student?.fullName || 'Học sinh',
      remainingBalance: result.redeemableBalanceAfter,
    });

    showSuccess('Đổi quà thành công!', `Đã trừ ${result.redemption.totalPoints} điểm khả dụng của ${student?.fullName}.`);

    // Reset cart and reload data
    setCart(new Map());
    await Promise.all([reloadClassStudentsAndBalances(), reloadGifts()]);
  };

  // Cancel Redemption
  const handleCancelRedemption = async (redemptionId: string, reason: string) => {
    const updated = await giftRedemptionService.cancelRedemption(redemptionId, reason);
    showSuccess('Hủy giao dịch thành công', `Đã hoàn trả +${updated.totalPoints} điểm khả dụng cho học sinh.`);
    await Promise.all([reloadClassStudentsAndBalances(), reloadGifts(), reloadHistory()]);
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );
  const selectedStudentBalance = selectedStudentId ? studentBalances.get(selectedStudentId)?.redeemableBalance || 0 : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Page Header */}
      <PageHeader
        title="Thư Viện Quà Tặng & Đổi Điểm Tích Lũy"
        description="Quản lý phần thưởng học tập, theo dõi điểm khả dụng và quy đổi quà cho học sinh an toàn, nguyên tử"
        badgeText="100% Offline"
      />

      {/* Tabs Switcher Navigation */}
      <div className="flex items-center gap-2 border-b border-app pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('thuvien')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'thuvien'
              ? 'bg-app-primary text-app-primary-fg shadow-xs'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          }`}
        >
          <GiftIcon className="w-4 h-4" />
          <span>Thư viện Quà tặng ({gifts.filter((g) => !g.deletedAt && g.status !== 'ARCHIVED').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doiqua')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'doiqua'
              ? 'bg-app-primary text-app-primary-fg shadow-xs'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Đổi quà Học sinh</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lichsu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'lichsu'
              ? 'bg-app-primary text-app-primary-fg shadow-xs'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử Giao dịch</span>
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'thuvien' && (
        <GiftCatalogTab
          gifts={gifts}
          loading={loadingGifts}
          onOpenCreateModal={() => {
            setEditingGift(null);
            setIsCreateOpen(true);
          }}
          onOpenEditModal={(gift) => {
            setEditingGift(gift);
            setIsCreateOpen(true);
          }}
          onOpenStockModal={(gift) => {
            setStockGift(gift);
          }}
          onToggleArchive={handleToggleArchive}
          onOpenPresentation={() => navigate('/gifts/presentation')}
        />
      )}

      {/* Tab 2: Redeem */}
      {activeTab === 'doiqua' && (
        <GiftRedeemTab
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={handleSelectClass}
          students={students}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
          studentBalances={studentBalances}
          gifts={gifts}
          cart={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onOpenCart={() => setIsCartDrawerOpen(true)}
        />
      )}

      {/* Tab 3: History */}
      {activeTab === 'lichsu' && (
        <GiftHistoryTab
          historyRecords={historyRecords}
          loading={loadingHistory}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          statusFilter={historyStatusFilter}
          onSelectStatus={setHistoryStatusFilter}
          searchQuery={historySearchQuery}
          onSearchChange={setHistorySearchQuery}
          onOpenDetail={(rec) => setDetailRecord(rec)}
          onOpenCancel={(rec) => setCancellingRecord(rec)}
        />
      )}

      {/* Modals & Drawers */}
      <GiftFormModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingGift(null);
        }}
        onSave={handleSaveGift}
        initialGift={editingGift}
      />

      <GiftStockAdjustModal
        isOpen={Boolean(stockGift)}
        onClose={() => setStockGift(null)}
        gift={stockGift}
        onAdjustStock={handleAdjustStock}
      />

      <GiftCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        giftsMap={giftsMap}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        studentName={selectedStudent?.fullName}
        currentBalance={selectedStudentBalance}
        onProceedToConfirm={() => {
          setIsCartDrawerOpen(false);
          setIsConfirmOpen(true);
        }}
      />

      <GiftConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        studentName={selectedStudent?.fullName || 'Học sinh'}
        studentCode={selectedStudent?.studentCode}
        className={classes.find((c) => c.id === selectedClassId)?.name ? `Lớp ${classes.find((c) => c.id === selectedClassId)?.name}` : undefined}
        cart={cart}
        giftsMap={giftsMap}
        currentBalance={selectedStudentBalance}
        onConfirm={handleConfirmRedemption}
      />

      <GiftReceiptModal
        isOpen={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        redemption={receiptData?.redemption || null}
        items={receiptData?.items || []}
        studentName={receiptData?.studentName || 'Học sinh'}
        remainingBalance={receiptData?.remainingBalance || 0}
        onViewHistory={() => setActiveTab('lichsu')}
        onContinueRedeeming={() => setActiveTab('doiqua')}
      />

      <GiftCancelModal
        isOpen={Boolean(cancellingRecord)}
        onClose={() => setCancellingRecord(null)}
        record={cancellingRecord}
        onCancelRedemption={handleCancelRedemption}
      />

      <GiftDetailModal
        isOpen={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        record={detailRecord}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { Badge } from '../../shared/components/Badge';
import { Table, type Column } from '../../shared/components/Table';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { trashService, type TrashItem } from '../../core/services/trash.service';
import { formatDateVietnamese } from '../../shared/utilities/date';
import { Trash2, RotateCcw, ShieldAlert, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TrashPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal 2-Step Single Hard Delete Confirm State
  const [deletingItem, setDeletingItem] = useState<TrashItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step2ConfirmText, setStep2ConfirmText] = useState('');

  // Modal 2-Step Bulk Hard Delete Confirm State
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkStep2ConfirmText, setBulkStep2ConfirmText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await trashService.getTrashItems();
      setTrashItems(items);
    } catch (err) {
      console.error('Error loading trash items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(
    () => trashItems.filter((i) => filterType === 'all' || i.type === filterType),
    [trashItems, filterType]
  );

  const handleRestore = async (item: TrashItem) => {
    try {
      await trashService.restoreItem(item.type, item.id);
      showSuccess('Khôi phục thành công', `Đã khôi phục "${item.name}" về hệ thống.`);
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      loadData();
    } catch (err: unknown) {
      showError('Lỗi khôi phục', (err as Error).message);
    }
  };

  const handleBulkRestore = async () => {
    const itemsToRestore = trashItems.filter((i) => selectedIds.includes(i.id));
    if (itemsToRestore.length === 0) return;

    try {
      const { successCount } = await trashService.restoreItems(
        itemsToRestore.map((i) => ({ type: i.type, id: i.id }))
      );
      showSuccess('Khôi phục thành công', `Đã khôi phục ${successCount} mục về hệ thống.`);
      setSelectedIds([]);
      loadData();
    } catch (err: unknown) {
      showError('Lỗi khôi phục hàng loạt', (err as Error).message);
    }
  };

  const handleOpenHardDelete = (item: TrashItem) => {
    setDeletingItem(item);
    setStep2ConfirmText('');
    setShowConfirmModal(true);
  };

  const handleExecuteHardDelete = async () => {
    if (!deletingItem) return;
    if (step2ConfirmText !== 'XÓA VĨNH VIỄN') {
      showError('Xác nhận không đúng', 'Vui lòng gõ chữ "XÓA VĨNH VIỄN" để xác nhận.');
      return;
    }

    try {
      await trashService.hardDeleteItem(deletingItem.type, deletingItem.id);
      showSuccess('Đã xóa vĩnh viễn', `Đã xóa hoàn toàn "${deletingItem.name}" khỏi database.`);
      setShowConfirmModal(false);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingItem.id));
      setDeletingItem(null);
      loadData();
    } catch (err: unknown) {
      showError('Lỗi xóa vĩnh viễn', (err as Error).message);
    }
  };

  const handleOpenBulkHardDelete = () => {
    setBulkStep2ConfirmText('');
    setShowBulkConfirmModal(true);
  };

  const handleExecuteBulkHardDelete = async () => {
    if (bulkStep2ConfirmText !== 'XÓA VĨNH VIỄN') {
      showError('Xác nhận không đúng', 'Vui lòng gõ chữ "XÓA VĨNH VIỄN" để xác nhận.');
      return;
    }

    const itemsToDelete = trashItems.filter((i) => selectedIds.includes(i.id));
    try {
      const { successCount } = await trashService.hardDeleteItems(
        itemsToDelete.map((i) => ({ type: i.type, id: i.id }))
      );
      showSuccess('Đã xóa vĩnh viễn', `Đã xóa hoàn toàn ${successCount} mục khỏi database.`);
      setShowBulkConfirmModal(false);
      setSelectedIds([]);
      loadData();
    } catch (err: unknown) {
      showError('Lỗi xóa vĩnh viễn hàng loạt', (err as Error).message);
    }
  };

  const columns: Column<TrashItem>[] = [
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
            onChange={() => {
              if (selectedIds.length === filteredItems.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(filteredItems.map((i) => i.id));
              }
            }}
            className="w-4 h-4 rounded text-app-primary cursor-pointer"
            aria-label="Chọn tất cả mục"
          />
        </div>
      ),
      cell: (row) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => {
              setSelectedIds((prev) =>
                prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
              );
            }}
            className="w-4 h-4 rounded text-app-primary cursor-pointer"
            aria-label={`Chọn mục ${row.name}`}
          />
        </div>
      ),
      className: 'w-10 text-center',
    },
    {
      header: 'Loại mục',
      cell: (row) => <Badge variant="primary">{row.typeLabel}</Badge>,
    },
    {
      header: 'Tên mục',
      cell: (row) => <span className="font-bold text-app-main">{row.name}</span>,
    },
    {
      header: 'Chi tiết bản ghi',
      cell: (row) => <span className="text-xs text-app-muted">{row.details}</span>,
    },
    {
      header: 'Ngày xóa tạm',
      cell: (row) => (
        <span className="text-xs text-app-muted font-mono">
          {formatDateVietnamese(row.deletedAt.substring(0, 10))}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => handleRestore(row)}
          >
            Khôi phục
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50 border-red-200"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => handleOpenHardDelete(row)}
          >
            Xóa vĩnh viễn
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Thùng Rác & Phục Hồi Dữ Liệu"
        description="Quản lý các bản ghi đã xóa tạm, hỗ trợ khôi phục nguyên trạng hoặc xóa vĩnh viễn có xác nhận 2 bước"
        badgeText={`${filteredItems.length} mục`}
      />

      {/* BULK ACTION FLOATING TOOLBAR */}
      {selectedIds.length > 0 && (
        <div
          data-testid="trash-bulk-action-bar"
          className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-2xl border border-slate-700/60 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-app-primary text-app-primary-fg text-xs font-black shadow-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              Đã chọn <span className="text-app-primary font-black">{selectedIds.length}</span> / {filteredItems.length} mục
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedIds.length === filteredItems.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filteredItems.map((i) => i.id));
                }
              }}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
            >
              {selectedIds.length === filteredItems.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4 text-emerald-400" />}
              onClick={handleBulkRestore}
              className="bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white font-bold text-xs shadow-xs"
              data-testid="bulk-restore-btn"
            >
              Khôi phục {selectedIds.length} mục
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
              onClick={handleOpenBulkHardDelete}
              className="bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs shadow-xs"
              data-testid="bulk-hard-delete-btn"
            >
              Xóa vĩnh viễn {selectedIds.length} mục
            </Button>
          </div>
        </div>
      )}

      <Card
        title="Danh Sách Mục Bị Xóa Tạm (Soft Deleted)"
        action={
          <Button size="sm" variant="outline" leftIcon={<Database className="w-4 h-4" />} onClick={() => navigate('/backup')}>
            Sao lưu dữ liệu trước khi xóa
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="Lọc theo loại mục"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setSelectedIds([]);
              }}
              options={[
                { value: 'all', label: 'Tất cả các mục' },
                { value: 'class', label: 'Lớp học' },
                { value: 'student', label: 'Học sinh' },
                { value: 'note', label: 'Ghi chú' },
              ]}
            />
          </div>

          {loading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : (
            <Table
              columns={columns}
              data={filteredItems}
              keyExtractor={(row) => row.id}
              emptyTitle="Thùng rác trống"
              emptyDescription="Không có bản ghi nào bị xóa tạm trong hệ thống."
            />
          )}
        </div>
      </Card>

      {/* MODAL 1: 2-STEP SINGLE HARD DELETE CONFIRMATION */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Cảnh Báo Xóa Vĩnh Viễn 2 Bước">
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!</span>
            </div>
            <p>
              Bạn sắp xóa vĩnh viễn mục <strong>"{deletingItem?.name}"</strong> khỏi cơ sở dữ liệu IndexedDB. Tất cả bản ghi liên quan sẽ bị loại bỏ hoàn toàn.
            </p>
            <p className="font-semibold text-amber-900 bg-amber-100/80 p-2 rounded-lg border border-amber-300">
              Khuyến cáo: Thầy/Cô nên tạo bản SAO LƯU DỮ LIỆU (`.gvcn-backup`) tại trang Sao lưu trước khi thực hiện xóa vĩnh viễn.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-main block">
              Nhập chữ <span className="text-red-600 font-mono">XÓA VĨNH VIỄN</span> bên dưới để xác nhận:
            </label>
            <input
              type="text"
              placeholder="XÓA VĨNH VIỄN"
              className="w-full p-3 rounded-xl border border-app bg-app-surface text-app-main text-sm font-mono focus:ring-2 focus:ring-red-500"
              value={step2ConfirmText}
              onChange={(e) => setStep2ConfirmText(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirmModal(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={step2ConfirmText !== 'XÓA VĨNH VIỄN'}
              onClick={handleExecuteHardDelete}
            >
              Xác Nhận Xóa Vĩnh Viễn
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: 2-STEP BULK HARD DELETE CONFIRMATION */}
      <Modal
        isOpen={showBulkConfirmModal}
        onClose={() => setShowBulkConfirmModal(false)}
        title={`Cảnh Báo Xóa Vĩnh Viễn ${selectedIds.length} Mục Đã Chọn`}
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!</span>
            </div>
            <p>
              Bạn sắp xóa vĩnh viễn <strong>{selectedIds.length} mục đã chọn</strong> khỏi cơ sở dữ liệu IndexedDB. Toàn bộ bản ghi liên quan sẽ bị loại bỏ hoàn toàn và không thể khôi phục.
            </p>
            <p className="font-semibold text-amber-900 bg-amber-100/80 p-2 rounded-lg border border-amber-300">
              Khuyến cáo: Thầy/Cô nên tạo bản SAO LƯU DỮ LIỆU (`.gvcn-backup`) tại trang Sao lưu trước khi thực hiện xóa vĩnh viễn.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-main block">
              Nhập chữ <span className="text-red-600 font-mono">XÓA VĨNH VIỄN</span> bên dưới để xác nhận:
            </label>
            <input
              type="text"
              placeholder="XÓA VĨNH VIỄN"
              className="w-full p-3 rounded-xl border border-app bg-app-surface text-app-main text-sm font-mono focus:ring-2 focus:ring-red-500"
              value={bulkStep2ConfirmText}
              onChange={(e) => setBulkStep2ConfirmText(e.target.value)}
              data-testid="bulk-delete-confirm-input"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowBulkConfirmModal(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={bulkStep2ConfirmText !== 'XÓA VĨNH VIỄN'}
              onClick={handleExecuteBulkHardDelete}
              data-testid="confirm-bulk-hard-delete-btn"
            >
              Xác Nhận Xóa Vĩnh Viễn ({selectedIds.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

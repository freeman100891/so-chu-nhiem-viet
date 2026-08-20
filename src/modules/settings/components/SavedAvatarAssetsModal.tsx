import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { avatarAssetService } from '../../../core/services/avatar-asset.service';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import type { AvatarAsset } from '../../../core/database/types';
import type { AvatarProgressLevel } from '../../../core/types/avatar-theme.types';
import {
  Trash2,
  CheckCircle2,
  HardDrive,
  Calendar,
  Layers,
} from 'lucide-react';

export interface SavedAvatarAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLevel: AvatarProgressLevel;
  currentAssetId?: string;
  onSelectAsset: (assetId: string, objectUrl: string) => void;
}

export const SavedAvatarAssetsModal: React.FC<SavedAvatarAssetsModalProps> = ({
  isOpen,
  onClose,
  targetLevel,
  currentAssetId,
  onSelectAsset,
}) => {
  const [assets, setAssets] = useState<AvatarAsset[]>([]);
  const [assetUrls, setAssetUrls] = useState<Map<string, string>>(new Map());
  const [filterLevel, setFilterLevel] = useState<'current' | 'all'>('current');
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const allAssets = await avatarAssetService.getAllUploadedAvatarAssets();
      setAssets(allAssets);

      // Preload URLs
      const ids = allAssets.map((a) => a.id);
      const urlMap = await avatarAssetService.preloadAssetUrls(ids);
      setAssetUrls(urlMap);
    } catch (err) {
      console.error('Error loading saved avatar assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, loadAssets]);

  const displayedAssets = assets.filter((asset) => {
    if (filterLevel === 'current') {
      return asset.targetLevel === targetLevel || (!asset.targetLevel && assets.length <= 5);
    }
    return true;
  });

  const handleDelete = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi kho lưu trữ?')) {
      return;
    }

    setDeletingId(assetId);
    try {
      await avatarAssetService.deleteAvatarAsset(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      console.error('Error deleting asset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (asset: AvatarAsset) => {
    const url = assetUrls.get(asset.id) || '';
    onSelectAsset(asset.id, url);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kho Ảnh Đã Tải Lên Cho Cấp ${targetLevel}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Top filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-app">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterLevel('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterLevel === 'current'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-app-surface text-app-muted hover:text-app-main border border-app'
              }`}
            >
              Ảnh Cấp {targetLevel} ({assets.filter((a) => a.targetLevel === targetLevel).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterLevel === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-app-surface text-app-muted hover:text-app-main border border-app'
              }`}
            >
              Tất cả ảnh đã tải ({assets.length})
            </button>
          </div>

          <p className="text-xs text-app-muted flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-app-primary" />
            Đã lưu trữ an toàn trong máy (IndexedDB)
          </p>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="py-6">
            <LoadingSkeleton type="card" count={3} />
          </div>
        ) : displayedAssets.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-10 h-10 text-app-muted" />}
            title="Chưa có ảnh tải lên nào"
            description={
              filterLevel === 'current'
                ? `Chưa có ảnh nào được tải lên hoặc gán cho Cấp ${targetLevel}. Bạn có thể chọn tab "Tất cả ảnh" hoặc tải ảnh mới từ máy tính.`
                : 'Bạn chưa tải lên ảnh avatar tùy chỉnh nào. Hãy tải lên ảnh từ máy tính để lưu vào kho.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
            {displayedAssets.map((asset) => {
              const url = assetUrls.get(asset.id);
              const isSelected = asset.id === currentAssetId;
              const isDeleting = deletingId === asset.id;

              return (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className={`group relative p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between overflow-hidden bg-app-surface shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20'
                      : 'border-app hover:border-blue-400 hover:bg-app-surface-hover'
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="w-full aspect-square rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden mb-2 shadow-2xs">
                    {url ? (
                      <img
                        src={url}
                        alt={asset.originalFileName || `Ảnh Cấp ${asset.targetLevel || targetLevel}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-app-main truncate block">
                        {asset.originalFileName || `Avatar Cấp ${asset.targetLevel || targetLevel}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-app-muted">
                      <Badge variant="neutral">
                        {asset.mimeType.split('/')[1]?.toUpperCase()}
                      </Badge>
                      <span className="font-mono">{formatFileSize(asset.sizeBytes)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-app text-[10px] text-app-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateVietnamese(asset.createdAt)}
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => handleDelete(asset.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa ảnh khỏi bộ nhớ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hover Apply Overlay */}
                  <div className="mt-2 pt-2 border-t border-app">
                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full text-xs font-bold"
                    >
                      {isSelected ? 'Đang dùng' : 'Chọn ảnh này'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-app">
          <span className="text-xs text-app-muted">
            Tổng cộng <strong>{assets.length}</strong> ảnh trong kho lưu trữ
          </span>

          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

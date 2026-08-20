import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { honorBoardService, type HonorBoardDetailsResult } from '../../../core/services/honor-board.service';
import { settingsRepository } from '../../../core/repositories/settings.repository';
import { avatarAssetService } from '../../../core/services/avatar-asset.service';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import { avatarThemeRegistry, DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../../core/services/avatar-theme-registry';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import { TopRankPodium } from './components/TopRankPodium';
import { HonorTitleCard } from './components/HonorTitleCard';
import { CollectiveProgressCard } from './components/CollectiveProgressCard';
import {
  Trophy,
  Tv,
  Printer,
  Sparkles,
  ArrowLeft,
  Calendar,
  FileEdit,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const HonorBoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<HonorBoardDetailsResult | null>(null);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS);
  const [uploadedAssetUrls, setUploadedAssetUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        honorBoardService.getBoardDetails(boardId),
        settingsRepository.getSettings(),
      ]);
      setDetails(data);

      const activeSysSettings = avatarThemeRegistry.resolveGlobalSettings(settings);
      setGlobalAvatarSettings(activeSysSettings);

      const uploadedIds = activeSysSettings.levels
        .filter((l) => l.image.kind === 'UPLOADED')
        .map((l) => (l.image as { kind: 'UPLOADED'; assetId: string }).assetId);
      if (uploadedIds.length > 0) {
        const urlMap = await avatarAssetService.preloadAssetUrls(uploadedIds);
        setUploadedAssetUrls(urlMap);
      }
    } catch (err) {
      console.error('Error loading honor board details:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handlePublish = async () => {
    if (!boardId) return;
    setActionLoading(true);
    try {
      await honorBoardService.publishBoard(boardId);
      await loadBoard();
    } catch (err) {
      console.error('Error publishing board:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!boardId) return;
    const confirmRevert = window.confirm('Bạn có chắc chắn muốn chuyển Bảng vàng này về bản nháp để chỉnh sửa?');
    if (!confirmRevert) return;

    setActionLoading(true);
    try {
      await honorBoardService.revertToDraft(boardId, 'Giáo viên yêu cầu chỉnh sửa danh sách');
      await loadBoard();
    } catch (err) {
      console.error('Error reverting board:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-12 text-center bg-app-surface border border-app rounded-3xl space-y-4 max-w-md mx-auto">
        <Trophy className="w-12 h-12 text-app-muted mx-auto" />
        <h3 className="text-base font-bold text-app-main">Không tìm thấy Bảng Vàng</h3>
        <Button variant="primary" size="md" onClick={() => navigate('/conduct/honor-board')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const { board, topRankPodium, groupedByTitle, collectiveMetrics } = details;
  const isPublished = board.status === 'published';

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* TOP CONTROLS (HIDDEN ON PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/conduct/honor-board')}
          >
            Danh sách Bảng vàng
          </Button>
          <Badge variant={isPublished ? 'success' : 'warning'}>
            {isPublished ? 'Đã công bố' : 'Bản nháp'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            In Bảng Vàng (A4)
          </Button>

          {isPublished ? (
            <>
              <Button
                variant="primary"
                size="sm"
                className="font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                leftIcon={<Tv className="w-4 h-4" />}
                onClick={() => navigate(`/conduct/honor-board/${board.id}/present`)}
              >
                Trình chiếu 16:9
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-app-muted hover:text-red-600"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                disabled={actionLoading}
                onClick={handleRevertToDraft}
              >
                Sửa bản công bố
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileEdit className="w-4 h-4" />}
                onClick={() => navigate(`/conduct/honor-board/${board.id}/edit`)}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="font-bold shadow-md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                disabled={actionLoading}
                onClick={handlePublish}
              >
                Công bố ngay
              </Button>
            </>
          )}
        </div>
      </div>

      {/* GOLDEN HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/25 border-2 border-amber-300 dark:border-amber-700 shadow-sm p-6 sm:p-8 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 dark:bg-amber-950/80 border border-amber-400 text-amber-950 dark:text-amber-200 text-xs font-black uppercase tracking-wider shadow-2xs">
          <Sparkles className="w-4 h-4 text-amber-600 fill-current animate-spin" style={{ animationDuration: '6s' }} />
          Bảng Vàng Danh Hiệu Thi Đua
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-amber-950 dark:text-amber-100 tracking-tight uppercase">
          {board.title}
        </h1>

        <p className="text-sm sm:text-base font-bold text-amber-900/90 dark:text-amber-200/90 max-w-xl mx-auto">
          “Chúc mừng những chiến sĩ nhỏ đã nỗ lực vượt bậc, rèn luyện nề nếp và gặt hái thành tích xuất sắc!”
        </p>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 pt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Thời gian xét: {formatDateVietnamese(board.startDate)} - {formatDateVietnamese(board.endDate)}</span>
        </div>
      </div>

      {/* TOP RANK PODIUM */}
      {topRankPodium.length > 0 && (
        <TopRankPodium
          podiumRecipients={topRankPodium}
          showPointValues={board.showPointValues}
          globalActiveThemeId={globalAvatarSettings.presetThemeId}
          globalSettings={globalAvatarSettings}
          uploadedAssetUrls={uploadedAssetUrls}
        />
      )}

      {/* HONOR TITLES GRID */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-black text-app-main">Danh Hiệu Vinh Danh Trong Kỳ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupedByTitle.map((grp) => (
            <HonorTitleCard
              key={grp.title.id}
              title={grp.title}
              recipients={grp.recipients}
              showPointValues={board.showPointValues}
              globalActiveThemeId={globalAvatarSettings.presetThemeId}
              globalSettings={globalAvatarSettings}
              uploadedAssetUrls={uploadedAssetUrls}
            />
          ))}
        </div>
      </div>

      {/* COLLECTIVE PROGRESS */}
      <CollectiveProgressCard metrics={collectiveMetrics} />
    </div>
  );
};

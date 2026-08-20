import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { Badge } from '../../../shared/components/Badge';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { classRepository } from '../../../core/repositories/class.repository';
import { settingsRepository } from '../../../core/repositories/settings.repository';
import { academicYearRepository } from '../../../core/repositories/academic-year.repository';
import { honorBoardRepository } from '../../../core/repositories/honor-board.repository';
import { honorTitleSeedService } from '../../../core/services/honor-title-seed.service';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import type { ClassRoom, AcademicYear, HonorBoard } from '../../../core/database/types';
import {
  Trophy,
  Plus,
  Tv,
  Calendar,
  History,
  FileEdit,
  ArrowRight,
} from 'lucide-react';

export const HonorBoardListPage: React.FC = () => {
  const navigate = useNavigate();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [boards, setBoards] = useState<HonorBoard[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await honorTitleSeedService.seedDefaultTitles();

      const settings = await settingsRepository.getSettings();
      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      let activeClsId = '';
      if (yearId) {
        const year = await academicYearRepository.findById(yearId);
        setActiveYear(year || null);

        const classes = await classRepository.findByAcademicYear(yearId);
        setClassList(classes);

        activeClsId = classes[0]?.id || '';
        if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
          activeClsId = settings.activeClassId;
        }
        if (!selectedClassId) {
          setSelectedClassId(activeClsId);
        }
      }

      const targetClassId = selectedClassId || activeClsId;
      if (targetClassId) {
        const boardList = await honorBoardRepository.findByClass(targetClassId);
        setBoards(boardList);
      }
    } catch (err) {
      console.error('Error loading honor boards:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBoards = boards.filter((b) => {
    if (statusFilter === 'published') return b.status === 'published';
    if (statusFilter === 'draft') return b.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Bảng Vàng Danh Hiệu"
        description="Vinh danh học sinh tiêu biểu, ghi nhận tiến bộ và tạo động lực thi đua học đường tích cực"
        badgeText={activeYear?.name}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<History className="w-4 h-4" />}
              onClick={() => navigate('/conduct/honor-board/history')}
            >
              Lịch sử vinh danh
            </Button>
            <Button
              variant="primary"
              size="md"
              className="font-bold shadow-xs hover:shadow-md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/conduct/honor-board/new')}
            >
              Tạo Bảng Vàng mới
            </Button>
          </div>
        }
      />

      {/* FILTER & CLASS SELECTOR */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            <Select
              label="Chọn Lớp học"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-app-primary text-app-primary-fg shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-app-muted hover:text-app-main'
              }`}
            >
              Tất cả ({boards.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-app-muted hover:text-app-main'
              }`}
            >
              Đã công bố ({boards.filter((b) => b.status === 'published').length})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-app-muted hover:text-app-main'
              }`}
            >
              Bản nháp ({boards.filter((b) => b.status === 'draft').length})
            </button>
          </div>
        </div>
      </Card>

      {/* BOARDS GRID */}
      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : filteredBoards.length === 0 ? (
        <div className="p-12 text-center bg-app-surface border border-dashed border-app rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 mx-auto flex items-center justify-center shadow-xs">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-black text-app-main">Chưa có Bảng Vàng nào cho lớp này</h3>
            <p className="text-xs text-app-muted">
              Hãy tạo Bảng Vàng đầu tiên theo tuần hoặc tháng để vinh danh các chiến sĩ nhỏ tiến bộ.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/conduct/honor-board/new')}
          >
            Tạo Bảng Vàng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBoards.map((board) => {
            const isPublished = board.status === 'published';
            return (
              <div
                key={board.id}
                className="p-5 rounded-3xl bg-app-surface border border-app shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-app-primary bg-app-primary-light px-2.5 py-0.5 rounded-full font-mono">
                      <Calendar className="w-3 h-3" />
                      {board.periodType === 'week' ? 'Theo Tuần' : board.periodType === 'month' ? 'Theo Tháng' : 'Theo Học Kỳ'}
                    </span>
                    <Badge variant={isPublished ? 'success' : 'warning'}>
                      {isPublished ? 'Đã công bố' : 'Bản nháp'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-black text-app-main line-clamp-1">{board.title}</h3>
                  <p className="text-xs text-app-muted">
                    Thời gian: {formatDateVietnamese(board.startDate)} - {formatDateVietnamese(board.endDate)}
                  </p>
                </div>

                <div className="pt-3 border-t border-app flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-bold"
                      onClick={() => navigate(`/conduct/honor-board/${board.id}`)}
                    >
                      Xem chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                    </Button>
                    {isPublished && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-bold"
                        leftIcon={<Tv className="w-3.5 h-3.5 text-purple-600" />}
                        onClick={() => navigate(`/conduct/honor-board/${board.id}/present`)}
                        title="Trình chiếu toàn màn hình 16:9"
                      >
                        Chiếu 16:9
                      </Button>
                    )}
                  </div>

                  {!isPublished && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/conduct/honor-board/${board.id}/edit`)}
                    >
                      Sửa
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

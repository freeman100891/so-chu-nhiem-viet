import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { classRepository } from '../../../core/repositories/class.repository';
import { settingsRepository } from '../../../core/repositories/settings.repository';
import { academicYearRepository } from '../../../core/repositories/academic-year.repository';
import { honorBoardRepository } from '../../../core/repositories/honor-board.repository';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import type { ClassRoom, AcademicYear, HonorBoard } from '../../../core/database/types';
import {
  History,
  Trophy,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export const HonorBoardHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [publishedBoards, setPublishedBoards] = useState<HonorBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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
        const boards = await honorBoardRepository.findByClass(targetClassId);
        setPublishedBoards(boards.filter((b) => b.status === 'published'));
      }
    } catch (err) {
      console.error('Error loading honor history:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      <PageHeader
        title="Lịch Sử Vinh Danh Bảng Vàng"
        description="Tổng hợp các đợt vinh danh và snapshot danh hiệu đã công bố trong năm học"
        badgeText={activeYear?.name}
        action={
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/conduct/honor-board')}
          >
            Quay lại Bảng Vàng
          </Button>
        }
      />

      <Card>
        <div className="max-w-xs">
          <Select
            label="Chọn Lớp theo dõi"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : publishedBoards.length === 0 ? (
        <div className="p-12 text-center bg-app-surface border border-dashed border-app rounded-3xl space-y-3">
          <History className="w-12 h-12 text-app-muted mx-auto" />
          <h3 className="text-base font-bold text-app-main">Chưa có Bảng Vàng nào được công bố</h3>
          <p className="text-xs text-app-muted max-w-sm mx-auto">
            Các Bảng Vàng sau khi được giáo viên công bố sẽ xuất hiện tại dòng thời gian lịch sử này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedBoards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/conduct/honor-board/${board.id}`)}
              className="p-5 rounded-3xl bg-app-surface border border-app shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-app-primary bg-app-primary-light px-2.5 py-0.5 rounded-full font-mono">
                      {board.periodType === 'week' ? 'Tuần' : board.periodType === 'month' ? 'Tháng' : 'Học kỳ'}
                    </span>
                    <span className="text-xs text-app-muted">
                      Công bố: {formatDateVietnamese(board.publishedAt ? board.publishedAt.split('T')[0]! : board.startDate)}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-app-main mt-1 truncate">{board.title}</h3>
                  <p className="text-xs text-app-muted mt-0.5">
                    Giai đoạn: {formatDateVietnamese(board.startDate)} - {formatDateVietnamese(board.endDate)}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="font-bold shrink-0 self-end sm:self-center">
                Xem Bảng Vàng <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

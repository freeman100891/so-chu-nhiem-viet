import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { Badge } from '../../shared/components/Badge';
import { Table, type Column } from '../../shared/components/Table';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { db } from '../../core/database/db';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type { AttendanceSession, ClassRoom } from '../../core/database/types';
import { Calendar, History, Eye, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface SessionHistoryItem extends AttendanceSession {
  className: string;
}

export const AttendanceHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [historyList, setHistoryList] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      let yearId = settings?.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      const allClasses = await db.classes.filter((c) => !c.deletedAt).toArray();
      let classes = yearId ? allClasses.filter((c) => !c.academicYearId || c.academicYearId === yearId) : allClasses;
      if (classes.length === 0) {
        classes = allClasses;
      }
      setClassList(classes);

      const sessions = await db.attendanceSessions
        .filter((s) => !s.deletedAt)
        .reverse()
        .sortBy('sessionDate');

      const items: SessionHistoryItem[] = [];
      for (const s of sessions) {
        const cls = await db.classes.get(s.classId);
        if (selectedClassId === 'all' || s.classId === selectedClassId) {
          items.push({
            ...s,
            className: cls ? cls.name : 'Lớp không xác định',
          });
        }
      }

      setHistoryList(items);
    } catch (err) {
      console.error('Error loading attendance history:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SessionHistoryItem>[] = [
    {
      header: 'Ngày điểm danh',
      cell: (row) => (
        <span className="font-bold text-app-main flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-app-primary shrink-0" />
          {formatDateVietnamese(row.sessionDate)}
        </span>
      ),
    },
    {
      header: 'Lớp học',
      cell: (row) => <Badge variant="primary">Lớp {row.className}</Badge>,
    },
    {
      header: 'Có mặt',
      cell: (row) => <span className="font-bold text-emerald-700">{row.totalPresent}</span>,
    },
    {
      header: 'Vắng có phép',
      cell: (row) => <span className="font-bold text-amber-700">{row.totalExcused}</span>,
    },
    {
      header: 'Vắng không phép',
      cell: (row) => <span className="font-bold text-red-700">{row.totalUnexcused}</span>,
    },
    {
      header: 'Đi muộn',
      cell: (row) => <span className="font-bold text-orange-700">{row.totalLate}</span>,
    },
    {
      header: 'Trạng thái',
      cell: (row) => (
        <Badge variant={row.isLocked ? 'success' : 'neutral'}>
          {row.isLocked ? (
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Khóa phiên</span>
          ) : (
            'Bản nháp'
          )}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      cell: () => (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => navigate('/attendance')}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Lịch sử Phiên Điểm danh"
        description="Tra cứu tổng hợp danh sách các phiên điểm danh theo Lớp và Ngày"
        badgeText={`${historyList.length} phiên`}
      />

      <Card title="Lịch sử Điểm danh" action={<History className="w-5 h-5 text-app-primary" />}>
        <div className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="Lọc theo Lớp học"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả các lớp' },
                ...classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
              ]}
            />
          </div>

          {loading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : (
            <Table
              columns={columns}
              data={historyList}
              keyExtractor={(row) => row.id}
              emptyTitle="Chưa có lịch sử điểm danh"
              emptyDescription="Hãy tạo phiên điểm danh đầu tiên tại trang Điểm danh."
            />
          )}
        </div>
      </Card>
    </div>
  );
};

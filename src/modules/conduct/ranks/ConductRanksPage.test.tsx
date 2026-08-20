import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankOverviewTab } from './RankOverviewTab';
import { RankStudentsTab } from './RankStudentsTab';
import { RankHistoryTab } from './RankHistoryTab';
import { DEFAULT_17_RANK_DEFINITIONS } from '../../../core/services/rank-seed.service';
import type { RankLevel } from '../../../core/database/types';
import type { StudentWithRankItem } from './RankOverviewTab';

const mockRankLevels: RankLevel[] = DEFAULT_17_RANK_DEFINITIONS.map((def) => ({
  id: `lvl-${def.level}`,
  rankSystemId: 'sys-1',
  level: def.level,
  code: def.code,
  name: def.name,
  group: def.group,
  minPoints: def.minPoints,
  colorToken: def.colorToken,
  badgeKey: def.badgeKey,
  description: def.description,
  createdAt: '2026-08-14T00:00:00Z',
  updatedAt: '2026-08-14T00:00:00Z',
  deletedAt: null,
}));

const mockStudentsWithRank: StudentWithRankItem[] = [
  {
    student: {
      id: 'st-1',
      studentCode: 'HS1001',
      fullName: 'Nguyễn Văn An',
      normalizedName: 'nguyen van an',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z',
      deletedAt: null,
    },
    className: 'Lớp 10A1',
    rankInfo: {
      studentId: 'st-1',
      totalPoints: 120,
      effectivePoints: 120,
      currentRank: mockRankLevels[2]!, // Hạ sĩ (Cấp 3)
      nextRank: mockRankLevels[3]!, // Trung sĩ (Cấp 4, 150đ)
      currentLevel: 3,
      nextThreshold: 150,
      pointsToNextRank: 30,
      progressPercent: 40,
      isHighestRank: false,
      highestAchievedRank: mockRankLevels[2]!,
    },
    lastPromotedAt: '2026-08-10T10:00:00Z',
  },
  {
    student: {
      id: 'st-2',
      studentCode: 'HS1002',
      fullName: 'Trần Thị Bích',
      normalizedName: 'tran thi bich',
      gender: 'Nữ',
      dateOfBirth: '2008-05-15',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z',
      deletedAt: null,
    },
    className: 'Lớp 10A1',
    rankInfo: {
      studentId: 'st-2',
      totalPoints: 290,
      effectivePoints: 290,
      currentRank: mockRankLevels[5]!, // Thiếu úy (Cấp 6, 250đ)
      nextRank: mockRankLevels[6]!, // Trung úy (Cấp 7, 300đ)
      currentLevel: 6,
      nextThreshold: 300,
      pointsToNextRank: 10,
      progressPercent: 80, // Near promotion (80%)
      isHighestRank: false,
      highestAchievedRank: mockRankLevels[5]!,
    },
    lastPromotedAt: '2026-08-12T14:30:00Z',
  },
];

describe('Conduct Ranks Tab Components Tests', () => {
  it('1. RankOverviewTab renders 4 group cards and accurate stats', () => {
    const handleNavigate = vi.fn();
    render(
      <RankOverviewTab
        studentsWithRank={mockStudentsWithRank}
        rankLevels={mockRankLevels}
        recentPromotions={[
          {
            id: 'h-1',
            rankSystemId: 'sys-1',
            classId: 'c-1',
            studentId: 'st-2',
            studentName: 'Trần Thị Bích',
            className: 'Lớp 10A1',
            fromLevel: 5,
            toLevel: 6,
            pointsBefore: 250,
            pointsAfter: 290,
            changeType: 'promotion',
            createdAt: '2026-08-12T14:30:00Z',
          },
        ]}
        onNavigateToStudentsTabWithFilter={handleNavigate}
      />
    );

    expect(screen.getAllByText('Hạ sĩ quan & Binh sĩ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cấp Úy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cấp Tá').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cấp Tướng').length).toBeGreaterThanOrEqual(1);

    // Verify student near promotion list
    expect(screen.getByText('Sắp Thăng Cấp (Cần Bồi Dưỡng)')).toBeInTheDocument();
    expect(screen.getAllByText('Trần Thị Bích').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Còn 10 điểm')).toBeInTheDocument();
  });

  it('2. RankStudentsTab filters students by search query and shows progress', () => {
    render(
      <RankStudentsTab
        studentsWithRank={mockStudentsWithRank}
        rankLevels={mockRankLevels}
        classList={[{ id: 'c-1', academicYearId: 'y-1', name: '10A1', grade: 10, status: 'Active', createdAt: '', updatedAt: '', deletedAt: null }]}
        studentHistoriesMap={new Map()}
      />
    );

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();

    // Search query filter
    const searchInput = screen.getByPlaceholderText('Tìm theo họ tên hoặc mã học sinh...');
    fireEvent.change(searchInput, { target: { value: 'Bích' } });

    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
  });

  it('3. RankHistoryTab displays history records and changeType badges', () => {
    render(
      <RankHistoryTab
        historyList={[
          {
            id: 'h-1',
            rankSystemId: 'sys-1',
            classId: 'c-1',
            studentId: 'st-1',
            studentName: 'Nguyễn Văn An',
            studentCode: 'HS1001',
            className: 'Lớp 10A1',
            fromLevel: 2,
            toLevel: 3,
            pointsBefore: 90,
            pointsAfter: 120,
            changeType: 'promotion',
            reason: 'Tích cực xây dựng bài',
            createdAt: '2026-08-10T10:00:00Z',
          },
        ]}
        rankLevels={mockRankLevels}
        classList={[{ id: 'c-1', academicYearId: 'y-1', name: '10A1', grade: 10, status: 'Active', createdAt: '', updatedAt: '', deletedAt: null }]}
      />
    );

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Thăng cấp')).toBeInTheDocument();
    expect(screen.getByText('Tích cực xây dựng bài')).toBeInTheDocument();
  });
});

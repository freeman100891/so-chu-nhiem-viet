import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopRankPodium } from './components/TopRankPodium';
import { HonorTitleCard } from './components/HonorTitleCard';
import { TieResolutionModal } from './components/TieResolutionModal';
import type { HonorBoardRecipientDetail } from '../../../core/services/honor-board.service';
import type { HonorTitle, Student } from '../../../core/database/types';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';

const mockStudent1: Student = {
  id: 'st-1',
  studentCode: 'HS001',
  fullName: 'Phạm Hồng Anh',
  normalizedName: 'pham hong anh',
  gender: 'Nữ',
  dateOfBirth: '2019-05-10',
  avatar: undefined,
  avatarKey: undefined,
  avatarThemeId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockStudent2: Student = {
  id: 'st-2',
  studentCode: 'HS002',
  fullName: 'Vũ Đức Nam',
  normalizedName: 'vu duc nam',
  gender: 'Nam',
  dateOfBirth: '2019-07-20',
  avatar: undefined,
  avatarKey: undefined,
  avatarThemeId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockCustomSettings: GlobalAvatarSystemSettings = {
  scope: 'GLOBAL',
  enabled: true,
  presetThemeId: 'royal',
  levels: [
    { level: 1, minPoints: 0, name: 'Thường dân', shortLabel: 'Cấp 1', description: 'Cấp 1', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-1' }, cardBaseColor: '#3b82f6' },
    { level: 2, minPoints: 100, name: 'Hiệp sĩ', shortLabel: 'Cấp 2', description: 'Cấp 2', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-2' }, cardBaseColor: '#10b981' },
    { level: 3, minPoints: 300, name: 'Tử tước', shortLabel: 'Cấp 3', description: 'Cấp 3', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-3' }, cardBaseColor: '#8b5cf6' },
    { level: 4, minPoints: 600, name: 'Quý tộc', shortLabel: 'Cấp 4', description: 'Cấp 4', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-4' }, cardBaseColor: '#f59e0b' },
    { level: 5, minPoints: 1000, name: 'Vương quyền', shortLabel: 'Cấp 5', description: 'Cấp 5', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-5' }, cardBaseColor: '#ef4444' },
  ],
  progressionPolicy: 'HIGHEST_UNLOCKED',
  revision: 1,
  updatedAt: new Date().toISOString(),
};

const mockTitle: HonorTitle = {
  id: 'title-1',
  code: 'top_rank',
  name: 'Dẫn đầu cấp bậc',
  description: 'Dành cho học sinh có cấp bậc cao nhất',
  calculationType: 'top_rank',
  iconKey: 'trophy',
  badgeKey: 'shield',
  colorToken: '#f59e0b',
  maxRecipients: 3,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockRecipients: HonorBoardRecipientDetail[] = [
  {
    id: 'rec-1',
    boardId: 'board-1',
    titleId: 'title-1',
    studentId: 'st-1',
    student: mockStudent1,
    position: 1,
    selectionType: 'automatic',
    metricValue: 350,
    reason: 'Đạt điểm thi đua cao nhất',
    rankLevelAtAward: 3,
    rankNameAtAward: 'Cấp 3 - Tử tước',
    pointsAtAward: 350,
    titleNameAtAward: 'Dẫn đầu cấp bậc',
    badgeKeyAtAward: 'shield',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-2',
    boardId: 'board-1',
    titleId: 'title-1',
    studentId: 'st-2',
    student: mockStudent2,
    position: 2,
    selectionType: 'automatic',
    metricValue: 120,
    reason: 'Hạng nhì thi đua',
    rankLevelAtAward: 2,
    rankNameAtAward: 'Cấp 2 - Hiệp sĩ',
    pointsAtAward: 120,
    titleNameAtAward: 'Dẫn đầu cấp bậc',
    badgeKeyAtAward: 'shield',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Honor Board Avatar Synchronization Tests', () => {
  it('1. TopRankPodium renders synchronized StudentAvatars with score and custom theme', () => {
    render(
      <MemoryRouter>
        <TopRankPodium
          podiumRecipients={mockRecipients}
          showPointValues={true}
          globalActiveThemeId={mockCustomSettings.presetThemeId}
          globalSettings={mockCustomSettings}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Phạm Hồng Anh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vũ Đức Nam').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cấp 3 - Tử tước').length).toBeGreaterThan(0);

    const avatarImages = screen.getAllByRole('img');
    expect(avatarImages.length).toBeGreaterThan(0);
  });

  it('2. HonorTitleCard renders StudentAvatar with synchronized avatar settings', () => {
    render(
      <MemoryRouter>
        <HonorTitleCard
          title={mockTitle}
          recipients={mockRecipients}
          showPointValues={true}
          globalActiveThemeId={mockCustomSettings.presetThemeId}
          globalSettings={mockCustomSettings}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Dẫn đầu cấp bậc')).toBeDefined();
    expect(screen.getByText('Phạm Hồng Anh')).toBeDefined();
    expect(screen.getByText('Vũ Đức Nam')).toBeDefined();

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(2);
  });

  it('3. TieResolutionModal renders StudentAvatar in the tied candidates roster', () => {
    const mockTiedCandidates = [
      {
        student: mockStudent1,
        metricValue: 100,
        metricLabel: '100 điểm',
        rankLevel: 2,
        rankName: 'Cấp 2 - Hiệp sĩ',
        points: 100,
        badgeKey: 'shield',
        reason: 'Đồng 100 điểm',
      },
      {
        student: mockStudent2,
        metricValue: 100,
        metricLabel: '100 điểm',
        rankLevel: 2,
        rankName: 'Cấp 2 - Hiệp sĩ',
        points: 100,
        badgeKey: 'shield',
        reason: 'Đồng 100 điểm',
      },
    ];

    render(
      <TieResolutionModal
        isOpen={true}
        onClose={() => {}}
        title={mockTitle}
        tiedCandidates={mockTiedCandidates}
        onResolve={() => {}}
        globalActiveThemeId={mockCustomSettings.presetThemeId}
        globalSettings={mockCustomSettings}
      />
    );

    expect(screen.getByText('Xử Lý Trường Hợp Đồng Hạng Minh Bạch')).toBeDefined();
    expect(screen.getByText('Phạm Hồng Anh')).toBeDefined();
    expect(screen.getByText('Vũ Đức Nam')).toBeDefined();

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(2);
  });
});

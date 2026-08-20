import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopRankPodium } from './components/TopRankPodium';
import { HonorTitleCard } from './components/HonorTitleCard';
import { TieResolutionModal } from './components/TieResolutionModal';
import { avatarThemeRegistry } from '../../../core/services/avatar-theme-registry';
import type { HonorBoardRecipientDetail } from '../../../core/services/honor-board.service';
import type { HonorTitle, Student } from '../../../core/database/types';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';

// Mock students with legacy avatar keys (Dinosaur, Cat, Dog - matching user's scenario)
const mockStudent1: Student = {
  id: 'st-1',
  studentCode: 'HS001',
  fullName: 'Dương Thảo Ly',
  normalizedName: 'duong thao ly',
  gender: 'Nữ',
  dateOfBirth: '2019-05-10',
  avatar: undefined,
  avatarKey: 'cartoons/cartoon-dino', // Khủng long xanh
  avatarThemeId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockStudent2: Student = {
  id: 'st-2',
  studentCode: 'HS002',
  fullName: 'Lê Thùy Dung',
  normalizedName: 'le thuy dung',
  gender: 'Nữ',
  dateOfBirth: '2019-07-20',
  avatar: undefined,
  avatarKey: 'animals/animal-cat', // Mèo con tinh nghịch
  avatarThemeId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockStudent3: Student = {
  id: 'st-3',
  studentCode: 'HS003',
  fullName: 'Phạm Minh Cường',
  normalizedName: 'pham minh cuong',
  gender: 'Nam',
  dateOfBirth: '2019-03-15',
  avatar: undefined,
  avatarKey: 'animals/animal-dog', // Cún cưng
  avatarThemeId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockCustomSettings: GlobalAvatarSystemSettings = {
  scope: 'GLOBAL',
  enabled: true,
  presetThemeId: 'royal_journey',
  levels: [
    { level: 1, minPoints: 0, name: 'Thường dân', shortLabel: 'Cấp 1', description: 'Cấp 1', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-1' }, cardBaseColor: '#3b82f6' },
    { level: 2, minPoints: 100, name: 'Hiệp sĩ', shortLabel: 'Cấp 2', description: 'Cấp 2', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-2' }, cardBaseColor: '#10b981' },
    { level: 3, minPoints: 300, name: 'Tử tước', shortLabel: 'Cấp 3', description: 'Cấp 3', image: { kind: 'BUILT_IN', assetKey: 'royal/royal-stage-4' }, cardBaseColor: '#8b5cf6' },
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
    metricValue: 500,
    reason: 'Đạt điểm thi đua cao nhất',
    rankLevelAtAward: 11, // Trung tá (Cấp 4 trong 5 cấp)
    rankNameAtAward: 'Trung tá',
    pointsAtAward: 500,
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
    metricValue: 400,
    reason: 'Hạng nhì thi đua',
    rankLevelAtAward: 9, // Đại úy (Cấp 3 trong 5 cấp)
    rankNameAtAward: 'Đại úy',
    pointsAtAward: 400,
    titleNameAtAward: 'Dẫn đầu cấp bậc',
    badgeKeyAtAward: 'shield',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-3',
    boardId: 'board-1',
    titleId: 'title-1',
    studentId: 'st-3',
    student: mockStudent3,
    position: 3,
    selectionType: 'automatic',
    metricValue: 300,
    reason: 'Hạng ba thi đua',
    rankLevelAtAward: 7, // Trung úy (Cấp 2 trong 5 cấp)
    rankNameAtAward: 'Trung úy',
    pointsAtAward: 300,
    titleNameAtAward: 'Dẫn đầu cấp bậc',
    badgeKeyAtAward: 'shield',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Honor Board Avatar Synchronization Tests', () => {
  it('1. TopRankPodium renders synchronized Rank Avatars even if students have legacy avatarKey (dinosaur, cat, dog)', () => {
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

    expect(screen.getAllByText('Dương Thảo Ly').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lê Thùy Dung').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Phạm Minh Cường').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trung tá').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đại úy').length).toBeGreaterThan(0);

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
    expect(screen.getByText('Dương Thảo Ly')).toBeDefined();
    expect(screen.getByText('Lê Thùy Dung')).toBeDefined();

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(3);
  });

  it('3. TieResolutionModal renders StudentAvatar in the tied candidates roster', () => {
    const mockTiedCandidates = [
      {
        student: mockStudent1,
        metricValue: 100,
        metricLabel: '100 điểm',
        rankLevel: 9,
        rankName: 'Đại úy',
        points: 400,
        badgeKey: 'shield',
        reason: 'Đồng 100 điểm',
      },
      {
        student: mockStudent2,
        metricValue: 100,
        metricLabel: '100 điểm',
        rankLevel: 9,
        rankName: 'Đại úy',
        points: 400,
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
    expect(screen.getByText('Dương Thảo Ly')).toBeDefined();
    expect(screen.getByText('Lê Thùy Dung')).toBeDefined();

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(2);
  });

  it('4. resolveStudentAvatarViewModel prioritizes rank theme avatar when preferRankAvatar is true', () => {
    const result = avatarThemeRegistry.resolveStudentAvatarViewModel({
      avatarKey: 'cartoons/cartoon-dino', // student has dinosaur
      rankLevelOrOrder: 11, // Trung tá
      preferRankAvatar: true,
      globalSettings: mockCustomSettings,
    });

    expect(result.themeId).toBe('royal_journey');
    expect(result.level).toBe(4); // Trung tá (Rank 11) maps to Level 4
    expect(result.assetKey).toBe('royal/royal-stage-4');
  });

  it('5. resolveGlobalSettings normalizes UserSettings with activeAvatarThemeId fallback', () => {
    const normalized = avatarThemeRegistry.resolveGlobalSettings({
      id: 'default',
      theme: 'traditional',
      activeAcademicYearId: null,
      activeClassId: null,
      sidebarCollapsed: false,
      activeAvatarThemeId: 'plant_growth',
      createdAt: '',
      updatedAt: '',
    });

    expect(normalized.presetThemeId).toBe('plant_growth');
    expect(normalized.levels.length).toBe(5);
    expect(normalized.levels[0]?.image.kind === 'BUILT_IN' ? normalized.levels[0].image.assetKey : '').toBe('plant/plant-stage-1');
  });

  it('6. TopRankPodium renders 3D stage elements, sound toggle, presentation button, and winner banner', () => {
    const onOpenPresentationMock = vi.fn();

    render(
      <MemoryRouter>
        <TopRankPodium
          podiumRecipients={mockRecipients}
          showPointValues={true}
          globalActiveThemeId={mockCustomSettings.presetThemeId}
          globalSettings={mockCustomSettings}
          onOpenPresentation={onOpenPresentationMock}
          periodContextTitle="Tuần 3 - Tháng 8"
        />
      </MemoryRouter>
    );

    // Header & context
    expect(screen.getByText('Bục Vinh Danh Cấp Bậc')).toBeInTheDocument();
    expect(screen.getByText('Tuần 3 - Tháng 8')).toBeInTheDocument();

    // Sound toggle & Presentation CTA
    expect(screen.getByText('Âm thanh: Bật')).toBeInTheDocument();
    expect(screen.getByText('Trình Chiếu Sân Khấu')).toBeInTheDocument();

    // Winner banner
    expect(screen.getByText(/Xin chúc mừng/)).toBeInTheDocument();
  });

  it('7. TopRankPodium renders clean empty state when no recipients exist', () => {
    render(
      <MemoryRouter>
        <TopRankPodium
          podiumRecipients={[]}
          showPointValues={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Chưa Có Dữ Liệu Bục Vinh Danh Top 3')).toBeInTheDocument();
  });
});



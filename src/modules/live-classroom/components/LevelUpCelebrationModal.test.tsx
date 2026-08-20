import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpCelebrationModal } from './LevelUpCelebrationModal';
import type { DirectLevelChangeNotification } from '../../../core/types/avatar-theme.types';

describe('LevelUpCelebrationModal Component Tests (FEAT-AVATAR-006)', () => {
  const dummyNotification: DirectLevelChangeNotification = {
    notificationId: 'notif-101',
    mutationId: 'mut-101',
    studentId: 'st-01',
    studentDisplayName: 'Đặng Ngọc Mai',
    studentCode: 'HS2002',
    classId: 'class-1',
    direction: 'UP',
    previousScore: 90,
    currentScore: 110,
    fromLevelId: 1,
    toLevelId: 2,
    previousLevel: {
      levelId: 1,
      levelName: 'Khởi đầu',
      levelShortLabel: 'Cấp 1',
      cardBaseColor: '#64748b',
      cardTheme: {} as any,
    },
    currentLevel: {
      levelId: 2,
      levelName: 'Tiến bộ',
      levelShortLabel: 'Cấp 2',
      cardBaseColor: '#3b82f6',
      cardTheme: {} as any,
    },
    levelsChanged: 1,
    settingsRevision: 1,
    createdAt: '2026-08-18T12:00:00.000Z',
    preferredTarget: 'PRESENTATION',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Should render single level-up modal with standard Vietnamese copy and tokens', () => {
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[dummyNotification]}
        enableSound={false}
      />
    );

    expect(screen.getByText('Đặng Ngọc Mai')).toBeDefined();
    expect(screen.getByText('Chúc mừng!')).toBeDefined();
    expect(screen.getByText('đã đạt cấp mới')).toBeDefined();
    expect(screen.getAllByText(/Tiến bộ/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Cấp 1 (Khởi đầu)')).toBeDefined();
    expect(screen.getByText('Cấp 2 (Tiến bộ)')).toBeDefined();
    expect(screen.getByText('+20 điểm · Tổng 110 điểm')).toBeDefined();
  });

  it('2. Should render null when isOpen is false or notifications is empty', () => {
    const { container: c1 } = render(
      <LevelUpCelebrationModal
        isOpen={false}
        onClose={vi.fn()}
        notifications={[dummyNotification]}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[]}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('3. Should render multi-level jump copy "đã thăng 2 cấp" correctly', () => {
    const multiJumpNotification: DirectLevelChangeNotification = {
      ...dummyNotification,
      fromLevelId: 1,
      toLevelId: 3,
      levelsChanged: 2,
      currentLevel: {
        levelId: 3,
        levelName: 'Bứt phá',
        levelShortLabel: 'Cấp 3',
        cardBaseColor: '#10b981',
        cardTheme: {} as any,
      },
    };

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[multiJumpNotification]}
        enableSound={false}
      />
    );

    expect(screen.getByText('đã thăng 2 cấp')).toBeDefined();
    expect(screen.getAllByText(/Bứt phá/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Cấp 1 (Khởi đầu)')).toBeDefined();
    expect(screen.getByText('Cấp 3 (Bứt phá)')).toBeDefined();
  });

  it('4. Should render max level copy "đã chinh phục cấp cao nhất" for Level 5', () => {
    const maxLevelNotification: DirectLevelChangeNotification = {
      ...dummyNotification,
      fromLevelId: 4,
      toLevelId: 5,
      levelsChanged: 1,
      currentLevel: {
        levelId: 5,
        levelName: 'Huyền thoại',
        levelShortLabel: 'Cấp 5',
        cardBaseColor: '#8b5cf6',
        cardTheme: {} as any,
      },
    };

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[maxLevelNotification]}
        enableSound={false}
      />
    );

    expect(screen.getByText('đã chinh phục cấp cao nhất')).toBeDefined();
    expect(screen.getAllByText(/Huyền thoại/i).length).toBeGreaterThan(0);
  });

  it('5. Should render neutral copy for level down (no celebration words)', () => {
    const levelDownNotification: DirectLevelChangeNotification = {
      ...dummyNotification,
      direction: 'DOWN',
      fromLevelId: 4,
      toLevelId: 2,
      levelsChanged: 2,
    };

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[levelDownNotification]}
        enableSound={false}
      />
    );

    expect(screen.queryByText('Chúc mừng!')).toBeNull();
    expect(screen.getByText('Cấp bậc đã được cập nhật')).toBeDefined();
    expect(screen.getByText('Đã hiểu')).toBeDefined();
  });

  it('6. Should close when user clicks Close button or presses Escape', () => {
    const onCloseMock = vi.fn();

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={onCloseMock}
        notifications={[dummyNotification]}
        enableSound={false}
      />
    );

    const closeBtn = screen.getByTitle('Đóng thông báo (Esc)');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it('7. Should render batch grid for multiple students with summary count', () => {
    const notifs = [1, 2, 3, 4, 5].map((i) => ({
      ...dummyNotification,
      notificationId: `notif-${i}`,
      studentId: `st-${i}`,
      studentDisplayName: `Học sinh ${i}`,
    }));

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={notifs}
        enableSound={false}
      />
    );

    expect(screen.getByText('5 học sinh vừa đạt cấp mới')).toBeDefined();
    expect(screen.getByText('Học sinh 1')).toBeDefined();
    expect(screen.getByText('Học sinh 4')).toBeDefined();
    expect(screen.getByText('+1 học sinh khác cũng đã được cập nhật cấp bậc thành công!')).toBeDefined();
  });

  it('8. Should render the destination/new rank avatar (currentLevel.avatarSrc) upon opening', () => {
    const notifWithAvatars: DirectLevelChangeNotification = {
      ...dummyNotification,
      previousLevel: {
        ...dummyNotification.previousLevel,
        avatarAssetUrl: '/images/avatars/level-1.png',
      },
      currentLevel: {
        ...dummyNotification.currentLevel,
        avatarAssetUrl: '/images/avatars/level-2-new-rank.png',
      },
    };

    render(
      <LevelUpCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={[notifWithAvatars]}
        enableSound={false}
      />
    );

    const img = screen.getByAltText('Avatar Tiến bộ') as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain('/images/avatars/level-2-new-rank.png');
  });
});

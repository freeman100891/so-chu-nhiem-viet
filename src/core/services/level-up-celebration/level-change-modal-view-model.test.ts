import { describe, it, expect } from 'vitest';
import {
  buildLevelChangeModalViewModel,
  buildBatchLevelChangeModalViewModel,
  getStudentInitials,
} from './level-change-modal-view-model';
import type { DirectLevelChangeNotification } from '../../types/avatar-theme.types';

describe('LevelChangeModalViewModel Mapper Tests (FEAT-AVATAR-006)', () => {
  const createNotification = (
    overrides: Partial<DirectLevelChangeNotification> = {}
  ): DirectLevelChangeNotification => ({
    notificationId: 'notif-test-1',
    mutationId: 'mut-101',
    studentId: 'st-01',
    studentDisplayName: 'Nguyễn Văn An',
    studentCode: 'HS001',
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
      cardTheme: {
        key: 'theme-1',
        baseColor: '#64748b',
        surfaceStart: '#ffffff',
        surfaceEnd: '#f8fafc',
        border: '#64748b',
        accent: '#64748b',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        badgeBackground: '#64748b',
        badgeText: '#ffffff',
        badgeBorder: '#64748b',
        avatarRing: '#64748b',
        focusRing: '#64748b',
        shadow: 'none',
        isDark: false,
        contrastRatio: 4.5,
        contrastPassed: true,
      },
    },
    currentLevel: {
      levelId: 2,
      levelName: 'Tiến bộ',
      levelShortLabel: 'Cấp 2',
      cardBaseColor: '#3b82f6',
      cardTheme: {
        key: 'theme-2',
        baseColor: '#3b82f6',
        surfaceStart: '#ffffff',
        surfaceEnd: '#eff6ff',
        border: '#3b82f6',
        accent: '#3b82f6',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        badgeBackground: '#3b82f6',
        badgeText: '#ffffff',
        badgeBorder: '#3b82f6',
        avatarRing: '#3b82f6',
        focusRing: '#3b82f6',
        shadow: 'none',
        isDark: false,
        contrastRatio: 4.5,
        contrastPassed: true,
      },
    },
    levelsChanged: 1,
    settingsRevision: 1,
    createdAt: '2026-08-18T12:00:00.000Z',
    preferredTarget: 'PRESENTATION',
    ...overrides,
  });

  describe('1. Single Level Up Variant', () => {
    it('should map Level 1 -> 2 with standard single level-up copy', () => {
      const notif = createNotification({ fromLevelId: 1, toLevelId: 2, levelsChanged: 1 });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.variant).toBe('LEVEL_UP');
      expect(vm.content.eyebrow).toBe('Chúc mừng!');
      expect(vm.content.headline).toBe('đã đạt cấp mới');
      expect(vm.content.levelBadgeLabel).toBe('Cấp 2');
      expect(vm.content.transitionLabel).toBe('Cấp 1 → Cấp 2');
      expect(vm.content.ariaAnnouncement).toBe('Chúc mừng Nguyễn Văn An đã đạt Cấp 2, Tiến bộ.');
      expect(vm.student.displayName).toBe('Nguyễn Văn An');
      expect(vm.student.initials).toBe('NA');
    });

    it('should format score delta and total when enabled', () => {
      const notif = createNotification({ previousScore: 80, currentScore: 120 });
      const vm = buildLevelChangeModalViewModel(notif, { showDelta: true, showCurrent: true });

      expect(vm.score?.formattedSummary).toBe('+40 điểm · Tổng 120 điểm');
    });
  });

  describe('2. Multi-Level Jump Variant', () => {
    it('should map Level 1 -> 3 as MULTI_LEVEL_UP with "đã thăng 2 cấp"', () => {
      const notif = createNotification({
        fromLevelId: 1,
        toLevelId: 3,
        currentLevel: {
          levelId: 3,
          levelName: 'Bứt phá',
          levelShortLabel: 'Cấp 3',
          cardBaseColor: '#10b981',
          cardTheme: {} as any,
        },
      });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.variant).toBe('MULTI_LEVEL_UP');
      expect(vm.content.headline).toBe('đã thăng 2 cấp');
      expect(vm.content.transitionLabel).toBe('Cấp 1 → Cấp 3');
      expect(vm.content.ariaAnnouncement).toBe('Chúc mừng Nguyễn Văn An đã thăng 2 cấp và đạt Cấp 3, Bứt phá.');
    });
  });

  describe('3. Max Level Variant', () => {
    it('should map Level 4 -> 5 as MAX_LEVEL with "đã chinh phục cấp cao nhất"', () => {
      const notif = createNotification({
        fromLevelId: 4,
        toLevelId: 5,
        currentLevel: {
          levelId: 5,
          levelName: 'Huyền thoại',
          levelShortLabel: 'Cấp 5',
          cardBaseColor: '#8b5cf6',
          cardTheme: {} as any,
        },
      });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.variant).toBe('MAX_LEVEL');
      expect(vm.content.headline).toBe('đã chinh phục cấp cao nhất');
      expect(vm.content.levelBadgeLabel).toBe('Cấp 5');
      expect(vm.content.ariaAnnouncement).toBe('Chúc mừng Nguyễn Văn An đã chinh phục cấp cao nhất, Cấp 5, Huyền thoại.');
    });

    it('should add supporting text when jumping multi-levels to Max Level (e.g. 1 -> 5)', () => {
      const notif = createNotification({
        fromLevelId: 1,
        toLevelId: 5,
        currentLevel: {
          levelId: 5,
          levelName: 'Huyền thoại',
          levelShortLabel: 'Cấp 5',
          cardBaseColor: '#8b5cf6',
          cardTheme: {} as any,
        },
      });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.variant).toBe('MAX_LEVEL');
      expect(vm.content.headline).toBe('đã chinh phục cấp cao nhất');
      expect(vm.content.supportingText).toBe('Đã thăng 4 cấp');
    });
  });

  describe('4. Level Down Variant (Neutral)', () => {
    it('should map Level 4 -> 2 as LEVEL_DOWN without celebration copy or score', () => {
      const notif = createNotification({
        direction: 'DOWN',
        fromLevelId: 4,
        toLevelId: 2,
        previousScore: 400,
        currentScore: 190,
      });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.variant).toBe('LEVEL_DOWN');
      expect(vm.content.eyebrow).toBe('');
      expect(vm.content.headline).toBe('Cấp bậc đã được cập nhật');
      expect(vm.content.transitionLabel).toBe('Cấp 4 → Cấp 2');
      expect(vm.score).toBeUndefined(); // Score omitted for demotion/privacy
      expect(vm.content.ariaAnnouncement).toBe('Cấp bậc của Nguyễn Văn An đã được cập nhật thành Cấp 2, Tiến bộ.');
    });
  });

  describe('5. Fallback & Privacy Rules', () => {
    it('should fallback gracefully when student name is empty', () => {
      const notif = createNotification({ studentDisplayName: '' });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.student.displayName).toBe('Học sinh');
      expect(vm.student.initials).toBe('HS');
    });

    it('should completely omit score summary when privacyMode is enabled', () => {
      const notif = createNotification();
      const vm = buildLevelChangeModalViewModel(notif, { privacyMode: true });

      expect(vm.score).toBeUndefined();
      expect(vm.content.scoreSummary).toBeUndefined();
    });

    it('should clamp invalid level numbers into 1-5 range', () => {
      const notif = createNotification({ fromLevelId: 0 as any, toLevelId: 99 as any });
      const vm = buildLevelChangeModalViewModel(notif);

      expect(vm.previousLevel.id).toBe(1);
      expect(vm.currentLevel.id).toBe(5);
    });
  });

  describe('6. Student Initials Helper', () => {
    it('should extract correct initials for single and compound names', () => {
      expect(getStudentInitials('Nguyễn Văn An')).toBe('NA');
      expect(getStudentInitials('Mai')).toBe('MA');
      expect(getStudentInitials('Lê Hoàng Nam Phong')).toBe('LP');
      expect(getStudentInitials('')).toBe('HS');
      expect(getStudentInitials(null)).toBe('HS');
    });
  });

  describe('7. Batch Modal Mapper', () => {
    it('should aggregate multiple notifications into batch view model', () => {
      const notif1 = createNotification({ studentDisplayName: 'Học sinh 1', toLevelId: 2 });
      const notif2 = createNotification({ studentDisplayName: 'Học sinh 2', toLevelId: 3 });
      const batchVM = buildBatchLevelChangeModalViewModel([notif1, notif2]);

      expect(batchVM.header.count).toBe(2);
      expect(batchVM.header.title).toBe('2 học sinh vừa đạt cấp mới');
      expect(batchVM.items.length).toBe(2);
      expect(batchVM.overflowCount).toBe(0);
      expect(batchVM.isAllDown).toBe(false);
    });

    it('should calculate overflow count when > 4 students', () => {
      const notifs = [1, 2, 3, 4, 5, 6].map((i) =>
        createNotification({ studentDisplayName: `Học sinh ${i}` })
      );
      const batchVM = buildBatchLevelChangeModalViewModel(notifs);

      expect(batchVM.header.count).toBe(6);
      expect(batchVM.overflowCount).toBe(2);
    });
  });
});

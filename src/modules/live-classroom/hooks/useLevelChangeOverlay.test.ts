import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLevelChangeOverlay } from './useLevelChangeOverlay';
import type { DirectLevelChangeNotification, AvatarCardTheme } from '../../../core/types/avatar-theme.types';

describe('useLevelChangeOverlay Hook Tests (FEAT-AVATAR-005)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dummyCardTheme: AvatarCardTheme = {
    key: 'theme-1',
    baseColor: '#3b82f6',
    surfaceStart: '#ffffff',
    surfaceEnd: '#ffffff',
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
  };

  const createNotification = (
    studentId: string,
    fromLevel: 1 | 2 | 3 | 4 | 5,
    toLevel: 1 | 2 | 3 | 4 | 5,
    direction: 'UP' | 'DOWN' = toLevel > fromLevel ? 'UP' : 'DOWN'
  ): DirectLevelChangeNotification => ({
    notificationId: `notif-${studentId}-${fromLevel}-${toLevel}`,
    mutationId: `mut-${studentId}`,
    studentId,
    studentDisplayName: `Học sinh ${studentId}`,
    classId: 'class-1',
    direction,
    previousScore: 50,
    currentScore: 120,
    fromLevelId: fromLevel,
    toLevelId: toLevel,
    previousLevel: {
      levelId: fromLevel,
      levelName: `Cấp ${fromLevel}`,
      levelShortLabel: `Cấp ${fromLevel}`,
      cardBaseColor: '#3b82f6',
      cardTheme: dummyCardTheme,
    },
    currentLevel: {
      levelId: toLevel,
      levelName: `Cấp ${toLevel}`,
      levelShortLabel: `Cấp ${toLevel}`,
      cardBaseColor: '#10b981',
      cardTheme: dummyCardTheme,
    },
    levelsChanged: Math.abs(toLevel - fromLevel),
    settingsRevision: 1,
    createdAt: new Date().toISOString(),
    preferredTarget: direction === 'DOWN' ? 'CONTROLLER' : 'PRESENTATION',
  });

  it('1. Should transition to ENTERING and VISIBLE immediately upon show(<100ms)', () => {
    const { result } = renderHook(() => useLevelChangeOverlay({ defaultDurationMs: 5000 }));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.phase).toBe('IDLE');

    const notif = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif]);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.notifications.length).toBe(1);
    expect(result.current.notifications[0]?.studentId).toBe('st-1');

    // Advance 100ms to enter VISIBLE
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.phase).toBe('VISIBLE');
  });

  it('2. Should automatically dismiss after defaultDurationMs', () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() =>
      useLevelChangeOverlay({ defaultDurationMs: 4000, onDismiss })
    );

    const notif = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif]);
    });

    // Advance past hold time
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.phase).toBe('EXITING');

    // Exit transition completes after 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.phase).toBe('IDLE');
    expect(onDismiss).toHaveBeenCalledWith('AUTO');
  });

  it('3. Should merge new notifications into active modal (Active Merge without queue delay)', () => {
    const { result } = renderHook(() => useLevelChangeOverlay({ defaultDurationMs: 5000 }));

    const notif1 = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif1]);
      vi.advanceTimersByTime(100);
    });

    expect(result.current.notifications.length).toBe(1);

    // Another student mutation arrives while modal is visible
    const notif2 = createNotification('st-2', 2, 3, 'UP');
    act(() => {
      result.current.show([notif2]);
    });

    expect(result.current.notifications.length).toBe(2);
    expect(result.current.notifications.map((n) => n.studentId)).toEqual(['st-1', 'st-2']);
  });

  it('4. Should coalesce multiple level changes for the same student while modal is active', () => {
    const { result } = renderHook(() => useLevelChangeOverlay({ defaultDurationMs: 5000 }));

    const notif1 = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif1]);
      vi.advanceTimersByTime(100);
    });

    // Same student gains more points: 2 -> 3
    const notif2 = createNotification('st-1', 2, 3, 'UP');
    act(() => {
      result.current.show([notif2]);
    });

    expect(result.current.notifications.length).toBe(1);
    const merged = result.current.notifications[0]!;
    expect(merged.fromLevelId).toBe(1);
    expect(merged.toLevelId).toBe(3);
    expect(merged.levelsChanged).toBe(2);
    expect(merged.direction).toBe('UP');
  });

  it('5. Should drop notification if subsequent reversal brings student back to initial level', () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() =>
      useLevelChangeOverlay({ defaultDurationMs: 5000, onDismiss })
    );

    const notif1 = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif1]);
      vi.advanceTimersByTime(100);
    });

    // Reversal brings student back: 2 -> 1
    const notifReversal = createNotification('st-1', 2, 1, 'DOWN');
    act(() => {
      result.current.show([notifReversal]);
    });

    // Since it's back to original level 1, list becomes empty and auto-dismisses
    expect(result.current.notifications.length).toBe(0);
  });

  it('6. Should dismiss immediately when user calls dismiss("USER")', () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() =>
      useLevelChangeOverlay({ defaultDurationMs: 5000, onDismiss })
    );

    const notif = createNotification('st-1', 1, 2, 'UP');
    act(() => {
      result.current.show([notif]);
      vi.advanceTimersByTime(100);
    });

    expect(result.current.phase).toBe('VISIBLE');

    act(() => {
      result.current.dismiss('USER');
    });

    expect(result.current.phase).toBe('EXITING');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isOpen).toBe(false);
    expect(onDismiss).toHaveBeenCalledWith('USER');
  });
});

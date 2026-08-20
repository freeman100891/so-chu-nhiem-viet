import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLevelUpCelebrationQueue } from './useLevelUpCelebrationQueue';
import { db } from '../../../core/database/db';
import type { Student } from '../../../core/database/types';

describe('useLevelUpCelebrationQueue Tests', () => {
  const dummyStudent: Student = {
    id: 'st-queue-1',
    studentCode: 'HS101',
    fullName: 'Trần Minh Tuấn',
    normalizedName: 'tran minh tuan',
    gender: 'Nam',
    dateOfBirth: '2012-01-01',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
    deletedAt: null,
  };

  beforeEach(async () => {
    await db.levelUpCelebrationEvents.clear();
    await db.students.clear();
    await db.settings.clear();
    await db.students.put(dummyStudent);
  });

  it('1. Should reactive live query pending events without reloading', async () => {
    const { result } = renderHook(() =>
      useLevelUpCelebrationQueue({ sessionId: 'session-q1', classId: 'class-q1' })
    );

    expect(result.current.pendingEvents).toEqual([]);

    await act(async () => {
      await db.levelUpCelebrationEvents.add({
        id: 'evt-q1',
        dedupeKey: 'tx-q1_st-queue-1_2',
        studentId: dummyStudent.id,
        classId: 'class-q1',
        liveSessionId: 'session-q1',
        sourcePointTransactionId: 'tx-q1',
        previousScore: 80,
        currentScore: 120,
        fromLevelId: 1,
        toLevelId: 2,
        levelsGained: 1,
        fromLevel: { levelId: 1, levelName: 'Khởi đầu', levelShortLabel: 'Cấp 1', cardBaseColor: '#64748b' },
        toLevel: { levelId: 2, levelName: 'Tiến bộ', levelShortLabel: 'Cấp 2', cardBaseColor: '#3b82f6' },
        settingsRevision: 1,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await result.current.refreshQueue();
    });

    expect(result.current.pendingEvents.length).toBe(1);
    expect(result.current.currentEvent?.toLevelId).toBe(2);
  });

  it('2. Should allow teacher to manual show and skip event', async () => {
    await act(async () => {
      await db.levelUpCelebrationEvents.add({
        id: 'evt-q2',
        dedupeKey: 'tx-q2_st-queue-1_2',
        studentId: dummyStudent.id,
        classId: 'class-q1',
        liveSessionId: 'session-q1',
        sourcePointTransactionId: 'tx-q2',
        previousScore: 80,
        currentScore: 120,
        fromLevelId: 1,
        toLevelId: 2,
        levelsGained: 1,
        fromLevel: { levelId: 1, levelName: 'Khởi đầu', levelShortLabel: 'Cấp 1', cardBaseColor: '#64748b' },
        toLevel: { levelId: 2, levelName: 'Tiến bộ', levelShortLabel: 'Cấp 2', cardBaseColor: '#3b82f6' },
        settingsRevision: 1,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const { result } = renderHook(() =>
      useLevelUpCelebrationQueue({ sessionId: 'session-q1', classId: 'class-q1' })
    );

    await act(async () => {
      await result.current.refreshQueue();
    });

    expect(result.current.pendingEvents.length).toBe(1);

    // Skip event
    await act(async () => {
      await result.current.skipEvent(result.current.pendingEvents[0]!, 'Test skip');
    });

    expect(result.current.pendingEvents.length).toBe(0);
  });

  it('3. Should update settings correctly', async () => {
    const { result } = renderHook(() =>
      useLevelUpCelebrationQueue({ sessionId: 'session-q1', classId: 'class-q1' })
    );

    await act(async () => {
      await result.current.updateSettings({ mode: 'MANUAL', durationMs: 4000 });
    });

    expect(result.current.settings.mode).toBe('MANUAL');
    expect(result.current.settings.durationMs).toBe(4000);
  });
});

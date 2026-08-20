import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePromotionQueue } from './usePromotionQueue';
import { db } from '../../../core/database/db';
import { liveBroadcastService } from '../../../core/services/live-classroom/live-broadcast';
import type { RankSystem, RankPromotionEvent, Student } from '../../../core/database/types';

describe('usePromotionQueue Reactive Hook Tests (BUG-RANK-001 Fix)', () => {
  const classId = 'class-promo-1';
  const sessionId = 'session-promo-1';
  const rankSystemId = 'sys-promo-1';

  beforeEach(async () => {
    await db.rankSystems.clear();
    await db.rankSystemClasses.clear();
    await db.rankPromotionEvents.clear();
    await db.students.clear();
    await db.auditLogs.clear();

    const system: RankSystem = {
      id: rankSystemId,
      name: 'Hệ thống Quân hàm',
      academicYearId: 'year-1',
      calculationScope: 'all_time',
      rankMode: 'achievement',
      celebrationEnabled: true,
      presentationCelebrationEnabled: true,
      promotionCelebrationMode: 'MANUAL',
      promotionSoundEnabled: false,
      promotionShowPreviousRank: true,
      promotionConfettiEnabled: true,
      promotionDurationMs: 4500,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.rankSystems.add(system);
    await db.rankSystemClasses.add({
      id: 'rsc-1',
      rankSystemId,
      classId,
      createdAt: new Date().toISOString(),
    });

    const student: Student = {
      id: 'st-1',
      fullName: 'Trần Văn Bình',
      normalizedName: 'tran van binh',
      studentCode: 'HS002',
      gender: 'Nam',
      dateOfBirth: '2015-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.students.add(student);
  });

  it('1. Initial hook mount starts with empty pending events and loads class settings', async () => {
    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.pendingEvents).toEqual([]);
      expect(result.current.settings.mode).toBe('MANUAL');
    });
  });

  it('2. Reflects new promotion event immediately without page reload (Reactive Same-Tab Update)', async () => {
    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    expect(result.current.pendingCount).toBe(0);

    // Simulate database write of a new promotion event
    const newEvent: RankPromotionEvent = {
      id: 'evt-promo-1',
      classId,
      studentId: 'st-1',
      liveSessionId: sessionId,
      sourcePointEntryId: 'pt-entry-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await act(async () => {
      await db.rankPromotionEvents.add(newEvent);
      await result.current.refreshQueue();
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.currentEvent?.id).toBe('evt-promo-1');
      expect(result.current.currentEvent?.toRankName).toBe('Binh nhất');
    });
  });

  it('3. Manual mode: showEvent broadcasts PROMOTION_SHOW and marks event as PRESENTED', async () => {
    const postMessageSpy = vi.spyOn(liveBroadcastService, 'postMessage');

    const newEvent: RankPromotionEvent = {
      id: 'evt-promo-2',
      classId,
      studentId: 'st-1',
      liveSessionId: sessionId,
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.rankPromotionEvents.add(newEvent);

    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });

    await act(async () => {
      await result.current.showEvent(result.current.currentEvent!);
    });

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PROMOTION_SHOW',
        payload: expect.objectContaining({
          eventId: 'evt-promo-2',
          studentName: 'Trần Văn Bình',
          toRankName: 'Binh nhất',
        }),
      })
    );

    const updatedInDb = await db.rankPromotionEvents.get('evt-promo-2');
    expect(updatedInDb?.status).toBe('PRESENTED');
  });

  it('4. skipEvent marks event as SKIPPED and updates pending queue', async () => {
    const newEvent: RankPromotionEvent = {
      id: 'evt-promo-3',
      classId,
      studentId: 'st-1',
      liveSessionId: sessionId,
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.rankPromotionEvents.add(newEvent);

    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });

    await act(async () => {
      await result.current.skipEvent(result.current.currentEvent!);
    });

    const updatedInDb = await db.rankPromotionEvents.get('evt-promo-3');
    expect(updatedInDb?.status).toBe('SKIPPED');

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('5. skipAllEvents skips all pending events for current session', async () => {
    await db.rankPromotionEvents.bulkAdd([
      {
        id: 'evt-multi-1',
        classId,
        studentId: 'st-1',
        liveSessionId: sessionId,
        fromLevel: 1,
        toLevel: 2,
        fromRankName: 'Binh nhì',
        toRankName: 'Binh nhất',
        levelsGained: 1,
        pointsBefore: 30,
        pointsAfter: 30,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'evt-multi-2',
        classId,
        studentId: 'st-1',
        liveSessionId: sessionId,
        fromLevel: 2,
        toLevel: 3,
        fromRankName: 'Binh nhất',
        toRankName: 'Hạ sĩ',
        levelsGained: 1,
        pointsBefore: 60,
        pointsAfter: 60,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(2);
    });

    await act(async () => {
      await result.current.skipAllEvents('Bỏ qua tất cả');
    });

    const inDb = await db.rankPromotionEvents.toArray();
    expect(inDb.every((e) => e.status === 'SKIPPED')).toBe(true);

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('6. updateSettings persists celebration mode to db.rankSystems', async () => {
    const { result } = renderHook(() => usePromotionQueue({ sessionId, classId }));

    await waitFor(() => {
      expect(result.current.settings.mode).toBe('MANUAL');
    });

    await act(async () => {
      await result.current.updateSettings({ mode: 'AUTOMATIC', soundEnabled: true, durationMs: 6000 });
    });

    const sysInDb = await db.rankSystems.get(rankSystemId);
    expect(sysInDb?.promotionCelebrationMode).toBe('AUTOMATIC');
    expect(sysInDb?.promotionSoundEnabled).toBe(true);
    expect(sysInDb?.promotionDurationMs).toBe(6000);
  });
});

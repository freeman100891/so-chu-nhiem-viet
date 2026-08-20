import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rankPromotionRepository } from './rank-promotion.repository';
import type { RankPromotionEvent } from '../database/types';

describe('RankPromotionRepository (FEAT-RANK-001)', () => {
  beforeEach(async () => {
    await db.rankPromotionEvents.clear();
  });

  it('1. Should create a rank promotion event with status PENDING', async () => {
    const event: RankPromotionEvent = {
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      liveSessionId: 'session-1',
      sourcePointEntryId: 'point-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    };

    await rankPromotionRepository.create(event);

    const found = await rankPromotionRepository.findById('event-1');
    expect(found).toBeDefined();
    expect(found?.status).toBe('PENDING');
    expect(found?.toRankName).toBe('Binh nhất');
    expect(found?.levelsGained).toBe(1);
  });

  it('2. Should find pending events by session sorted by createdAt', async () => {
    await rankPromotionRepository.create({
      id: 'event-2',
      classId: 'class-1',
      studentId: 'student-2',
      liveSessionId: 'session-1',
      fromLevel: 2,
      toLevel: 3,
      fromRankName: 'Binh nhất',
      toRankName: 'Hạ sĩ',
      levelsGained: 1,
      pointsBefore: 60,
      pointsAfter: 60,
      status: 'PENDING',
      createdAt: '2026-08-17T08:05:00.000Z',
      updatedAt: '2026-08-17T08:05:00.000Z',
    });

    await rankPromotionRepository.create({
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      liveSessionId: 'session-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    });

    const pending = await rankPromotionRepository.findPendingBySession('session-1');
    expect(pending.length).toBe(2);
    expect(pending[0]!.id).toBe('event-1'); // Earlier created
    expect(pending[1]!.id).toBe('event-2');
  });

  it('3. Should mark event as PRESENTED and update timestamp', async () => {
    await rankPromotionRepository.create({
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      liveSessionId: 'session-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    });

    const updated = await rankPromotionRepository.markPresented('event-1');
    expect(updated?.status).toBe('PRESENTED');
    expect(updated?.presentedAt).toBeDefined();

    const pending = await rankPromotionRepository.findPendingBySession('session-1');
    expect(pending.length).toBe(0);
  });

  it('4. Should mark event as SKIPPED with reason', async () => {
    await rankPromotionRepository.create({
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      liveSessionId: 'session-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    });

    const updated = await rankPromotionRepository.markSkipped('event-1', 'Bỏ qua cuối giờ');
    expect(updated?.status).toBe('SKIPPED');
    expect(updated?.skippedAt).toBeDefined();
    expect(updated?.skipReason).toBe('Bỏ qua cuối giờ');
  });

  it('5. Should skip all pending events in a session', async () => {
    await rankPromotionRepository.create({
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      liveSessionId: 'session-1',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    });
    await rankPromotionRepository.create({
      id: 'event-2',
      classId: 'class-1',
      studentId: 'student-2',
      liveSessionId: 'session-1',
      fromLevel: 2,
      toLevel: 3,
      fromRankName: 'Binh nhất',
      toRankName: 'Hạ sĩ',
      levelsGained: 1,
      pointsBefore: 60,
      pointsAfter: 60,
      status: 'PENDING',
      createdAt: '2026-08-17T08:01:00.000Z',
      updatedAt: '2026-08-17T08:01:00.000Z',
    });

    const skippedCount = await rankPromotionRepository.skipAllPendingInSession('session-1');
    expect(skippedCount).toBe(2);

    const pending = await rankPromotionRepository.findPendingBySession('session-1');
    expect(pending.length).toBe(0);
  });

  it('6. Should find existing event by sourcePointEntryId for idempotency guard', async () => {
    await rankPromotionRepository.create({
      id: 'event-1',
      classId: 'class-1',
      studentId: 'student-1',
      sourcePointEntryId: 'point-123',
      fromLevel: 1,
      toLevel: 2,
      fromRankName: 'Binh nhì',
      toRankName: 'Binh nhất',
      levelsGained: 1,
      pointsBefore: 30,
      pointsAfter: 30,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z',
    });

    const found = await rankPromotionRepository.findBySourcePointEntry('student-1', 'point-123');
    expect(found).toBeDefined();
    expect(found?.id).toBe('event-1');

    const notFound = await rankPromotionRepository.findBySourcePointEntry('student-1', 'point-999');
    expect(notFound).toBeUndefined();
  });
});

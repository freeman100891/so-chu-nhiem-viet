import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../database/db';
import { levelUpCelebrationService } from './level-up-celebration.service';
import type { Student } from '../../database/types';

describe('LevelUpCelebrationService Database & Transaction Tests', () => {
  const dummyStudent: Student = {
    id: 'student-test-1',
    studentCode: 'HS1001',
    fullName: 'Lê Hoàng Nam',
    normalizedName: 'le hoang nam',
    gender: 'Nam',
    dateOfBirth: '2012-04-15',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
    deletedAt: null,
  };

  beforeEach(async () => {
    await db.levelUpCelebrationEvents.clear();
    await db.students.clear();
    await db.settings.clear();
    await db.auditLogs.clear();

    await db.students.put(dummyStudent);
  });

  it('1. Should create LevelUpCelebrationEvent and return direct notification payload', async () => {
    const res = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-101',
      previousScore: 90,
      currentScore: 110,
      reason: 'Phát biểu bài xuất sắc',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe('PRESENTED');
    expect(res?.fromLevelId).toBe(1);
    expect(res?.toLevelId).toBe(2);
    expect(res?.levelsGained).toBe(1);
    expect(res?.dedupeKey).toBe('tx-101_student-test-1_2');
    expect((res as any)?.notification).toBeDefined();
    expect((res as any)?.notification.direction).toBe('UP');
    expect((res as any)?.notification.studentDisplayName).toBe('Lê Hoàng Nam');

    const inDb = await db.levelUpCelebrationEvents.get(res!.id);
    expect(inDb).toBeDefined();
    expect(inDb?.status).toBe('PRESENTED');
  });

  it('2. Should be idempotent and return existing event for identical dedupeKey (prevent duplicate)', async () => {
    const event1 = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-102',
      previousScore: 90,
      currentScore: 110,
    });

    const event2 = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-102',
      previousScore: 90,
      currentScore: 110,
    });

    expect(event1?.id).toBe(event2?.id);
    const count = await db.levelUpCelebrationEvents.count();
    expect(count).toBe(1);
  });

  it('3. Should not create event when celebration mode is OFF', async () => {
    await levelUpCelebrationService.updateSettings({ mode: 'OFF' });

    const event = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-103',
      previousScore: 90,
      currentScore: 110,
    });

    expect(event).toBeNull();
    const count = await db.levelUpCelebrationEvents.count();
    expect(count).toBe(0);
  });

  it('4. Should query events by session and class correctly', async () => {
    await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-104',
      previousScore: 80,
      currentScore: 120,
    });

    const sessionEvents = await levelUpCelebrationService.findBySession('session-1');
    expect(sessionEvents.length).toBe(1);

    const otherSessionEvents = await levelUpCelebrationService.findBySession('session-2');
    expect(otherSessionEvents.length).toBe(0);

    const classEvents = await levelUpCelebrationService.findByClass('class-1');
    expect(classEvents.length).toBe(1);
  });

  it('5. Should handle state transitions: PENDING -> PRESENTING -> PRESENTED', async () => {
    const event = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-105',
      previousScore: 80,
      currentScore: 120,
    });

    const presenting = await levelUpCelebrationService.markPresenting(event!.id, 'cmd-1');
    expect(presenting?.status).toBe('PRESENTING');
    expect(presenting?.presentingAt).toBeDefined();

    const presented = await levelUpCelebrationService.markPresented(event!.id);
    expect(presented?.status).toBe('PRESENTED');
    expect(presented?.presentedAt).toBeDefined();

    const pendingAfter = await levelUpCelebrationService.findPendingBySession('session-1');
    expect(pendingAfter.length).toBe(0);
  });

  it('6. Should mark skipped when teacher skips event or all events', async () => {
    const event = await levelUpCelebrationService.processPointEntryTransition({
      classId: 'class-1',
      studentId: dummyStudent.id,
      liveSessionId: 'session-1',
      sourcePointTransactionId: 'tx-106',
      previousScore: 80,
      currentScore: 120,
    });

    const skipped = await levelUpCelebrationService.markSkipped(event!.id, 'Bỏ qua kiểm thử');
    expect(skipped?.status).toBe('SKIPPED');
    expect(skipped?.skipReason).toBe('Bỏ qua kiểm thử');

    const pendingAfter = await levelUpCelebrationService.findPendingBySession('session-1');
    expect(pendingAfter.length).toBe(0);
  });
});

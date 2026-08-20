import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rewardBalanceService } from './reward-balance.service';
import { generateUUID } from '../../shared/utilities/uuid';

describe('RewardBalanceService Tests', () => {
  beforeEach(async () => {
    await db.pointEntries.clear();
    await db.giftRedemptions.clear();
    await db.classEnrollments.clear();
  });

  it('1. Should calculate 0 balance when student has no points', async () => {
    const studentId = 'st-1';
    const classId = 'cls-1';

    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.achievementScore).toBe(0);
    expect(balance.spentPoints).toBe(0);
    expect(balance.refundedPoints).toBe(0);
    expect(balance.redeemableBalance).toBe(0);
  });

  it('2. Should calculate achievementScore and redeemableBalance from positive pointEntries', async () => {
    const studentId = 'st-1';
    const classId = 'cls-1';
    const now = new Date().toISOString();

    await db.pointEntries.bulkAdd([
      {
        id: generateUUID(),
        classId,
        studentId,
        categoryId: 'cat-1',
        points: 50,
        reason: 'Phát biểu tốt',
        occurredAt: '2026-08-10',
        recordedBy: 'GVCN',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: generateUUID(),
        classId,
        studentId,
        categoryId: 'cat-2',
        points: 30,
        reason: 'Làm bài tập đầy đủ',
        occurredAt: '2026-08-11',
        recordedBy: 'GVCN',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);

    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.achievementScore).toBe(80);
    expect(balance.spentPoints).toBe(0);
    expect(balance.redeemableBalance).toBe(80);
  });

  it('3. Should deduct spentPoints for COMPLETED redemptions and ignore CANCELLED ones', async () => {
    const studentId = 'st-1';
    const classId = 'cls-1';
    const now = new Date().toISOString();

    // 100 positive points
    await db.pointEntries.add({
      id: generateUUID(),
      classId,
      studentId,
      categoryId: 'cat-1',
      points: 100,
      reason: 'Thi đua xuất sắc',
      occurredAt: '2026-08-10',
      recordedBy: 'GVCN',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Completed redemption of 40 points
    await db.giftRedemptions.add({
      id: generateUUID(),
      studentId,
      classId,
      status: 'COMPLETED',
      totalPoints: 40,
      itemCount: 2,
      idempotencyKey: 'key-1',
      redeemedAt: '2026-08-12',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Cancelled redemption of 20 points
    await db.giftRedemptions.add({
      id: generateUUID(),
      studentId,
      classId,
      status: 'CANCELLED',
      totalPoints: 20,
      itemCount: 1,
      idempotencyKey: 'key-2',
      redeemedAt: '2026-08-13',
      cancelledAt: now,
      cancelReason: 'Đổi nhầm',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.achievementScore).toBe(100);
    expect(balance.spentPoints).toBe(40);
    expect(balance.refundedPoints).toBe(20);
    expect(balance.redeemableBalance).toBe(60); // 100 - 40 = 60
    expect(balance.completedRedemptionCount).toBe(1);
  });

  it('4. Should batch calculate class balances without N+1 queries', async () => {
    const classId = 'cls-1';
    const student1 = 'st-1';
    const student2 = 'st-2';
    const now = new Date().toISOString();

    await db.classEnrollments.bulkAdd([
      {
        id: generateUUID(),
        classId,
        studentId: student1,
        status: 'Active',
        joinedAt: '2026-08-01',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: generateUUID(),
        classId,
        studentId: student2,
        status: 'Active',
        joinedAt: '2026-08-01',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);

    await db.pointEntries.bulkAdd([
      {
        id: generateUUID(),
        classId,
        studentId: student1,
        categoryId: 'cat-1',
        points: 60,
        reason: 'Học tập xuất sắc',
        occurredAt: '2026-08-10',
        recordedBy: 'GVCN',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: generateUUID(),
        classId,
        studentId: student2,
        categoryId: 'cat-1',
        points: 40,
        reason: 'Chăm chỉ phát biểu',
        occurredAt: '2026-08-10',
        recordedBy: 'GVCN',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);

    const batchBalances = await rewardBalanceService.calculateClassBalances(classId);
    expect(batchBalances.size).toBe(2);
    expect(batchBalances.get(student1)?.redeemableBalance).toBe(60);
    expect(batchBalances.get(student2)?.redeemableBalance).toBe(40);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { giftRedemptionService } from './gift-redemption.service';
import { rewardBalanceService } from './reward-balance.service';
import { rankCalculationService } from './rank-calculation.service';
import { rankSeedService } from './rank-seed.service';
import { generateUUID } from '../../shared/utilities/uuid';
import type { Gift } from '../database/types';

describe('GiftRedemptionService & Transaction Invariant Tests', () => {
  const classId = 'cls-test-1';
  const studentId = 'st-test-1';
  let giftTracked: Gift;
  let giftUnlimited: Gift;

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    const now = new Date().toISOString();

    // Create student active enrollment
    await db.classEnrollments.add({
      id: generateUUID(),
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2026-08-01',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Add 100 positive conduct points
    await db.pointCategories.add({
      id: 'cat-merit',
      name: 'Phát biểu tốt',
      type: 'Merit',
      defaultPoints: 10,
      countsTowardRank: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.pointEntries.add({
      id: generateUUID(),
      classId,
      studentId,
      categoryId: 'cat-merit',
      points: 100,
      reason: 'Phát biểu tốt',
      occurredAt: '2026-08-10',
      recordedBy: 'GVCN',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Create 1 Tracked gift (price: 20, stock: 5)
    giftTracked = {
      id: generateUUID(),
      name: 'Vở ô ly Bãi Bằng',
      normalizedName: 'vo o ly bai bang',
      category: 'STATIONERY',
      pointCost: 20,
      status: 'ACTIVE',
      inventoryMode: 'TRACKED',
      stockOnHand: 5,
      lowStockThreshold: 2,
      displayOrder: 1,
      presentationVisible: true,
      icon: 'Book',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.gifts.add(giftTracked);

    // Create 1 Unlimited gift (price: 50, unlimited)
    giftUnlimited = {
      id: generateUUID(),
      name: 'Đặc quyền đổi chỗ',
      normalizedName: 'dac quyen doi cho',
      category: 'PRIVILEGE',
      pointCost: 50,
      status: 'ACTIVE',
      inventoryMode: 'UNLIMITED',
      displayOrder: 2,
      presentationVisible: true,
      icon: 'Crown',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.gifts.add(giftUnlimited);
  });

  it('1. Should quote redemption accurately and detect affordability and stock', async () => {
    const quote = await giftRedemptionService.quoteRedemption(studentId, classId, [
      { giftId: giftTracked.id, quantity: 2 }, // 40 pts
      { giftId: giftUnlimited.id, quantity: 1 }, // 50 pts
    ]);

    expect(quote.isValid).toBe(true);
    expect(quote.currentBalance).toBe(100);
    expect(quote.totalPoints).toBe(90);
    expect(quote.balanceAfter).toBe(10);
    expect(quote.itemCount).toBe(3);
    expect(quote.blockingErrors.length).toBe(0);
  });

  it('2. Should block quote when cart exceeds student redeemable balance', async () => {
    const quote = await giftRedemptionService.quoteRedemption(studentId, classId, [
      { giftId: giftTracked.id, quantity: 6 }, // 120 pts > 100 pts
    ]);

    expect(quote.isValid).toBe(false);
    expect(quote.blockingErrors.some((e) => e.includes('không đủ điểm'))).toBe(true);
  });

  it('3. Should block quote when tracked gift has insufficient stock', async () => {
    const quote = await giftRedemptionService.quoteRedemption(studentId, classId, [
      { giftId: giftTracked.id, quantity: 10 }, // stock is 5
    ]);

    expect(quote.isValid).toBe(false);
    expect(quote.blockingErrors.some((e) => e.includes('không đủ số lượng'))).toBe(true);
  });

  it('4. Should execute redemption atomically: deduct balance, reduce stock, record movements & snapshots', async () => {
    const idempotencyKey = generateUUID();

    const result = await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [
        { giftId: giftTracked.id, quantity: 2 }, // 40 pts
      ],
      note: 'Khen thưởng tuần 1',
      idempotencyKey,
    });

    expect(result.redemption.status).toBe('COMPLETED');
    expect(result.redemption.totalPoints).toBe(40);
    expect(result.redemption.itemCount).toBe(2);
    expect(result.redeemableBalanceAfter).toBe(60);

    // Verify stock was reduced from 5 -> 3
    const updatedGift = await db.gifts.get(giftTracked.id);
    expect(updatedGift?.stockOnHand).toBe(3);

    // Verify stock movement recorded
    const movements = await db.giftStockMovements.where('giftId').equals(giftTracked.id).toArray();
    expect(movements.length).toBe(1);
    expect(movements[0]?.type).toBe('REDEMPTION');
    expect(movements[0]?.quantityDelta).toBe(-2);

    // Verify item snapshot stored
    expect(result.items.length).toBe(1);
    expect(result.items[0]?.giftNameSnapshot).toBe('Vở ô ly Bãi Bằng');
    expect(result.items[0]?.unitPointCostSnapshot).toBe(20);

    // Verify student balance now reflects the 40pt deduction
    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.redeemableBalance).toBe(60);
  });

  it('5. Should handle Idempotency Key protection: repeated submission returns existing without double deduction', async () => {
    const idempotencyKey = 'same-key-123';

    // First submit
    const res1 = await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [{ giftId: giftTracked.id, quantity: 1 }], // 20 pts
      idempotencyKey,
    });

    expect(res1.isIdempotentReplay).toBe(false);
    expect(res1.redeemableBalanceAfter).toBe(80);

    // Duplicate submit with same key
    const res2 = await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [{ giftId: giftTracked.id, quantity: 1 }],
      idempotencyKey,
    });

    expect(res2.isIdempotentReplay).toBe(true);
    expect(res2.redemption.id).toBe(res1.redemption.id);

    // Verify balance is still 80 (not 60)
    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.redeemableBalance).toBe(80);

    // Verify stock reduced only once (5 -> 4)
    const updatedGift = await db.gifts.get(giftTracked.id);
    expect(updatedGift?.stockOnHand).toBe(4);
  });

  it('6. Should cancel redemption, refund balance and restock tracked gifts', async () => {
    const result = await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [{ giftId: giftTracked.id, quantity: 2 }], // 40 pts
      idempotencyKey: generateUUID(),
    });

    expect(result.redeemableBalanceAfter).toBe(60);

    // Cancel redemption
    const cancelled = await giftRedemptionService.cancelRedemption(
      result.redemption.id,
      'Học sinh đổi nhầm món khác'
    );

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelReason).toBe('Học sinh đổi nhầm món khác');

    // Balance restored to 100
    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(balance.redeemableBalance).toBe(100);
    expect(balance.refundedPoints).toBe(40);

    // Stock restored back to 5
    const updatedGift = await db.gifts.get(giftTracked.id);
    expect(updatedGift?.stockOnHand).toBe(5);

    // Verify refund stock movement recorded
    const movements = await db.giftStockMovements
      .where('giftId')
      .equals(giftTracked.id)
      .filter((m) => m.type === 'REDEMPTION_CANCEL')
      .toArray();
    expect(movements.length).toBe(1);
    expect(movements[0]?.quantityDelta).toBe(2);
  });

  it('7. Should prevent double cancellation and double refund', async () => {
    const result = await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [{ giftId: giftTracked.id, quantity: 1 }], // 20 pts
      idempotencyKey: generateUUID(),
    });

    // 1st cancel
    await giftRedemptionService.cancelRedemption(result.redemption.id, 'Lý do 1');
    const bal1 = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(bal1.redeemableBalance).toBe(100);

    // 2nd cancel attempt
    await giftRedemptionService.cancelRedemption(result.redemption.id, 'Lý do 2');
    const bal2 = await rewardBalanceService.calculateStudentBalance(studentId, classId);
    expect(bal2.redeemableBalance).toBe(100); // Still 100, not 120!
  });

  it('8. Should guarantee that gift redemptions do NOT downgrade military rank or effectivePoints', async () => {
    // Initialize standard rank system (17 levels)
    const { system } = await rankSeedService.seedDefaultRankSystem('yr-1');

    // Check rank with 100 effective points
    const rankProgBefore = await rankCalculationService.calculateStudentPoints(studentId, system.id);
    expect(rankProgBefore.effectivePoints).toBe(100);

    // Execute redemption of 50 points
    await giftRedemptionService.executeRedemption({
      studentId,
      classId,
      cartItems: [{ giftId: giftUnlimited.id, quantity: 1 }], // 50 pts
      idempotencyKey: generateUUID(),
    });

    // Check rank after redemption: effectivePoints remains 100!
    const rankProgAfter = await rankCalculationService.calculateStudentPoints(studentId, system.id);
    expect(rankProgAfter.effectivePoints).toBe(100); // 100% invariant protected!
  });
});

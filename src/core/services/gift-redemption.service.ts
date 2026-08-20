import { db } from '../database/db';
import type {
  GiftRedemption,
  GiftRedemptionItem,
} from '../database/types';
import { rewardBalanceService } from './reward-balance.service';
import { generateUUID } from '../../shared/utilities/uuid';
import { getTodayDateString } from '../../shared/utilities/date';

export interface CartItemInput {
  giftId: string;
  quantity: number;
}

export interface QuotedCartItem {
  giftId: string;
  giftName: string;
  giftIcon?: string;
  category: string;
  unitPointCost: number;
  quantity: number;
  lineTotalPoints: number;
  isAvailable: boolean;
  stockOnHand?: number;
  inventoryMode: string;
  disabledReason?: string;
}

export interface RedemptionQuoteResult {
  studentId: string;
  classId: string;
  currentBalance: number;
  achievementScore: number;
  totalPoints: number;
  balanceAfter: number;
  itemCount: number;
  items: QuotedCartItem[];
  isValid: boolean;
  blockingErrors: string[];
  warnings: string[];
}

export interface ExecuteRedemptionInput {
  studentId: string;
  classId: string;
  academicYearId?: string;
  termId?: string;
  cartItems: CartItemInput[];
  note?: string;
  idempotencyKey: string;
  redeemedBy?: string;
}

export interface ExecuteRedemptionResult {
  redemption: GiftRedemption;
  items: GiftRedemptionItem[];
  redeemableBalanceAfter: number;
  isIdempotentReplay?: boolean;
}

export class GiftRedemptionService {
  /**
   * Tính toán báo giá / kiểm tra tính hợp lệ trước khi xác nhận đổi quà
   */
  async quoteRedemption(
    studentId: string,
    classId: string,
    cartItems: CartItemInput[]
  ): Promise<RedemptionQuoteResult> {
    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    // 1. Check student active enrollment
    const enrollment = await db.classEnrollments
      .where('[classId+studentId]')
      .equals([classId, studentId])
      .filter((e) => e.status === 'Active' && !e.deletedAt)
      .first();

    if (!enrollment) {
      blockingErrors.push('Học sinh không thuộc danh sách lớp học đang chọn hoặc đã chuyển lớp.');
    }

    // 2. Fetch student balance
    const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);

    // 3. Normalize cart items (merge duplicates)
    const mergedCart = new Map<string, number>();
    for (const item of cartItems) {
      if (item.quantity > 0) {
        mergedCart.set(item.giftId, (mergedCart.get(item.giftId) || 0) + item.quantity);
      }
    }

    if (mergedCart.size === 0) {
      blockingErrors.push('Giỏ đổi quà đang trống. Vui lòng chọn ít nhất 1 món quà.');
    }

    // 4. Batch fetch gifts
    const giftIds = Array.from(mergedCart.keys());
    const gifts = await db.gifts.where('id').anyOf(giftIds).toArray();
    const giftMap = new Map(gifts.map((g) => [g.id, g]));

    let totalPoints = 0;
    let itemCount = 0;
    const quotedItems: QuotedCartItem[] = [];

    for (const [giftId, qty] of mergedCart.entries()) {
      const gift = giftMap.get(giftId);
      if (!gift || gift.deletedAt || gift.status === 'ARCHIVED') {
        blockingErrors.push(`Món quà (Mã: ${giftId}) không còn tồn tại trong thư viện.`);
        continue;
      }

      let isAvailable = true;
      let disabledReason: string | undefined;

      if (gift.status === 'INACTIVE') {
        isAvailable = false;
        disabledReason = 'Món quà đang tạm ngừng quy đổi.';
        blockingErrors.push(`Món quà "${gift.name}" đang tạm ngừng quy đổi.`);
      }

      if (gift.inventoryMode === 'TRACKED') {
        const availableStock = gift.stockOnHand ?? 0;
        if (availableStock < qty) {
          isAvailable = false;
          disabledReason = `Không đủ tồn kho (Còn ${availableStock}, yêu cầu ${qty}).`;
          blockingErrors.push(`Món quà "${gift.name}" không đủ số lượng trong kho (Còn: ${availableStock}).`);
        } else if (gift.lowStockThreshold !== undefined && availableStock <= gift.lowStockThreshold) {
          warnings.push(`Món quà "${gift.name}" sắp hết hàng trong kho (Còn: ${availableStock}).`);
        }
      }

      const lineTotal = gift.pointCost * qty;
      totalPoints += lineTotal;
      itemCount += qty;

      quotedItems.push({
        giftId: gift.id,
        giftName: gift.name,
        giftIcon: gift.icon,
        category: gift.category,
        unitPointCost: gift.pointCost,
        quantity: qty,
        lineTotalPoints: lineTotal,
        isAvailable,
        stockOnHand: gift.stockOnHand,
        inventoryMode: gift.inventoryMode,
        disabledReason,
      });
    }

    if (totalPoints > balance.redeemableBalance) {
      const shortage = totalPoints - balance.redeemableBalance;
      blockingErrors.push(
        `Học sinh không đủ điểm khả dụng để đổi giỏ quà này (Cần ${totalPoints}đ, hiện có ${balance.redeemableBalance}đ, thiếu ${shortage}đ).`
      );
    }

    const balanceAfter = Math.max(0, balance.redeemableBalance - totalPoints);

    return {
      studentId,
      classId,
      currentBalance: balance.redeemableBalance,
      achievementScore: balance.achievementScore,
      totalPoints,
      balanceAfter,
      itemCount,
      items: quotedItems,
      isValid: blockingErrors.length === 0,
      blockingErrors,
      warnings,
    };
  }

  /**
   * Thực hiện giao dịch đổi quà NGUYÊN TỬ trong Dexie Read-Write Transaction
   */
  async executeRedemption(input: ExecuteRedemptionInput): Promise<ExecuteRedemptionResult> {
    const { studentId, classId, cartItems, note, idempotencyKey } = input;

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new Error('Thiếu Idempotency Key bảo vệ giao dịch.');
    }

    const nowISO = new Date().toISOString();
    const todayStr = getTodayDateString();

    let createdRedemption!: GiftRedemption;
    let createdItems: GiftRedemptionItem[] = [];
    let finalBalanceAfter = 0;
    let isIdempotentReplay = false;

    await db.runTransaction(
      'rw',
      [
        db.classEnrollments,
        db.pointEntries,
        db.gifts,
        db.giftRedemptions,
        db.giftRedemptionItems,
        db.giftStockMovements,
        db.auditLogs,
      ],
      async () => {
        // 1. Check idempotency guard inside transaction
        const existing = await db.giftRedemptions
          .where('idempotencyKey')
          .equals(idempotencyKey)
          .filter((r) => !r.deletedAt)
          .first();

        if (existing) {
          // Idempotent replay: return existing records
          const existingItems = await db.giftRedemptionItems
            .where('redemptionId')
            .equals(existing.id)
            .filter((i) => !i.deletedAt)
            .toArray();

          const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
          createdRedemption = existing;
          createdItems = existingItems;
          finalBalanceAfter = balance.redeemableBalance;
          isIdempotentReplay = true;
          return;
        }

        // 2. Validate active enrollment
        const enrollment = await db.classEnrollments
          .where('[classId+studentId]')
          .equals([classId, studentId])
          .filter((e) => e.status === 'Active' && !e.deletedAt)
          .first();

        if (!enrollment) {
          throw new Error('Học sinh không còn thuộc lớp học đang chọn.');
        }

        // 3. Merge cart items
        const mergedCart = new Map<string, number>();
        for (const item of cartItems) {
          if (item.quantity > 0) {
            mergedCart.set(item.giftId, (mergedCart.get(item.giftId) || 0) + item.quantity);
          }
        }

        if (mergedCart.size === 0) {
          throw new Error('Giỏ đổi quà trống.');
        }

        // 4. Batch read gifts
        const giftIds = Array.from(mergedCart.keys());
        const gifts = await db.gifts.where('id').anyOf(giftIds).toArray();
        const giftMap = new Map(gifts.map((g) => [g.id, g]));

        let calculatedTotalPoints = 0;
        let calculatedItemCount = 0;

        // 5. Verify gifts and stock inside transaction
        for (const [giftId, qty] of mergedCart.entries()) {
          const gift = giftMap.get(giftId);
          if (!gift || gift.deletedAt || gift.status !== 'ACTIVE') {
            throw new Error(`Món quà "${gift?.name || giftId}" không còn khả dụng để quy đổi.`);
          }

          if (gift.inventoryMode === 'TRACKED') {
            const currentStock = gift.stockOnHand ?? 0;
            if (currentStock < qty) {
              throw new Error(`Món quà "${gift.name}" không đủ số lượng trong kho (Còn: ${currentStock}, Cần: ${qty}).`);
            }
          }

          calculatedTotalPoints += gift.pointCost * qty;
          calculatedItemCount += qty;
        }

        // 6. Verify student balance inside transaction
        const balance = await rewardBalanceService.calculateStudentBalance(studentId, classId);
        if (calculatedTotalPoints > balance.redeemableBalance) {
          throw new Error(
            `Học sinh không đủ điểm khả dụng (Cần ${calculatedTotalPoints}đ, hiện có ${balance.redeemableBalance}đ).`
          );
        }

        // 7. Deduct stock and record stock movements
        for (const [giftId, qty] of mergedCart.entries()) {
          const gift = giftMap.get(giftId)!;
          if (gift.inventoryMode === 'TRACKED') {
            const oldStock = gift.stockOnHand ?? 0;
            const newStock = oldStock - qty;

            await db.gifts.update(gift.id, {
              stockOnHand: newStock,
              updatedAt: nowISO,
            });

            await db.giftStockMovements.add({
              id: generateUUID(),
              giftId: gift.id,
              type: 'REDEMPTION',
              quantityDelta: -qty,
              stockBefore: oldStock,
              stockAfter: newStock,
              reason: `Đổi quà cho học sinh (Mã HS: ${studentId})`,
              occurredAt: nowISO,
              createdAt: nowISO,
            });
          }
        }

        // 8. Create Redemption Record
        const redemptionId = generateUUID();
        const newRedemption: GiftRedemption = {
          id: redemptionId,
          studentId,
          classId,
          enrollmentId: enrollment.id,
          academicYearId: input.academicYearId,
          termId: input.termId,
          status: 'COMPLETED',
          totalPoints: calculatedTotalPoints,
          itemCount: calculatedItemCount,
          idempotencyKey,
          note: note?.trim() || '',
          redeemedAt: todayStr,
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        };

        await db.giftRedemptions.add(newRedemption);
        createdRedemption = newRedemption;

        // 9. Create Redemption Items with snapshots
        const itemsToInsert: GiftRedemptionItem[] = [];
        for (const [giftId, qty] of mergedCart.entries()) {
          const gift = giftMap.get(giftId)!;
          const lineTotal = gift.pointCost * qty;

          const itemRecord: GiftRedemptionItem = {
            id: generateUUID(),
            redemptionId,
            giftId: gift.id,
            giftNameSnapshot: gift.name,
            giftIconSnapshot: gift.icon,
            giftCategorySnapshot: gift.category,
            unitPointCostSnapshot: gift.pointCost,
            quantity: qty,
            lineTotalPoints: lineTotal,
            createdAt: nowISO,
            updatedAt: nowISO,
            deletedAt: null,
          };

          await db.giftRedemptionItems.add(itemRecord);
          itemsToInsert.push(itemRecord);
        }
        createdItems = itemsToInsert;

        // 10. Audit Log
        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'GiftRedemption',
          recordId: redemptionId,
          action: 'CREATE',
          timestamp: nowISO,
          details: `Xác nhận đổi ${calculatedItemCount} món quà (-${calculatedTotalPoints} điểm) cho học sinh (Mã HS: ${studentId})`,
        });

        finalBalanceAfter = Math.max(0, balance.redeemableBalance - calculatedTotalPoints);
      }
    );

    return {
      redemption: createdRedemption,
      items: createdItems,
      redeemableBalanceAfter: finalBalanceAfter,
      isIdempotentReplay,
    };
  }

  /**
   * Hủy giao dịch đổi quà (Bút toán bù: Hoàn điểm khả dụng và hoàn tồn kho nguyên tử)
   */
  async cancelRedemption(
    redemptionId: string,
    cancelReason: string,
    cancelledBy?: string
  ): Promise<GiftRedemption> {
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('Vui lòng nhập lý do hủy giao dịch (tối thiểu 3 ký tự).');
    }

    const nowISO = new Date().toISOString();
    let updatedRedemption!: GiftRedemption;

    await db.runTransaction(
      'rw',
      [
        db.gifts,
        db.giftRedemptions,
        db.giftRedemptionItems,
        db.giftStockMovements,
        db.auditLogs,
      ],
      async () => {
        // 1. Fetch redemption
        const redemption = await db.giftRedemptions.get(redemptionId);
        if (!redemption || redemption.deletedAt) {
          throw new Error('Giao dịch đổi quà không tồn tại.');
        }

        // 2. Anti-double cancel
        if (redemption.status === 'CANCELLED') {
          updatedRedemption = redemption;
          return;
        }

        // 3. Fetch items to restock
        const items = await db.giftRedemptionItems
          .where('redemptionId')
          .equals(redemptionId)
          .filter((i) => !i.deletedAt)
          .toArray();

        // 4. Restock tracked gifts
        for (const item of items) {
          const gift = await db.gifts.get(item.giftId);
          if (gift && gift.inventoryMode === 'TRACKED') {
            const oldStock = gift.stockOnHand ?? 0;
            const newStock = oldStock + item.quantity;

            await db.gifts.update(gift.id, {
              stockOnHand: newStock,
              updatedAt: nowISO,
            });

            await db.giftStockMovements.add({
              id: generateUUID(),
              giftId: gift.id,
              type: 'REDEMPTION_CANCEL',
              quantityDelta: item.quantity,
              stockBefore: oldStock,
              stockAfter: newStock,
              redemptionId,
              reason: `Hoàn kho do hủy giao dịch đổi quà (${trimmedReason})`,
              occurredAt: nowISO,
              createdAt: nowISO,
            });
          }
        }

        // 5. Update redemption status to CANCELLED
        const updates: Partial<GiftRedemption> = {
          status: 'CANCELLED',
          cancelledAt: nowISO,
          cancelReason: trimmedReason,
          cancelledBy: cancelledBy || 'Giáo viên Chủ nhiệm',
          updatedAt: nowISO,
        };

        await db.giftRedemptions.update(redemptionId, updates);
        updatedRedemption = {
          ...redemption,
          ...updates,
        };

        // 6. Audit Log
        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'GiftRedemption',
          recordId: redemptionId,
          action: 'REVERSE',
          timestamp: nowISO,
          details: `Hủy giao dịch đổi quà (Hoàn +${redemption.totalPoints} điểm cho học sinh ${redemption.studentId}). Lý do: "${trimmedReason}"`,
        });
      }
    );

    return updatedRedemption;
  }
}

export const giftRedemptionService = new GiftRedemptionService();

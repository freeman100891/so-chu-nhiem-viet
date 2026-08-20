import { db } from '../database/db';
import type { GiftStockMovement } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export class GiftStockMovementRepository {
  /**
   * Ghi nhận một biến động kho
   */
  async recordMovement(
    movement: Omit<GiftStockMovement, 'id' | 'createdAt'>
  ): Promise<GiftStockMovement> {
    const record: GiftStockMovement = {
      ...movement,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    await db.giftStockMovements.add(record);
    return record;
  }

  /**
   * Lấy toàn bộ lịch sử biến động kho của 1 món quà
   */
  async findByGiftId(giftId: string): Promise<GiftStockMovement[]> {
    return await db.giftStockMovements
      .where('giftId')
      .equals(giftId)
      .reverse()
      .sortBy('occurredAt');
  }
}

export const giftStockMovementRepository = new GiftStockMovementRepository();

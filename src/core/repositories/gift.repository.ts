import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { Gift, GiftCategory, GiftStatus } from '../database/types';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import { generateUUID } from '../../shared/utilities/uuid';

export class GiftRepository extends BaseRepository<Gift> {
  constructor() {
    super(db.gifts, 'Gift');
  }

  override async create(
    item: Omit<Gift, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'normalizedName'>
  ): Promise<Gift> {
    const normalizedName = normalizeVietnameseText(item.name);
    return super.create({
      ...item,
      normalizedName,
    });
  }

  override async update(
    id: string,
    updates: Partial<Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Gift | undefined> {
    if (updates.name) {
      updates.normalizedName = normalizeVietnameseText(updates.name);
    }
    return super.update(id, updates);
  }

  /**
   * Lấy danh sách quà tặng đang cho phép quy đổi (ACTIVE, không bị xóa)
   */
  async findActiveGifts(): Promise<Gift[]> {
    return await this.table
      .where('status')
      .equals('ACTIVE')
      .filter((g) => !g.deletedAt)
      .sortBy('displayOrder');
  }

  /**
   * Lấy toàn bộ quà tặng trong catalog (ACTIVE & INACTIVE), loại trừ ARCHIVED
   */
  async findCatalogGifts(includeArchived = false): Promise<Gift[]> {
    const gifts = await this.table
      .filter((g) => {
        if (g.deletedAt) return false;
        if (!includeArchived && g.status === 'ARCHIVED') return false;
        return true;
      })
      .toArray();

    return gifts.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }

  /**
   * Lấy danh sách quà hiển thị trên màn hình trình chiếu (presentationVisible = true)
   */
  async findPresentationGifts(): Promise<Gift[]> {
    return await this.table
      .filter((g) => !g.deletedAt && g.status === 'ACTIVE' && g.presentationVisible === true)
      .toArray();
  }

  /**
   * Tìm kiếm quà tặng theo tên tiếng Việt có dấu hoặc không dấu
   */
  async searchGifts(query: string, category?: GiftCategory | 'ALL', status?: GiftStatus | 'ALL'): Promise<Gift[]> {
    const normalizedQuery = normalizeVietnameseText(query);

    return await this.table
      .filter((g) => {
        if (g.deletedAt) return false;
        if (category && category !== 'ALL' && g.category !== category) return false;
        if (status && status !== 'ALL' && g.status !== status) return false;
        if (!normalizedQuery) return true;
        return g.normalizedName.includes(normalizedQuery) || normalizeVietnameseText(g.description || '').includes(normalizedQuery);
      })
      .toArray();
  }

  /**
   * Lưu kho / Điều chỉnh tồn kho trực tiếp cho 1 món quà
   */
  async updateStock(id: string, newStock: number): Promise<boolean> {
    const gift = await this.findById(id);
    if (!gift) return false;

    const nowISO = new Date().toISOString();
    await this.table.update(id, {
      stockOnHand: Math.max(0, newStock),
      updatedAt: nowISO,
    });

    await db.auditLogs.add({
      id: generateUUID(),
      entityName: 'Gift',
      recordId: id,
      action: 'UPDATE',
      timestamp: nowISO,
      details: `Điều chỉnh tồn kho món quà "${gift.name}": ${gift.stockOnHand ?? 0} ➔ ${newStock}`,
    });

    return true;
  }

  /**
   * Đưa quà vào lưu trữ (ARCHIVED)
   */
  async archiveGift(id: string): Promise<boolean> {
    const gift = await this.findById(id);
    if (!gift) return false;

    const nowISO = new Date().toISOString();
    await this.table.update(id, {
      status: 'ARCHIVED',
      updatedAt: nowISO,
    });

    await db.auditLogs.add({
      id: generateUUID(),
      entityName: 'Gift',
      recordId: id,
      action: 'UPDATE',
      timestamp: nowISO,
      details: `Lưu trữ (Archive) món quà "${gift.name}"`,
    });

    return true;
  }

  /**
   * Kích hoạt lại quà (ACTIVE)
   */
  async unarchiveGift(id: string): Promise<boolean> {
    const gift = await this.findById(id);
    if (!gift) return false;

    const nowISO = new Date().toISOString();
    await this.table.update(id, {
      status: 'ACTIVE',
      updatedAt: nowISO,
    });

    await db.auditLogs.add({
      id: generateUUID(),
      entityName: 'Gift',
      recordId: id,
      action: 'UPDATE',
      timestamp: nowISO,
      details: `Khôi phục trạng thái hoạt động món quà "${gift.name}"`,
    });

    return true;
  }
}

export const giftRepository = new GiftRepository();

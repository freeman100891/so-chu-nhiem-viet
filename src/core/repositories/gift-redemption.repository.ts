import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { GiftRedemption, GiftRedemptionItem, GiftRedemptionStatus } from '../database/types';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';

export interface HistoryQueryFilter {
  classId?: string;
  studentId?: string;
  status?: GiftRedemptionStatus | 'ALL';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  searchQuery?: string;
}

export interface DetailedRedemptionRecord {
  redemption: GiftRedemption;
  items: GiftRedemptionItem[];
  studentName?: string;
  studentCode?: string;
  studentAvatarKey?: string | null;
  className?: string;
}

export class GiftRedemptionRepository extends BaseRepository<GiftRedemption> {
  constructor() {
    super(db.giftRedemptions, 'GiftRedemption');
  }

  /**
   * Tìm giao dịch đổi quà theo Idempotency Key
   */
  async findByIdempotencyKey(key: string): Promise<GiftRedemption | undefined> {
    return await this.table
      .where('idempotencyKey')
      .equals(key)
      .filter((r) => !r.deletedAt)
      .first();
  }

  /**
   * Lấy danh sách các món quà trong một giao dịch
   */
  async findItemsByRedemptionId(redemptionId: string): Promise<GiftRedemptionItem[]> {
    return await db.giftRedemptionItems
      .where('redemptionId')
      .equals(redemptionId)
      .filter((item) => !item.deletedAt)
      .toArray();
  }

  /**
   * Lấy toàn bộ lịch sử đổi quà của một học sinh
   */
  async findByStudentId(studentId: string): Promise<GiftRedemption[]> {
    return await this.table
      .where('studentId')
      .equals(studentId)
      .filter((r) => !r.deletedAt)
      .reverse()
      .sortBy('redeemedAt');
  }

  /**
   * Lấy toàn bộ lịch sử đổi quà của một lớp học
   */
  async findByClassId(classId: string): Promise<GiftRedemption[]> {
    return await this.table
      .where('classId')
      .equals(classId)
      .filter((r) => !r.deletedAt)
      .reverse()
      .sortBy('redeemedAt');
  }

  /**
   * Truy vấn lịch sử đổi quà đa điều kiện kèm join thông tin học sinh và items
   */
  async queryHistoryWithDetails(filter: HistoryQueryFilter): Promise<DetailedRedemptionRecord[]> {
    // 1. Fetch redemptions based on primary filter
    let redemptions: GiftRedemption[];

    if (filter.studentId) {
      redemptions = await this.table
        .where('studentId')
        .equals(filter.studentId)
        .filter((r) => !r.deletedAt)
        .toArray();
    } else if (filter.classId) {
      redemptions = await this.table
        .where('classId')
        .equals(filter.classId)
        .filter((r) => !r.deletedAt)
        .toArray();
    } else {
      redemptions = await this.table
        .filter((r) => !r.deletedAt)
        .toArray();
    }

    // Filter by status
    if (filter.status && filter.status !== 'ALL') {
      redemptions = redemptions.filter((r) => r.status === filter.status);
    }

    // Filter by date range
    if (filter.startDate) {
      redemptions = redemptions.filter((r) => r.redeemedAt >= filter.startDate!);
    }
    if (filter.endDate) {
      redemptions = redemptions.filter((r) => r.redeemedAt <= filter.endDate!);
    }

    // Sort newest first
    redemptions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (redemptions.length === 0) {
      return [];
    }

    // 2. Batch load all students, classes, and items (Zero N+1)
    const studentIds = Array.from(new Set(redemptions.map((r) => r.studentId)));
    const classIds = Array.from(new Set(redemptions.map((r) => r.classId)));
    const redemptionIds = redemptions.map((r) => r.id);

    const [students, classes, allItems] = await Promise.all([
      db.students.where('id').anyOf(studentIds).toArray(),
      db.classes.where('id').anyOf(classIds).toArray(),
      db.giftRedemptionItems.where('redemptionId').anyOf(redemptionIds).filter((i) => !i.deletedAt).toArray(),
    ]);

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c]));
    const itemsMap = new Map<string, GiftRedemptionItem[]>();

    allItems.forEach((item) => {
      const list = itemsMap.get(item.redemptionId) || [];
      list.push(item);
      itemsMap.set(item.redemptionId, list);
    });

    const normalizedQuery = filter.searchQuery ? normalizeVietnameseText(filter.searchQuery) : '';

    const results: DetailedRedemptionRecord[] = [];

    for (const r of redemptions) {
      const student = studentMap.get(r.studentId);
      const cls = classMap.get(r.classId);
      const items = itemsMap.get(r.id) || [];

      const studentName = student?.fullName || 'Học sinh';
      const studentCode = student?.studentCode || '';
      const className = cls?.name ? `Lớp ${cls.name}` : '';

      // Check text search
      if (normalizedQuery) {
        const matchStudent = normalizeVietnameseText(studentName).includes(normalizedQuery);
        const matchCode = normalizeVietnameseText(studentCode).includes(normalizedQuery);
        const matchGift = items.some((i) => normalizeVietnameseText(i.giftNameSnapshot).includes(normalizedQuery));

        if (!matchStudent && !matchCode && !matchGift) {
          continue;
        }
      }

      results.push({
        redemption: r,
        items,
        studentName,
        studentCode,
        studentAvatarKey: student?.avatarKey,
        className,
      });
    }

    return results;
  }
}

export const giftRedemptionRepository = new GiftRedemptionRepository();

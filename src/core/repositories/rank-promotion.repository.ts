import { db } from '../database/db';
import type { RankPromotionEvent } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export class RankPromotionRepository {
  /**
   * Tạo sự kiện thăng hạng mới
   */
  async create(event: Partial<RankPromotionEvent> & { classId: string; studentId: string; fromLevel: number; toLevel: number; fromRankName: string; toRankName: string; levelsGained: number }): Promise<RankPromotionEvent> {
    const nowISO = new Date().toISOString();
    const newEvent: RankPromotionEvent = {
      id: event.id || generateUUID(),
      classId: event.classId,
      studentId: event.studentId,
      liveSessionId: event.liveSessionId || null,
      sourcePointEntryId: event.sourcePointEntryId || null,
      fromLevel: event.fromLevel,
      toLevel: event.toLevel,
      fromRankName: event.fromRankName,
      toRankName: event.toRankName,
      levelsGained: event.levelsGained,
      pointsBefore: event.pointsBefore || 0,
      pointsAfter: event.pointsAfter || 0,
      status: event.status || 'PENDING',
      createdAt: event.createdAt || nowISO,
      presentedAt: event.presentedAt || null,
      skippedAt: event.skippedAt || null,
      skipReason: event.skipReason || null,
      updatedAt: event.updatedAt || nowISO,
    };

    await db.rankPromotionEvents.add(newEvent);
    return newEvent;
  }

  /**
   * Tìm sự kiện theo ID
   */
  async findById(id: string): Promise<RankPromotionEvent | undefined> {
    return await db.rankPromotionEvents.get(id);
  }

  /**
   * Cập nhật sự kiện theo ID
   */
  async update(id: string, updates: Partial<RankPromotionEvent>): Promise<RankPromotionEvent | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const merged: RankPromotionEvent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.rankPromotionEvents.put(merged);
    return merged;
  }

  /**
   * Lấy danh sách sự kiện thăng hạng đang chờ (PENDING) theo phiên học trực tuyến
   */
  async findPendingBySession(sessionId: string): Promise<RankPromotionEvent[]> {
    const events = await db.rankPromotionEvents
      .where('liveSessionId')
      .equals(sessionId)
      .filter((e) => e.status === 'PENDING')
      .toArray();

    return events.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
  }

  /**
   * Lấy danh sách sự kiện thăng hạng đang chờ (PENDING) theo lớp học
   */
  async findPendingByClass(classId: string): Promise<RankPromotionEvent[]> {
    const events = await db.rankPromotionEvents
      .where('classId')
      .equals(classId)
      .filter((e) => e.status === 'PENDING')
      .toArray();

    return events.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
  }

  /**
   * Tìm kiếm sự kiện đã tạo cho giao dịch điểm cụ thể (Chống trùng lặp Idempotency)
   */
  async findBySourcePointEntry(studentId: string, sourcePointEntryId: string): Promise<RankPromotionEvent | undefined> {
    return await db.rankPromotionEvents
      .where('studentId')
      .equals(studentId)
      .filter((e) => e.sourcePointEntryId === sourcePointEntryId)
      .first();
  }

  /**
   * Đánh dấu sự kiện đã được trình chiếu thành công
   */
  async markPresented(eventId: string): Promise<RankPromotionEvent | undefined> {
    const nowISO = new Date().toISOString();
    return await this.update(eventId, {
      status: 'PRESENTED',
      presentedAt: nowISO,
      updatedAt: nowISO,
    });
  }

  /**
   * Đánh dấu giáo viên bỏ qua sự kiện
   */
  async markSkipped(eventId: string, reason = 'Giáo viên bỏ qua'): Promise<RankPromotionEvent | undefined> {
    const nowISO = new Date().toISOString();
    return await this.update(eventId, {
      status: 'SKIPPED',
      skippedAt: nowISO,
      skipReason: reason,
      updatedAt: nowISO,
    });
  }

  /**
   * Bỏ qua toàn bộ sự kiện đang chờ trong phiên học
   */
  async skipAllPendingInSession(sessionId: string, reason = 'Bỏ qua tất cả'): Promise<number> {
    const pending = await this.findPendingBySession(sessionId);
    const nowISO = new Date().toISOString();

    for (const evt of pending) {
      await this.update(evt.id, {
        status: 'SKIPPED',
        skippedAt: nowISO,
        skipReason: reason,
        updatedAt: nowISO,
      });
    }

    return pending.length;
  }

  /**
   * Lấy lịch sử thăng hạng gần đây theo lớp (phục vụ đối soát hoặc replay)
   */
  async findRecentHistory(classId: string, limit = 20): Promise<RankPromotionEvent[]> {
    const events = await db.rankPromotionEvents
      .where('classId')
      .equals(classId)
      .toArray();

    return events
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const rankPromotionRepository = new RankPromotionRepository();

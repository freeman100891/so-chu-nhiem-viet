import { db } from '../database/db';
import type { PointCategory, PointEntry } from '../database/types';
import { conductRepository } from '../repositories/conduct.repository';
import { getTodayDateString } from '../../shared/utilities/date';

export interface ProgressRank {
  name: string;
  minPoints: number;
  maxPoints: number;
  badgeName: string;
  color: string;
  iconName: string;
}

export const PROGRESS_RANKS: ProgressRank[] = [
  {
    name: 'Chiến sĩ Cần mẫn',
    minPoints: 0,
    maxPoints: 49,
    badgeName: 'Huy hiệu Cần Mẫn',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    iconName: 'Shield',
  },
  {
    name: 'Chiến sĩ Thi đua',
    minPoints: 50,
    maxPoints: 99,
    badgeName: 'Huy hiệu Thi Đua',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'Award',
  },
  {
    name: 'Đội viên Tiên phong',
    minPoints: 100,
    maxPoints: 149,
    badgeName: 'Huy hiệu Tiên Phong',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    iconName: 'Medal',
  },
  {
    name: 'Gương sáng Lớp học',
    minPoints: 150,
    maxPoints: 9999,
    badgeName: 'Huy hiệu Gương Sáng',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    iconName: 'Crown',
  },
];

export interface RecordPointsInput {
  classId: string;
  studentIds: string[];
  categoryId: string;
  points: number;
  reason?: string;
  occurredAt?: string;
  recordedBy?: string;
}

export class ConductService {
  /**
   * Tự động khởi tạo 6 Danh mục điểm thi đua mặc định nếu database trống
   */
  async seedDefaultCategories(): Promise<PointCategory[]> {
    const activeCats = await db.pointCategories.filter((c) => !c.deletedAt).toArray();
    if (activeCats.length > 0) {
      return activeCats;
    }

    const nowISO = new Date().toISOString();
    const defaults: Omit<PointCategory, 'id'>[] = [
      { name: 'Học tập tốt', type: 'Merit', defaultPoints: 10, description: 'Đạt điểm tốt, hăng hái phát biểu', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
      { name: 'Giúp đỡ bạn', type: 'Merit', defaultPoints: 10, description: 'Hỗ trợ bạn bè trong học tập và nề nếp', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
      { name: 'Chuẩn bị bài đầy đủ', type: 'Merit', defaultPoints: 5, description: 'Làm bài tập về nhà và chuẩn bị bài đầy đủ', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
      { name: 'Giữ vệ sinh', type: 'Merit', defaultPoints: 5, description: 'Vệ sinh lớp học sạch sẽ, ngăn nắp', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
      { name: 'Đi học muộn', type: 'Demerit', defaultPoints: -5, description: 'Vào lớp sau tiếng trống trường', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
      { name: 'Chưa hoàn thành nhiệm vụ', type: 'Demerit', defaultPoints: -5, description: 'Chưa chuẩn bị bài hoặc thiếu dụng cụ', createdAt: nowISO, updatedAt: nowISO, deletedAt: null },
    ];

    const seeded: PointCategory[] = [];
    for (const item of defaults) {
      const cat: PointCategory = {
        id: crypto.randomUUID(),
        ...item,
      };
      await db.pointCategories.add(cat);
      seeded.push(cat);
    }

    return seeded;
  }

  /**
   * Ghi nhận điểm thi đua đơn lẻ hoặc Hàng loạt (Bulk scoring) trong Dexie Transaction
   */
  async recordBulkPoints(input: RecordPointsInput): Promise<PointEntry[]> {
    if (!input.studentIds || input.studentIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 học sinh để ghi điểm.');
    }

    const occurredAt: string = input.occurredAt !== undefined && input.occurredAt !== '' ? input.occurredAt : getTodayDateString();
    const nowISO = new Date().toISOString();
    const entries: PointEntry[] = [];

    await db.runTransaction('rw', [db.pointEntries, db.auditLogs], async () => {
      for (const studentId of input.studentIds) {
        const entry: PointEntry = {
          id: crypto.randomUUID(),
          classId: input.classId,
          studentId,
          categoryId: input.categoryId,
          points: input.points,
          reason: input.reason || '',
          occurredAt,
          recordedBy: input.recordedBy || 'Giáo viên Chủ nhiệm',
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        };
        await db.pointEntries.add(entry);
        entries.push(entry);
      }

      // Audit Log
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'PointEntry',
        recordId: input.classId,
        action: 'CREATE',
        timestamp: nowISO,
        details: `Ghi nhận ${input.points > 0 ? '+' : ''}${input.points} điểm thi đua cho ${input.studentIds.length} học sinh (Lý do: ${input.reason || 'Khen thưởng/Nề nếp'})`,
      });
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('point_entries_changed'));
      window.dispatchEvent(new Event('gvcn_data_changed'));
    }

    return entries;
  }

  /**
   * Tính toán tổng điểm thi đua ĐỘNG cho 1 học sinh từ danh sách pointEntries
   */
  async calculateStudentTotalPoints(
    studentId: string,
    classId: string,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    let entries = await db.pointEntries
      .where('studentId')
      .equals(studentId)
      .filter((e) => !e.deletedAt && e.classId === classId)
      .toArray();

    if (startDate) {
      entries = entries.filter((e) => e.occurredAt >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.occurredAt <= endDate);
    }

    return entries.reduce((sum, e) => sum + e.points, 100); // 100 điểm chuẩn ban đầu
  }

  /**
   * Chỉnh sửa bản ghi điểm thi đua và lưu vết Audit Log (oldValue -> newValue)
   */
  async updatePointEntry(id: string, newPoints: number, newReason?: string): Promise<PointEntry | undefined> {
    const oldEntry = await conductRepository.findById(id);
    if (!oldEntry) return undefined;

    const nowISO = new Date().toISOString();

    const updated = await conductRepository.update(id, {
      points: newPoints,
      reason: newReason,
    });

    // Record Audit Log with oldValue / newValue
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      entityName: 'PointEntry',
      recordId: id,
      action: 'UPDATE',
      timestamp: nowISO,
      details: `Điều chỉnh điểm thi đua (Mã: ${id}): Điểm cũ=${oldEntry.points} ➔ Điểm mới=${newPoints}, Lý do cũ="${oldEntry.reason || ''}" ➔ Lý do mới="${newReason || ''}"`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('point_entries_changed'));
      window.dispatchEvent(new Event('gvcn_data_changed'));
    }

    return updated;
  }

  /**
   * Xóa bản ghi điểm thi đua (Soft delete) và lưu vết Audit Log
   */
  async deletePointEntry(id: string): Promise<boolean> {
    const oldEntry = await conductRepository.findById(id);
    if (!oldEntry) return false;

    const nowISO = new Date().toISOString();
    const deleted = await conductRepository.softDelete(id);

    if (deleted) {
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'PointEntry',
        recordId: id,
        action: 'DELETE',
        timestamp: nowISO,
        details: `Xóa bản ghi thi đua (${oldEntry.points} điểm, Học sinh: ${oldEntry.studentId})`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('point_entries_changed'));
        window.dispatchEvent(new Event('gvcn_data_changed'));
      }
    }

    return deleted;
  }

  /**
   * Xác định Cấp bậc Tiến bộ & Huy hiệu đạt được dựa trên tổng điểm
   */
  getProgressRank(totalPoints: number): ProgressRank {
    const rank = PROGRESS_RANKS.find(
      (r) => totalPoints >= r.minPoints && totalPoints <= r.maxPoints
    );
    return rank || PROGRESS_RANKS[0]!;
  }
}

export const conductService = new ConductService();

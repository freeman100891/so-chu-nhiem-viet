import { db } from '../database/db';
import { generateUUID } from '../../shared/utilities/uuid';

export type TrashEntityType = 'class' | 'student' | 'note' | 'evaluation';

export interface TrashItem {
  id: string;
  type: TrashEntityType;
  typeLabel: string;
  name: string;
  details: string;
  deletedAt: string;
}

export class TrashService {
  /**
   * Đọc danh sách tất cả các mục đã bị soft delete
   */
  async getTrashItems(): Promise<TrashItem[]> {
    const items: TrashItem[] = [];

    // 1. Soft deleted classes
    const deletedClasses = await db.classes.filter((c) => !!c.deletedAt).toArray();
    deletedClasses.forEach((c) => {
      items.push({
        id: c.id,
        type: 'class',
        typeLabel: 'Lớp học',
        name: `Lớp ${c.name}`,
        details: `Khối ${c.grade} • Mô tả: ${c.description || 'Không có'}`,
        deletedAt: c.deletedAt!,
      });
    });

    // 2. Soft deleted students
    const deletedStudents = await db.students.filter((s) => !!s.deletedAt).toArray();
    deletedStudents.forEach((s) => {
      items.push({
        id: s.id,
        type: 'student',
        typeLabel: 'Học sinh',
        name: s.fullName,
        details: `Mã HS: ${s.studentCode} • Ngày sinh: ${s.dateOfBirth}`,
        deletedAt: s.deletedAt!,
      });
    });

    // 3. Soft deleted notes
    const deletedNotes = await db.studentNotes.filter((n) => !!n.deletedAt).toArray();
    deletedNotes.forEach((n) => {
      items.push({
        id: n.id,
        type: 'note',
        typeLabel: 'Ghi chú',
        name: `Ghi chú ${n.category}`,
        details: n.content,
        deletedAt: n.deletedAt!,
      });
    });

    items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    return items;
  }

  /**
   * Khôi phục mục bị soft delete
   */
  async restoreItem(type: TrashEntityType, id: string): Promise<boolean> {
    const nowISO = new Date().toISOString();

    if (type === 'class') {
      const cls = await db.classes.get(id);
      if (!cls) return false;
      await db.classes.update(id, { deletedAt: null, updatedAt: nowISO });
    } else if (type === 'student') {
      const st = await db.students.get(id);
      if (!st) return false;
      await db.students.update(id, { deletedAt: null, updatedAt: nowISO });
      // Restore enrollments
      await db.classEnrollments.where('studentId').equals(id).modify({ deletedAt: null, updatedAt: nowISO });
    } else if (type === 'note') {
      const note = await db.studentNotes.get(id);
      if (!note) return false;
      await db.studentNotes.update(id, { deletedAt: null, updatedAt: nowISO });
    }

    // Log audit event
    await db.auditLogs.add({
      id: generateUUID(),
      entityName: type,
      recordId: id,
      action: 'RESTORE',
      timestamp: nowISO,
      details: `Khôi phục mục đã xóa (${type}: ${id})`,
    });

    return true;
  }

  /**
   * Khôi phục nhiều mục cùng lúc
   */
  async restoreItems(items: { type: TrashEntityType; id: string }[]): Promise<{ successCount: number; failedCount: number }> {
    if (!items.length) return { successCount: 0, failedCount: 0 };
    let successCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const ok = await this.restoreItem(item.type, item.id);
        if (ok) successCount++;
        else failedCount++;
      } catch {
        failedCount++;
      }
    }

    return { successCount, failedCount };
  }

  /**
   * Xóa vĩnh viễn 1 mục khỏi database
   */
  async hardDeleteItem(type: TrashEntityType, id: string): Promise<boolean> {
    const nowISO = new Date().toISOString();

    if (type === 'class') {
      await db.classes.delete(id);
      // Clean up enrollments of this class
      const enrollments = await db.classEnrollments.where('classId').equals(id).toArray();
      for (const e of enrollments) await db.classEnrollments.delete(e.id);
    } else if (type === 'student') {
      await db.students.delete(id);
      // Clean up enrollments
      const enrollments = await db.classEnrollments.where('studentId').equals(id).toArray();
      for (const e of enrollments) await db.classEnrollments.delete(e.id);
    } else if (type === 'note') {
      await db.studentNotes.delete(id);
    }

    await db.auditLogs.add({
      id: generateUUID(),
      entityName: type,
      recordId: id,
      action: 'DELETE',
      timestamp: nowISO,
      details: `Xóa vĩnh viễn mục khỏi database (${type}: ${id})`,
    });

    return true;
  }

  /**
   * Xóa vĩnh viễn nhiều mục cùng lúc khỏi database
   */
  async hardDeleteItems(items: { type: TrashEntityType; id: string }[]): Promise<{ successCount: number; failedCount: number }> {
    if (!items.length) return { successCount: 0, failedCount: 0 };
    let successCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const ok = await this.hardDeleteItem(item.type, item.id);
        if (ok) successCount++;
        else failedCount++;
      } catch {
        failedCount++;
      }
    }

    return { successCount, failedCount };
  }
}

export const trashService = new TrashService();

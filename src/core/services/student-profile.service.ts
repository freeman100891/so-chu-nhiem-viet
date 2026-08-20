import { db } from '../database/db';
import type {
  StudentNote,
  StudentNoteCategory,
  ParentContact,
  ParentInteraction,
} from '../database/types';
import { getTodayDateString } from '../../shared/utilities/date';

export interface TimelineEventItem {
  id: string;
  type: 'Note' | 'Interaction' | 'Merit' | 'Attendance';
  date: string;
  title: string;
  description: string;
  badgeText?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  isPinned?: boolean;
  isSensitive?: boolean;
}

export class StudentProfileService {
  /**
   * Thêm Ghi chú Học sinh
   */
  async addStudentNote(input: {
    classId: string;
    studentId: string;
    termId?: string;
    category: StudentNoteCategory;
    content: string;
    recordedAt?: string;
    isPinned?: boolean;
  }): Promise<StudentNote> {
    const nowISO = new Date().toISOString();
    const note: StudentNote = {
      id: crypto.randomUUID(),
      classId: input.classId,
      studentId: input.studentId,
      termId: input.termId,
      category: input.category,
      content: input.content,
      isPinned: input.isPinned || false,
      recordedAt: input.recordedAt || getTodayDateString(),
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };
    await db.studentNotes.add(note);
    return note;
  }

  /**
   * Đảo trạng thái Ghim ghi chú quan trọng lên đầu
   */
  async togglePinNote(noteId: string): Promise<boolean> {
    const note = await db.studentNotes.get(noteId);
    if (!note) return false;
    const newPinned = !note.isPinned;
    await db.studentNotes.update(noteId, {
      isPinned: newPinned,
      updatedAt: new Date().toISOString(),
    });
    return newPinned;
  }

  /**
   * Xóa ghi chú (Soft delete hỗ trợ phục hồi từ Thùng rác)
   */
  async deleteStudentNote(noteId: string): Promise<boolean> {
    const note = await db.studentNotes.get(noteId);
    if (!note) return false;
    await db.studentNotes.update(noteId, {
      deletedAt: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Lấy danh sách Ghi chú Học sinh (Ưu tiên Pinned lên đầu, sau đó theo Ngày ghi nhận giảm dần)
   */
  async getStudentNotes(studentId: string, categoryFilter?: StudentNoteCategory): Promise<StudentNote[]> {
    let notes = await db.studentNotes
      .where('studentId')
      .equals(studentId)
      .filter((n) => !n.deletedAt)
      .toArray();

    if (categoryFilter) {
      notes = notes.filter((n) => n.category === categoryFilter);
    }

    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.recordedAt || b.createdAt).localeCompare(a.recordedAt || a.createdAt);
    });

    return notes;
  }

  /**
   * Lọc bỏ thông tin nhạy cảm (Sức khỏe, Hoàn cảnh) khi hiển thị bảng công khai
   */
  filterPublicNotes(notes: StudentNote[]): StudentNote[] {
    return notes.filter((n) => n.category !== 'SucKhoe' && n.category !== 'HoanCanh');
  }

  /**
   * Thêm/Cập nhật Phụ huynh liên hệ
   */
  async saveParentContact(contact: Omit<ParentContact, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }): Promise<ParentContact> {
    const nowISO = new Date().toISOString();
    const id = contact.id || crypto.randomUUID();

    if (contact.isPrimary) {
      // Clear old primary
      const existing = await db.parentContacts.where('studentId').equals(contact.studentId).toArray();
      for (const c of existing) {
        if (c.id !== id && c.isPrimary) {
          await db.parentContacts.update(c.id, { isPrimary: false, updatedAt: nowISO });
        }
      }
    }

    const fullContact: ParentContact = {
      id,
      studentId: contact.studentId,
      fullName: contact.fullName,
      relation: contact.relation,
      phone: contact.phone,
      email: contact.email,
      zalo: contact.zalo,
      occupation: contact.occupation,
      isPrimary: contact.isPrimary,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.parentContacts.put(fullContact);
    return fullContact;
  }

  /**
   * Ghi Nhật ký Trao đổi Phụ huynh
   */
  async addParentInteraction(input: Omit<ParentInteraction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<ParentInteraction> {
    const nowISO = new Date().toISOString();
    const interaction: ParentInteraction = {
      id: crypto.randomUUID(),
      ...input,
      status: input.status || 'Pending',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };
    await db.parentInteractions.add(interaction);
    return interaction;
  }

  /**
   * Tổng hợp Dòng thời gian Timeline Toàn diện cho Học sinh
   */
  async getStudentTimeline(studentId: string, classId: string): Promise<TimelineEventItem[]> {
    const events: TimelineEventItem[] = [];

    // 1. Student Notes
    const notes = await db.studentNotes
      .where('studentId')
      .equals(studentId)
      .filter((n) => !n.deletedAt)
      .toArray();

    notes.forEach((n) => {
      const isSensitive = n.category === 'SucKhoe' || n.category === 'HoanCanh';
      events.push({
        id: n.id,
        type: 'Note',
        date: n.recordedAt || n.createdAt.substring(0, 10),
        title: `Ghi chú (${this.getCategoryLabel(n.category)})`,
        description: n.content,
        badgeText: n.category,
        badgeVariant: isSensitive ? 'warning' : 'primary',
        isPinned: n.isPinned,
        isSensitive,
      });
    });

    // 2. Parent Interactions
    const interactions = await db.parentInteractions
      .where('studentId')
      .equals(studentId)
      .filter((i) => !i.deletedAt)
      .toArray();

    interactions.forEach((i) => {
      events.push({
        id: i.id,
        type: 'Interaction',
        date: i.interactionDate,
        title: `Liên hệ Phụ huynh (${i.method})`,
        description: `${i.topic}: ${i.content} ${i.result ? `(Kết quả: ${i.result})` : ''}`,
        badgeText: i.status === 'Resolved' ? 'Đã xử lý' : 'Chờ theo dõi',
        badgeVariant: i.status === 'Resolved' ? 'success' : 'warning',
      });
    });

    // 3. Merit Point Entries
    const merits = await db.pointEntries
      .where('studentId')
      .equals(studentId)
      .filter((p) => !p.deletedAt && p.classId === classId)
      .toArray();

    merits.forEach((p) => {
      events.push({
        id: p.id,
        type: 'Merit',
        date: p.occurredAt,
        title: `Điểm thi đua (${p.points > 0 ? '+' : ''}${p.points} đ)`,
        description: p.reason || 'Khen thưởng / Nề nếp',
        badgeText: p.points > 0 ? `+${p.points}` : `${p.points}`,
        badgeVariant: p.points > 0 ? 'success' : 'danger',
      });
    });

    // Sort timeline chronologically (Newest first)
    events.sort((a, b) => b.date.localeCompare(a.date));

    return events;
  }

  getCategoryLabel(category: StudentNoteCategory): string {
    const map: Record<StudentNoteCategory, string> = {
      HocTap: 'Học tập',
      KyLuat: 'Nề nếp',
      NangLuc: 'Năng lực',
      PhamChat: 'Phẩm chất',
      SucKhoe: 'Sức khỏe',
      HoanCanh: 'Hoàn cảnh',
      Khac: 'Khác',
    };
    return map[category] || category;
  }
}

export const studentProfileService = new StudentProfileService();

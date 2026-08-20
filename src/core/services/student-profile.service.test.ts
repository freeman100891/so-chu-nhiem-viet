import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { studentProfileService } from './student-profile.service';
import { studentService } from './student.service';

describe('Student Profile & Privacy Service Tests', () => {
  beforeEach(async () => {
    await db.studentNotes.clear();
    await db.parentContacts.clear();
    await db.parentInteractions.clear();
    await db.pointEntries.clear();
    await db.students.clear();
  });

  it('1. Should add student note and toggle pin to top of list', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Nguyễn Văn Nam',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId,
    });

    const note1 = await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'HocTap',
      content: 'Bản ghi chú 1',
      isPinned: false,
    });

    const note2 = await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'KyLuat',
      content: 'Bản ghi chú quan trọng',
      isPinned: true,
    });

    const notes = await studentProfileService.getStudentNotes(student.id);
    expect(notes.length).toBe(2);
    // Pinned note2 must be first in list
    expect(notes[0]?.id).toBe(note2.id);

    // Toggle pin on note1
    await studentProfileService.togglePinNote(note1.id);
    const updatedNotes = await studentProfileService.getStudentNotes(student.id);
    expect(updatedNotes.find((n) => n.id === note1.id)?.isPinned).toBe(true);
  });

  it('2. Should filter out sensitive notes (SucKhoe & HoanCanh) for public display', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Lê Thị Mai',
      gender: 'Nữ',
      dateOfBirth: '2008-02-02',
      classId,
    });

    await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'HocTap',
      content: 'Học tập xuất sắc',
    });

    await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'SucKhoe',
      content: 'Bị cận thị nặng (Dữ liệu sức khỏe riêng tư)',
    });

    await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'HoanCanh',
      content: 'Gia đình hộ nghèo (Gia cảnh riêng tư)',
    });

    const allNotes = await studentProfileService.getStudentNotes(student.id);
    expect(allNotes.length).toBe(3);

    const publicNotes = studentProfileService.filterPublicNotes(allNotes);
    expect(publicNotes.length).toBe(1);
    expect(publicNotes[0]?.category).toBe('HocTap');
  });

  it('3. Should save multiple parent contacts and clear old primary contact when new primary is set', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Trần Văn Đức',
      gender: 'Nam',
      dateOfBirth: '2008-03-03',
      classId,
    });

    const father = await studentProfileService.saveParentContact({
      studentId: student.id,
      fullName: 'Trần Văn Thành',
      relation: 'Cha',
      phone: '0912345678',
      isPrimary: true,
    });

    expect(father.isPrimary).toBe(true);

    const mother = await studentProfileService.saveParentContact({
      studentId: student.id,
      fullName: 'Nguyễn Thị Hoa',
      relation: 'Mẹ',
      phone: '0987654321',
      isPrimary: true, // Should clear father's isPrimary
    });

    expect(mother.isPrimary).toBe(true);

    const fatherUpdated = await db.parentContacts.get(father.id);
    expect(fatherUpdated?.isPrimary).toBe(false);
  });

  it('4. Should record parent interaction and generate combined timeline chronologically', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Phạm Thị Thảo',
      gender: 'Nữ',
      dateOfBirth: '2008-04-04',
      classId,
    });

    await studentProfileService.addStudentNote({
      classId,
      studentId: student.id,
      category: 'HocTap',
      content: 'Tiến bộ vượt bậc môn Toán',
      recordedAt: '2026-08-10',
    });

    await studentProfileService.addParentInteraction({
      classId,
      studentId: student.id,
      interactionDate: '2026-08-14',
      method: 'GoiDien',
      topic: 'Trao đổi kết quả học tập',
      content: 'Phụ huynh nhất trí động viên học sinh',
    });

    const timeline = await studentProfileService.getStudentTimeline(student.id, classId);
    expect(timeline.length).toBe(2);
    // Newest date 2026-08-14 (Interaction) should be first
    expect(timeline[0]?.date).toBe('2026-08-14');
    expect(timeline[1]?.date).toBe('2026-08-10');
  });
});

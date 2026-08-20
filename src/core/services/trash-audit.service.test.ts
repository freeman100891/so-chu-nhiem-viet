import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { trashService } from './trash.service';
import { storageHealthService } from './storage-health.service';
import { studentService } from './student.service';

describe('Trash, Audit & Storage Health Tests', () => {
  beforeEach(async () => {
    await db.classes.clear();
    await db.students.clear();
    await db.studentNotes.clear();
    await db.auditLogs.clear();
    await db.backupHistory.clear();
  });

  it('1. Should restore soft-deleted student and clear deletedAt timestamp', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Phan Văn Nam',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId,
    });

    // Soft delete student
    await studentService.softDeleteStudent(student.id);
    let trashItems = await trashService.getTrashItems();
    expect(trashItems.length).toBe(1);

    // Restore student
    await trashService.restoreItem('student', student.id);
    const restored = await db.students.get(student.id);
    expect(restored?.deletedAt).toBeNull();

    trashItems = await trashService.getTrashItems();
    expect(trashItems.length).toBe(0);
  });

  it('2. Should hard delete soft-deleted student permanently from database', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Trần Văn Xóa',
      gender: 'Nam',
      dateOfBirth: '2008-02-02',
      classId,
    });

    await studentService.softDeleteStudent(student.id);
    await trashService.hardDeleteItem('student', student.id);

    const inDb = await db.students.get(student.id);
    expect(inDb).toBeUndefined();
  });

  it('3. Should run Database Health Check accurately without mutating data', async () => {
    const classId = 'cls-10a1';
    await studentService.createStudent({
      fullName: 'Nguyễn Thị H',
      gender: 'Nữ',
      dateOfBirth: '2008-03-03',
      classId,
    });

    const health = await storageHealthService.checkHealth();
    expect(health.status).toBe('healthy');
    expect(health.version).toBe(14);
    expect(health.totalRecords).toBeGreaterThan(0);
    expect(health.tableCounts['students']).toBe(1);

    // Verify data remains untouched
    const countAfter = await db.students.count();
    expect(countAfter).toBe(1);
  });

  it('4. Should trigger backup reminder when no backup history exists', async () => {
    const reminder = await storageHealthService.checkBackupReminder();
    expect(reminder.shouldRemind).toBe(true);
    expect(reminder.daysSince).toBeNull();
  });

  it('5. Should bulk restore multiple items at once', async () => {
    const s1 = await studentService.createStudent({
      fullName: 'Học sinh 1',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId: 'cls-10a1',
    });
    const s2 = await studentService.createStudent({
      fullName: 'Học sinh 2',
      gender: 'Nữ',
      dateOfBirth: '2008-02-02',
      classId: 'cls-10a1',
    });

    await studentService.softDeleteStudents([s1.student.id, s2.student.id]);
    expect((await trashService.getTrashItems()).length).toBe(2);

    const res = await trashService.restoreItems([
      { type: 'student', id: s1.student.id },
      { type: 'student', id: s2.student.id },
    ]);
    expect(res.successCount).toBe(2);
    expect((await trashService.getTrashItems()).length).toBe(0);
  });

  it('6. Should bulk hard delete multiple items permanently at once', async () => {
    const s1 = await studentService.createStudent({
      fullName: 'Học sinh Xóa 1',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId: 'cls-10a1',
    });
    const s2 = await studentService.createStudent({
      fullName: 'Học sinh Xóa 2',
      gender: 'Nữ',
      dateOfBirth: '2008-02-02',
      classId: 'cls-10a1',
    });

    await studentService.softDeleteStudents([s1.student.id, s2.student.id]);
    expect((await trashService.getTrashItems()).length).toBe(2);

    const res = await trashService.hardDeleteItems([
      { type: 'student', id: s1.student.id },
      { type: 'student', id: s2.student.id },
    ]);
    expect(res.successCount).toBe(2);
    expect((await trashService.getTrashItems()).length).toBe(0);
    expect(await db.students.get(s1.student.id)).toBeUndefined();
    expect(await db.students.get(s2.student.id)).toBeUndefined();
  });
});

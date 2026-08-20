import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { conductService } from './conduct.service';
import { studentService } from './student.service';

describe('Conduct & Merit Service Tests', () => {
  beforeEach(async () => {
    await db.pointCategories.clear();
    await db.pointEntries.clear();
    await db.classEnrollments.clear();
    await db.students.clear();
    await db.auditLogs.clear();
  });

  it('1. Should seed 6 default point categories successfully', async () => {
    const categories = await conductService.seedDefaultCategories();
    expect(categories.length).toBe(6);

    const meritCount = categories.filter((c) => c.type === 'Merit').length;
    const demeritCount = categories.filter((c) => c.type === 'Demerit').length;

    expect(meritCount).toBe(4);
    expect(demeritCount).toBe(2);
  });

  it('2. Should record bulk point entries for 5 students in Dexie transaction', async () => {
    const classId = 'cls-10a1';
    const studentIds: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const { student } = await studentService.createStudent({
        fullName: `Học sinh ${i}`,
        gender: 'Nam',
        dateOfBirth: '2008-01-01',
        classId,
      });
      studentIds.push(student.id);
    }

    const categories = await conductService.seedDefaultCategories();
    const meritCat = categories[0]!;

    const entries = await conductService.recordBulkPoints({
      classId,
      studentIds,
      categoryId: meritCat.id,
      points: 10,
      reason: 'Học tập xuất sắc',
    });

    expect(entries.length).toBe(5);

    const countInDb = await db.pointEntries.count();
    expect(countInDb).toBe(5);

    const auditCount = await db.auditLogs.count();
    expect(auditCount).toBeGreaterThan(0);
  });

  it('3. Should calculate dynamic total points accurately without stored static field', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Nguyễn Văn Tiến',
      gender: 'Nam',
      dateOfBirth: '2008-05-05',
      classId,
    });

    const categories = await conductService.seedDefaultCategories();
    const meritCat = categories[0]!;
    const demeritCat = categories[4]!;

    // Initial score = 100
    let total = await conductService.calculateStudentTotalPoints(student.id, classId);
    expect(total).toBe(100);

    // Add +10 points
    await conductService.recordBulkPoints({
      classId,
      studentIds: [student.id],
      categoryId: meritCat.id,
      points: 10,
    });

    total = await conductService.calculateStudentTotalPoints(student.id, classId);
    expect(total).toBe(110);

    // Add -5 points
    await conductService.recordBulkPoints({
      classId,
      studentIds: [student.id],
      categoryId: demeritCat.id,
      points: -5,
    });

    total = await conductService.calculateStudentTotalPoints(student.id, classId);
    expect(total).toBe(105);
  });

  it('4. Should log oldValue and newValue in auditLog when updating point entry', async () => {
    const classId = 'cls-10a1';
    const { student } = await studentService.createStudent({
      fullName: 'Trần Thị B',
      gender: 'Nữ',
      dateOfBirth: '2008-06-06',
      classId,
    });

    const categories = await conductService.seedDefaultCategories();
    const entries = await conductService.recordBulkPoints({
      classId,
      studentIds: [student.id],
      categoryId: categories[0]!.id,
      points: 10,
      reason: 'Lý do ban đầu',
    });

    const entryId = entries[0]!.id;

    // Update entry points from 10 -> 20
    await conductService.updatePointEntry(entryId, 20, 'Lý do đã điều chỉnh');

    const updated = await db.pointEntries.get(entryId);
    expect(updated?.points).toBe(20);
    expect(updated?.reason).toBe('Lý do đã điều chỉnh');

    // Check audit log recorded oldValue and newValue
    const logs = await db.auditLogs.where('recordId').equals(entryId).toArray();
    expect(logs.length).toBeGreaterThan(0);
    const detailLog = logs.find((l) => l.details !== undefined && l.details !== '');
    expect(detailLog).toBeDefined();
    expect(detailLog?.details).toContain('10');
    expect(detailLog?.details).toContain('20');
  });

  it('5. Should determine progress rank accurately based on points', () => {
    const rank1 = conductService.getProgressRank(30);
    expect(rank1.name).toBe('Chiến sĩ Cần mẫn');

    const rank2 = conductService.getProgressRank(75);
    expect(rank2.name).toBe('Chiến sĩ Thi đua');

    const rank3 = conductService.getProgressRank(120);
    expect(rank3.name).toBe('Đội viên Tiên phong');

    const rank4 = conductService.getProgressRank(180);
    expect(rank4.name).toBe('Gương sáng Lớp học');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { studentService } from './student.service';
import { studentRepository } from '../repositories/student.repository';
import { enrollmentRepository } from '../repositories/enrollment.repository';

describe('Student Service Tests', () => {
  beforeEach(async () => {
    await db.students.clear();
    await db.classEnrollments.clear();
    await db.classes.clear();
    await db.auditLogs.clear();
  });

  it('1. Should auto-generate stable student code HS20260001', async () => {
    const code = await studentService.generateStudentCode();
    expect(code).toMatch(/^HS\d{8}$/);
  });

  it('2. Should create student with active enrollment in Dexie transaction', async () => {
    const res = await studentService.createStudent({
      fullName: 'Nguyễn Văn An',
      gender: 'Nam',
      dateOfBirth: '2008-05-15',
      classId: 'cls-10a1',
      rollNumber: 1,
    });

    expect(res.student.id).toBeDefined();
    expect(res.student.normalizedName).toBe('nguyen van an');
    expect(res.student.studentCode).toMatch(/^HS\d{8}$/);
    expect(res.enrollment.classId).toBe('cls-10a1');
    expect(res.enrollment.status).toBe('Active');
  });

  it('3. Should search students by accentless Vietnamese text', async () => {
    await studentService.createStudent({
      fullName: 'Trần Thị Thu Thảo',
      gender: 'Nữ',
      dateOfBirth: '2008-03-20',
      classId: 'cls-10a1',
    });

    const searchResults = await studentRepository.searchByName('thu thao');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0]?.fullName).toBe('Trần Thị Thu Thảo');
  });

  it('4. Should transfer student to a new class and preserve old enrollment history', async () => {
    const { student } = await studentService.createStudent({
      fullName: 'Lê Hoàng Nam',
      gender: 'Nam',
      dateOfBirth: '2008-01-10',
      classId: 'cls-10a1',
      rollNumber: 5,
    });

    // Transfer student to 10A2
    const newEnrollment = await studentService.transferStudent(
      student.id,
      'cls-10a1',
      'cls-10a2',
      12
    );

    expect(newEnrollment.classId).toBe('cls-10a2');
    expect(newEnrollment.status).toBe('Active');

    // Check old enrollment is closed with status Transferred
    const oldEnrollment = await enrollmentRepository.findEnrollment('cls-10a1', student.id);
    expect(oldEnrollment).toBeUndefined(); // Active enrollment for 10A1 is no longer active

    const allEnrollments = await db.classEnrollments.where('studentId').equals(student.id).toArray();
    expect(allEnrollments.length).toBe(2);

    const transferred = allEnrollments.find((e) => e.classId === 'cls-10a1');
    expect(transferred?.status).toBe('Transferred');
    expect(transferred?.leftAt).toBeDefined();
  });

  it('5. Should soft delete student without purging database records', async () => {
    const { student } = await studentService.createStudent({
      fullName: 'Phạm Minh Đức',
      gender: 'Nam',
      dateOfBirth: '2008-11-11',
      classId: 'cls-10a1',
    });

    const deleted = await studentService.softDeleteStudent(student.id);
    expect(deleted).toBe(true);

    const checkStudent = await db.students.get(student.id);
    expect(checkStudent).toBeDefined();
    expect(checkStudent?.deletedAt).not.toBeNull();
  });

  it('6. Should soft delete multiple students at once', async () => {
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

    const res = await studentService.softDeleteStudents([s1.student.id, s2.student.id]);
    expect(res.successCount).toBe(2);

    const check1 = await db.students.get(s1.student.id);
    const check2 = await db.students.get(s2.student.id);
    expect(check1?.deletedAt).not.toBeNull();
    expect(check2?.deletedAt).not.toBeNull();
  });
});

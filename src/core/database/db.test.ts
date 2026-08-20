import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { studentRepository } from '../repositories/student.repository';
import { enrollmentRepository } from '../repositories/enrollment.repository';
import { attendanceSessionRepository } from '../repositories/attendance.repository';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';

describe('Full 18 Tables IndexedDB & Repositories Tests', () => {
  beforeEach(async () => {
    await db.students.clear();
    await db.classes.clear();
    await db.academicYears.clear();
    await db.classEnrollments.clear();
    await db.attendanceSessions.clear();
    await db.attendanceRecords.clear();
    await db.auditLogs.clear();
  });

  it('1. Should initialize database with 40 tables and check health status', async () => {
    const health = await db.checkDatabaseHealth();
    expect(health.status).toBe('healthy');
    expect(Object.keys(health.tableCounts).length).toBe(40);
    expect(health.version).toBe(14);
  });

  it('2. Should normalize Vietnamese text for student search without accents', () => {
    expect(normalizeVietnameseText('Nguyễn Văn An')).toBe('nguyen van an');
    expect(normalizeVietnameseText('Đặng THỊ BÍCH')).toBe('dang thi bich');
  });

  it('3. Should create student and auto-compute normalizedName for accentless search', async () => {
    await studentRepository.create({
      studentCode: 'HS1001',
      fullName: 'Trần Thị Bích Ngọc',
      gender: 'Nữ',
      dateOfBirth: '2008-03-20',
    });

    const searchResult1 = await studentRepository.searchByName('bich ngoc');
    expect(searchResult1.length).toBe(1);
    expect(searchResult1[0]?.fullName).toBe('Trần Thị Bích Ngọc');

    const searchResult2 = await studentRepository.searchByName('tran thi');
    expect(searchResult2.length).toBe(1);
  });

  it('4. Should enforce unique constraint on classEnrollments [classId+studentId]', async () => {
    const classId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    await enrollmentRepository.create({
      classId,
      studentId,
      joinedAt: '2024-09-05',
      status: 'Active',
    });

    // Attempting duplicate enrollment should fail due to &[classId+studentId] unique index
    await expect(
      enrollmentRepository.create({
        classId,
        studentId,
        joinedAt: '2024-09-06',
        status: 'Active',
      })
    ).rejects.toThrow();
  });

  it('5. Should enforce unique constraint on attendanceSessions [classId+sessionDate]', async () => {
    const classId = crypto.randomUUID();
    const today = '2026-08-14';

    await attendanceSessionRepository.create({
      classId,
      sessionDate: today,
      status: 'Completed',
    });

    // Attempting duplicate attendance session for same class & date should fail
    await expect(
      attendanceSessionRepository.create({
        classId,
        sessionDate: today,
        status: 'Completed',
      })
    ).rejects.toThrow();
  });

  it('6. Should rollback runTransaction when an internal step fails', async () => {
    const initialCount = await db.classes.count();

    try {
      await db.runTransaction('rw', [db.classes, db.auditLogs], async () => {
        await db.classes.add({
          id: crypto.randomUUID(),
          academicYearId: 'yr-1',
          name: '10A2',
          grade: 10,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });

        // Intentional error to trigger rollback
        throw new Error('Simulated Transaction Failure');
      });
    } catch {
      // Expected exception
    }

    const finalCount = await db.classes.count();
    expect(finalCount).toBe(initialCount); // Proves rollback succeeded
  });
});

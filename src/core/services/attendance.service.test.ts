import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { attendanceService } from './attendance.service';
import { studentService } from './student.service';
import { getTodayDateString } from '../../shared/utilities/date';

describe('Attendance Service Tests', () => {
  beforeEach(async () => {
    await db.attendanceSessions.clear();
    await db.attendanceRecords.clear();
    await db.classEnrollments.clear();
    await db.students.clear();
    await db.classes.clear();
    await db.auditLogs.clear();
  });

  it('1. Should initialize draft session with 100% Present default status without writing to DB', async () => {
    const classId = 'cls-10a1';
    const dateStr = getTodayDateString();

    await studentService.createStudent({
      fullName: 'Nguyễn Văn A',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId,
      rollNumber: 1,
    });

    const initData = await attendanceService.getOrInitializeSession(classId, dateStr);

    expect(initData.isExisting).toBe(false);
    expect(initData.session).toBeNull();
    expect(initData.records.length).toBe(1);
    expect(initData.records[0]?.status).toBe('Present');
    expect(initData.metrics.ratePercent).toBe(100);

    // Verify DB remains empty before saving
    const dbSessions = await db.attendanceSessions.count();
    expect(dbSessions).toBe(0);
  });

  it('2. Should enforce unique constraint on [classId+sessionDate]', async () => {
    const classId = 'cls-10a1';
    const dateStr = getTodayDateString();

    const { student } = await studentService.createStudent({
      fullName: 'Trần Văn B',
      gender: 'Nam',
      dateOfBirth: '2008-02-02',
      classId,
    });

    const records = [
      {
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        status: 'Present' as const,
      },
    ];

    const session1 = await attendanceService.saveSession(classId, dateStr, records, 'Phiên 1');
    expect(session1.id).toBeDefined();

    // Re-saving same class & date updates existing session instead of duplicating
    const session2 = await attendanceService.saveSession(classId, dateStr, records, 'Phiên 2');
    expect(session2.id).toBe(session1.id);

    const count = await db.attendanceSessions.count();
    expect(count).toBe(1);
  });

  it('3. Should calculate attendance metrics percentage correctly', () => {
    const records = [
      { studentId: '1', studentCode: 'S1', fullName: 'A', status: 'Present' as const },
      { studentId: '2', studentCode: 'S2', fullName: 'B', status: 'Late' as const },
      { studentId: '3', studentCode: 'S3', fullName: 'C', status: 'ExcusedAbsence' as const },
      { studentId: '4', studentCode: 'S4', fullName: 'D', status: 'UnexcusedAbsence' as const },
    ];

    const metrics = attendanceService.calculateMetrics(records);
    expect(metrics.total).toBe(4);
    expect(metrics.present).toBe(1);
    expect(metrics.late).toBe(1);
    expect(metrics.excused).toBe(1);
    expect(metrics.unexcused).toBe(1);
    // Attended: 1 Present + 1 Late = 2/4 = 50%
    expect(metrics.ratePercent).toBe(50);
  });

  it('4. Should preserve past attendance records intact when student transfers class later', async () => {
    const classA = 'cls-10a1';
    const classB = 'cls-10a2';
    const dateStr = '2026-08-14';

    const { student } = await studentService.createStudent({
      fullName: 'Lê Văn C',
      gender: 'Nam',
      dateOfBirth: '2008-03-03',
      classId: classA,
    });

    // Save attendance for 10A1
    await attendanceService.saveSession(classA, dateStr, [
      {
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        status: 'Late' as const,
        reason: 'Hỏng xe',
      },
    ]);

    // Student transfers to 10A2
    await studentService.transferStudent(student.id, classA, classB);

    // Verify past attendance session and record for 10A1 is preserved intact
    const pastData = await attendanceService.getOrInitializeSession(classA, dateStr);
    expect(pastData.isExisting).toBe(true);
    expect(pastData.records.length).toBe(1);
    expect(pastData.records[0]?.status).toBe('Late');
    expect(pastData.records[0]?.reason).toBe('Hỏng xe');
  });

  it('5. Should handle end-of-month and end-of-year dates seamlessly without UTC shift', async () => {
    const classId = 'cls-10a1';
    const endOfMonth = '2026-08-31';
    const endOfYear = '2026-12-31';

    const { student } = await studentService.createStudent({
      fullName: 'Hoàng Văn D',
      gender: 'Nam',
      dateOfBirth: '2008-12-31',
      classId,
    });

    const s1 = await attendanceService.saveSession(classId, endOfMonth, [
      { studentId: student.id, studentCode: student.studentCode, fullName: student.fullName, status: 'Present' },
    ]);
    const s2 = await attendanceService.saveSession(classId, endOfYear, [
      { studentId: student.id, studentCode: student.studentCode, fullName: student.fullName, status: 'Present' },
    ]);

    expect(s1.sessionDate).toBe('2026-08-31');
    expect(s2.sessionDate).toBe('2026-12-31');
  });

  it('6. Should correctly synchronize student rosters for multiple distinct classes', async () => {
    const classA = 'cls-10a1';
    const classB = 'cls-10a2';
    const dateStr = getTodayDateString();

    await studentService.createStudent({
      fullName: 'Học sinh Lớp A1',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      classId: classA,
      rollNumber: 1,
    });
    await studentService.createStudent({
      fullName: 'Học sinh Lớp A2',
      gender: 'Nữ',
      dateOfBirth: '2008-02-02',
      classId: classB,
      rollNumber: 1,
    });

    // Session for Class A
    const sessionA = await attendanceService.getOrInitializeSession(classA, dateStr);
    expect(sessionA.records.length).toBe(1);
    expect(sessionA.records[0]?.fullName).toBe('Học sinh Lớp A1');

    // Session for Class B
    const sessionB = await attendanceService.getOrInitializeSession(classB, dateStr);
    expect(sessionB.records.length).toBe(1);
    expect(sessionB.records[0]?.fullName).toBe('Học sinh Lớp A2');
  });
});

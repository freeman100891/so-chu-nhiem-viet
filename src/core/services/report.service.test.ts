import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { reportService } from './report.service';
import { studentService } from './student.service';

describe('Report Service Tests', () => {
  beforeEach(async () => {
    await db.attendanceSessions.clear();
    await db.attendanceRecords.clear();
    await db.classEnrollments.clear();
    await db.students.clear();
    await db.classes.clear();
    await db.parentInteractions.clear();
    await db.backupHistory.clear();
  });

  it('1. Should calculate dashboard overview metrics accurately', async () => {
    const classId = 'cls-10a1';
    await db.classes.add({
      id: classId,
      academicYearId: 'year-2026',
      name: '10A1',
      grade: 10,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    for (let i = 1; i <= 3; i++) {
      await studentService.createStudent({
        fullName: `Học sinh ${i}`,
        gender: 'Nam',
        dateOfBirth: '2008-08-15',
        classId,
      });
    }

    const overview = await reportService.getDashboardOverview(classId);
    expect(overview.totalClassesCount).toBe(1);
    expect(overview.totalStudentsCount).toBe(3);
    expect(overview.daysSinceLastBackup).toBeNull();
  });

  it('2. Should export formatted ExcelJS workbook Blob successfully', async () => {
    const columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã HS', key: 'studentCode', width: 15 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
    ];

    const rows = [
      { stt: 1, studentCode: 'HS20260001', fullName: 'Nguyễn Văn A' },
      { stt: 2, studentCode: 'HS20260002', fullName: 'Trần Thị B' },
    ];

    const blob = await reportService.exportReportToExcel(
      'BÁO CÁO THỬ NGHIỆM TIẾNG VIỆT',
      columns,
      rows,
      { schoolName: 'Trường THPT Nguyễn Trãi', teacherName: 'Thầy Nguyễn Văn C', className: '10A1' }
    );

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toContain('spreadsheetml');
  });
});

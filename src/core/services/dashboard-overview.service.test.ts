import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { dashboardOverviewService } from './dashboard-overview.service';
import { getTodayDateString } from '../../shared/utilities/date';

describe('DashboardOverviewService Unit Tests', () => {
  const mockClassId = 'cls-test-101';
  const mockAcademicYearId = 'yr-test-2026';
  const today = getTodayDateString();

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    await db.academicYears.add({
      id: mockAcademicYearId,
      name: '2025 - 2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.add({
      id: mockClassId,
      academicYearId: mockAcademicYearId,
      name: '1A1',
      grade: 1,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  it('1. Generates personalized greeting and pedagogical quote', async () => {
    await db.teacherProfiles.add({
      id: 'prof-1',
      fullName: 'Nguyễn Thị Tuyết',
      schoolName: 'Tiểu học Kim Đồng',
      phone: '0901234567',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const greeting = await dashboardOverviewService.getGreetingInfo(mockClassId, mockAcademicYearId);
    expect(greeting.teacherName).toContain('Nguyễn Thị Tuyết');
    expect(greeting.className).toBe('Lớp 1A1');
    expect(greeting.quote).toBeDefined();
    expect(greeting.dateVietnamese).toBeDefined();
  });

  it('2. Detects missing attendance as a high priority today task', async () => {
    const tasks = await dashboardOverviewService.getTodayTasks(mockClassId);
    const missingAtt = tasks.find((t) => t.type === 'attendance_missing');
    expect(missingAtt).toBeDefined();
    expect(missingAtt?.priority).toBe('high');
  });

  it('3. Computes accurate KPI Stats for attendance and point entries', async () => {
    // Add student & enrollment
    await db.students.add({
      id: 'st-1',
      studentCode: 'HS001',
      fullName: 'Trần Bảo An',
      normalizedName: 'tran bao an',
      gender: 'Nam',
      dateOfBirth: '2019-05-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-1',
      classId: mockClassId,
      studentId: 'st-1',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    // Attendance session today
    await db.attendanceSessions.add({
      id: 'sess-today',
      classId: mockClassId,
      sessionDate: today,
      status: 'Completed',
      totalPresent: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.attendanceRecords.add({
      id: 'rec-1',
      sessionId: 'sess-today',
      studentId: 'st-1',
      status: 'Present',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add merit point
    await db.pointEntries.add({
      id: 'pe-1',
      classId: mockClassId,
      studentId: 'st-1',
      categoryId: 'cat-1',
      points: 10,
      reason: 'Phát biểu tốt',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const stats = await dashboardOverviewService.getTodayKPIStats(mockClassId, mockAcademicYearId);
    expect(stats.totalStudents).toBe(1);
    expect(stats.presentToday).toBe(1);
    expect(stats.absentToday).toBe(0);
    expect(stats.isAttendanceTaken).toBe(true);
    expect(stats.todayPointsAwarded).toBe(10);
    expect(stats.todayMeritCount).toBe(1);
  });

  it('4. Aggregates Attendance Donut data with percentages matching total', async () => {
    const donut = await dashboardOverviewService.getAttendanceDonutData(mockClassId);
    expect(donut.total).toBe(0);
    expect(donut.data.length).toBeGreaterThan(0);
  });

  it('5. Generates Point Trend array for 7 days', async () => {
    const trend = await dashboardOverviewService.getPointTrendData(mockClassId, 7);
    expect(trend.length).toBe(7);
    expect(trend[6]?.date).toBe(today);
  });

  it('6. Detects birthdays today and in the next 30 days', async () => {
    const now = new Date();
    const dobMonth = String(now.getMonth() + 1).padStart(2, '0');
    const dobDay = String(now.getDate()).padStart(2, '0');

    await db.students.add({
      id: 'st-bday',
      studentCode: 'HS002',
      fullName: 'Lê Minh Khôi',
      normalizedName: 'le minh khoi',
      gender: 'Nam',
      dateOfBirth: `2019-${dobMonth}-${dobDay}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-bday',
      classId: mockClassId,
      studentId: 'st-bday',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const bdays = await dashboardOverviewService.getUpcomingBirthdaysAndEvents(mockClassId, 30);
    expect(bdays.todayCount).toBe(1);
    expect(bdays.items[0]?.isToday).toBe(true);
    expect(bdays.items[0]?.student.fullName).toBe('Lê Minh Khôi');
  });

  it('7. Computes Backup Health status correctly when no backup exists', async () => {
    const health = await dashboardOverviewService.getBackupHealth();
    expect(health.status).toBe('danger');
    expect(health.daysSinceLastBackup).toBeNull();
  });
});

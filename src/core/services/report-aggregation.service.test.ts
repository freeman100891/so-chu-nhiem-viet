import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { reportAggregationService } from './report-aggregation.service';
import { reportComparisonService } from './report-comparison.service';
import { getTodayDateString } from '../../shared/utilities/date';

describe('Report & Visual Analytics Service Unit Tests', () => {
  const mockAcademicYearId = 'yr-rep-2026';
  const mockClass1Id = 'cls-rep-1';
  const mockClass2Id = 'cls-rep-2';
  const today = getTodayDateString();

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    await db.academicYears.add({
      id: mockAcademicYearId,
      name: '2025 - 2026',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.bulkAdd([
      {
        id: mockClass1Id,
        academicYearId: mockAcademicYearId,
        name: '1A1',
        grade: 1,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: mockClass2Id,
        academicYearId: mockAcademicYearId,
        name: '1A2',
        grade: 1,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);

    await db.pointCategories.add({
      id: 'cat-rep-1',
      name: 'Học tập',
      type: 'Merit',
      defaultPoints: 10,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  it('1. Computes comparison date range with identical duration', () => {
    const range = reportAggregationService.getComparisonDateRange('2026-03-10', '2026-03-16'); // 7 days
    expect(range.prevEndDate).toBe('2026-03-09');
    expect(range.prevStartDate).toBe('2026-03-03');
  });

  it('2. Calculates metric delta safely without division by zero', () => {
    const deltaNormal = reportAggregationService.calculateMetricDelta(120, 100);
    expect(deltaNormal.delta).toBe(20);
    expect(deltaNormal.percentChange).toBe(20);

    const deltaFromZero = reportAggregationService.calculateMetricDelta(50, 0);
    expect(deltaFromZero.delta).toBe(50);
    expect(deltaFromZero.percentChange).toBeNull(); // Cleanly null instead of Infinity!
  });

  it('3. Generates full report with accurate KPIs and rule-based insights', async () => {
    // Add student to Class 1
    await db.students.add({
      id: 'st-rep-1',
      studentCode: 'HS201',
      fullName: 'Phạm Gia Bảo',
      normalizedName: 'pham gia bao',
      gender: 'Nam',
      dateOfBirth: '2019-05-05',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-rep-1',
      classId: mockClass1Id,
      studentId: 'st-rep-1',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    // Add Attendance Session & Record
    await db.attendanceSessions.add({
      id: 'ses-rep-1',
      classId: mockClass1Id,
      sessionDate: today,
      termId: 't-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.attendanceRecords.add({
      id: 'rec-rep-1',
      sessionId: 'ses-rep-1',
      studentId: 'st-rep-1',
      status: 'Present',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // Add Point Entry
    await db.pointEntries.add({
      id: 'pe-rep-1',
      classId: mockClass1Id,
      studentId: 'st-rep-1',
      categoryId: 'cat-rep-1',
      points: 40,
      reason: 'Phát biểu tốt',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const report = await reportAggregationService.generateFullReport({
      classId: mockClass1Id,
      academicYearId: mockAcademicYearId,
      startDate: today,
      endDate: today,
      periodType: 'today',
      comparePreviousPeriod: false,
    });

    expect(report.className).toBe('Lớp 1A1');
    expect(report.kpis.activeStudentsCount.current).toBe(1);
    expect(report.kpis.attendanceRate.current).toBe(100);
    expect(report.kpis.meritPoints.current).toBe(40);
    expect(report.kpis.netPoints.current).toBe(40);
    expect(report.attendanceTrend.length).toBe(1);
    expect(report.insights.length).toBeGreaterThan(0);
  });

  it('4. Compares multiple classes accurately', async () => {
    // Add student in class 1
    await db.students.add({
      id: 'st-c1',
      studentCode: 'HS-C1',
      fullName: 'Học sinh C1',
      normalizedName: 'hoc sinh c1',
      gender: 'Nữ',
      dateOfBirth: '2019-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-c1',
      classId: mockClass1Id,
      studentId: 'st-c1',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const comp = await reportComparisonService.compareClasses(
      [mockClass1Id, mockClass2Id],
      mockAcademicYearId,
      today,
      today
    );

    expect(comp.classes.length).toBe(2);
    expect(comp.classes[0]?.className).toBe('Lớp 1A1');
    expect(comp.classes[0]?.totalStudents).toBe(1);
    expect(comp.classes[1]?.className).toBe('Lớp 1A2');
    expect(comp.classes[1]?.totalStudents).toBe(0);
  });
});

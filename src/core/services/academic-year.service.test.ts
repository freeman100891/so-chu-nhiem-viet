import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { academicYearService } from './academic-year.service';
import { termService } from './term.service';
import type { AcademicYear } from '../database/types';

describe('AcademicYear & Term Application Services Tests', () => {
  beforeEach(async () => {
    await db.academicYears.clear();
    await db.terms.clear();
    await db.auditLogs.clear();
  });

  it('should validate academic year startDate < endDate', () => {
    expect(() =>
      academicYearService.validateAcademicYear({
        name: '2026 - 2027',
        startDate: '2027-05-31',
        endDate: '2026-09-05',
      })
    ).toThrow('Ngày kết thúc năm học phải lớn hơn ngày bắt đầu');
  });

  it('should create academic year and set as current year', async () => {
    const year = await academicYearService.createAcademicYear({
      name: '2026 - 2027',
      startDate: '2026-09-05',
      endDate: '2027-05-31',
      isActive: true,
    });

    expect(year.id).toBeDefined();
    expect(year.isActive).toBe(true);

    const current = await db.academicYears.filter((y) => y.isActive).first();
    expect(current?.id).toBe(year.id);
  });

  it('should validate term ranges within academic year without overlap', () => {
    const year: AcademicYear = {
      id: 'yr-1',
      name: '2026 - 2027',
      startDate: '2026-09-05',
      endDate: '2027-05-31',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    };

    // Valid terms
    expect(() =>
      termService.validateTermsForAcademicYear(year, [
        { name: 'Học kỳ 1', startDate: '2026-09-05', endDate: '2027-01-15' },
        { name: 'Học kỳ 2', startDate: '2027-01-16', endDate: '2027-05-31' },
      ])
    ).not.toThrow();

    // Overlapping terms
    expect(() =>
      termService.validateTermsForAcademicYear(year, [
        { name: 'Học kỳ 1', startDate: '2026-09-05', endDate: '2027-01-20' },
        { name: 'Học kỳ 2', startDate: '2027-01-15', endDate: '2027-05-31' },
      ])
    ).toThrow('chồng lấn nhau');

    // Term outside academic year
    expect(() =>
      termService.validateTermsForAcademicYear(year, [
        { name: 'Học kỳ 1', startDate: '2026-08-01', endDate: '2027-01-15' },
        { name: 'Học kỳ 2', startDate: '2027-01-16', endDate: '2027-05-31' },
      ])
    ).toThrow('phải nằm trong khoảng thời gian của năm học');
  });

  it('should create terms and automatically determine current term based on date', async () => {
    const year = await academicYearService.createAcademicYear({
      name: '2026 - 2027',
      startDate: '2026-09-05',
      endDate: '2027-05-31',
      isActive: true,
    });

    await termService.createTermsForAcademicYear(year.id, [
      { name: 'Học kỳ 1', startDate: '2026-09-05', endDate: '2027-01-15' },
      { name: 'Học kỳ 2', startDate: '2027-01-16', endDate: '2027-05-31' },
    ]);

    const activeTerm = await termService.getCurrentTermForYear(year.id);
    // Local date 2026-08-14 is before 2026-09-05, so activeTerm should be null (outside term dates)
    expect(activeTerm).toBeNull();
  });
});

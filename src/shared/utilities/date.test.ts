import { describe, it, expect } from 'vitest';
import { getTodayDateString, formatDateVietnamese, isValidDateString } from './date';

describe('Date Utility Tests', () => {
  it('should format getTodayDateString in YYYY-MM-DD local format', () => {
    const testDate = new Date(2026, 7, 14); // August 14, 2026 local
    const str = getTodayDateString(testDate);
    expect(str).toBe('2026-08-14');
  });

  it('should format YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDateVietnamese('2026-08-14')).toBe('14/08/2026');
    expect(formatDateVietnamese('2024-01-01')).toBe('01/01/2024');
    expect(formatDateVietnamese(null)).toBe('---');
  });

  it('should validate YYYY-MM-DD strings accurately', () => {
    expect(isValidDateString('2026-08-14')).toBe(true);
    expect(isValidDateString('2026/08/14')).toBe(false);
    expect(isValidDateString('14-08-2026')).toBe(false);
    expect(isValidDateString('invalid')).toBe(false);
  });
});

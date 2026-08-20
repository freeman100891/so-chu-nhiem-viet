import { describe, it, expect } from 'vitest';
import { evaluationProfileService } from './evaluation-profile.service';

describe('EvaluationProfileService Tests', () => {
  it('1. Should resolve TT27_2020_PRIMARY for grades 1 through 5', () => {
    expect(evaluationProfileService.resolveProfile(1)).toBe('TT27_2020_PRIMARY');
    expect(evaluationProfileService.resolveProfile(3)).toBe('TT27_2020_PRIMARY');
    expect(evaluationProfileService.resolveProfile(5)).toBe('TT27_2020_PRIMARY');
  });

  it('2. Should resolve TT22_2021_LOWER_SECONDARY for grades 6 through 9', () => {
    expect(evaluationProfileService.resolveProfile(6)).toBe('TT22_2021_LOWER_SECONDARY');
    expect(evaluationProfileService.resolveProfile(7)).toBe('TT22_2021_LOWER_SECONDARY');
    expect(evaluationProfileService.resolveProfile(9)).toBe('TT22_2021_LOWER_SECONDARY');
  });

  it('3. Should resolve TT22_2021_UPPER_SECONDARY for grades 10 through 12', () => {
    expect(evaluationProfileService.resolveProfile(10)).toBe('TT22_2021_UPPER_SECONDARY');
    expect(evaluationProfileService.resolveProfile(11)).toBe('TT22_2021_UPPER_SECONDARY');
    expect(evaluationProfileService.resolveProfile(12)).toBe('TT22_2021_UPPER_SECONDARY');
  });

  it('4. Should throw error for null, undefined or invalid grades', () => {
    expect(() => evaluationProfileService.resolveProfile(null)).toThrow();
    expect(() => evaluationProfileService.resolveProfile(undefined)).toThrow();
    expect(() => evaluationProfileService.resolveProfile(0)).toThrow();
    expect(() => evaluationProfileService.resolveProfile(13)).toThrow();
  });

  it('5. Should provide 4 evaluation periods for Primary (TT27) and 3 for Secondary (TT22)', () => {
    const primaryPeriods = evaluationProfileService.getEvaluationPeriods('TT27_2020_PRIMARY');
    expect(primaryPeriods.length).toBe(4);
    expect(primaryPeriods.map((p) => p.code)).toEqual(['MID_TERM_1', 'END_TERM_1', 'MID_TERM_2', 'END_YEAR']);

    const secondaryPeriods = evaluationProfileService.getEvaluationPeriods('TT22_2021_LOWER_SECONDARY');
    expect(secondaryPeriods.length).toBe(3);
    expect(secondaryPeriods.map((p) => p.code)).toEqual(['TERM_1', 'TERM_2', 'FULL_YEAR']);
  });

  it('6. Should return exactly 5 TT27 Qualities, 3 General Capacities, and 7 Specific Capacities', () => {
    const qualities = evaluationProfileService.getTT27Qualities();
    expect(qualities.length).toBe(5);
    expect(qualities.map((q) => q.code)).toEqual([
      'YEU_NUOC',
      'NHAN_AI',
      'CHAM_CHI',
      'TRUNG_THUC',
      'TRACH_NHIEM',
    ]);

    const genCapacities = evaluationProfileService.getTT27GeneralCapacities();
    expect(genCapacities.length).toBe(3);
    expect(genCapacities.map((g) => g.code)).toEqual([
      'TU_CHU_TU_HOC',
      'GIAO_TIEP_HOP_TAC',
      'GIAI_QUYET_VAN_DE_SANG_TAO',
    ]);

    const specCapacities = evaluationProfileService.getTT27SpecificCapacities();
    expect(specCapacities.length).toBe(7);
    expect(specCapacities.map((s) => s.code)).toEqual([
      'NGON_NGU',
      'TINH_TOAN',
      'KHOA_HOC',
      'CONG_NGHE',
      'TIN_HOC',
      'THAM_MI',
      'THE_CHAT',
    ]);
  });
});

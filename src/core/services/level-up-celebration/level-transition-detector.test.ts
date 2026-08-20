import { describe, it, expect } from 'vitest';
import { detectLevelTransition } from './level-transition-detector';
import type { Student } from '../../database/types';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../avatar-theme-registry';

describe('LevelTransitionDetector 5-Level Tests', () => {
  const dummyStudent: Student = {
    id: 'st-01',
    studentCode: 'HS001',
    fullName: 'Nguyễn Văn An',
    normalizedName: 'nguyen van an',
    gender: 'Nam',
    dateOfBirth: '2012-05-10',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
    deletedAt: null,
  };

  it('1. Should detect transition from Level 1 to Level 2 when passing 100 points', () => {
    const result = detectLevelTransition({
      previousScore: 95,
      currentScore: 105,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).not.toBeNull();
    expect(result?.fromLevelId).toBe(1);
    expect(result?.toLevelId).toBe(2);
    expect(result?.levelsGained).toBe(1);
    expect(result?.toLevel.levelName).toBe('Tiến bộ');
    expect(result?.toLevel.levelShortLabel).toBe('Cấp 2');
  });

  it('2. Should detect exact threshold match (e.g. exactly 100 points)', () => {
    const result = detectLevelTransition({
      previousScore: 98,
      currentScore: 100,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).not.toBeNull();
    expect(result?.fromLevelId).toBe(1);
    expect(result?.toLevelId).toBe(2);
  });

  it('3. Should return null if points increase but level does not cross threshold', () => {
    const result = detectLevelTransition({
      previousScore: 50,
      currentScore: 80,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).toBeNull();
  });

  it('4. Should detect multi-level jump (e.g. Level 1 -> Level 3)', () => {
    const result = detectLevelTransition({
      previousScore: 50,
      currentScore: 350,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).not.toBeNull();
    expect(result?.fromLevelId).toBe(1);
    expect(result?.toLevelId).toBe(3);
    expect(result?.levelsGained).toBe(2);
    expect(result?.toLevel.levelName).toBe('Bứt phá');
  });

  it('5. Should return null if student is already at max Level 5 and gains more points', () => {
    const result = detectLevelTransition({
      previousScore: 1050,
      currentScore: 1200,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).toBeNull();
  });

  it('6. Should detect DOWN transition when score decreases across threshold', () => {
    const result = detectLevelTransition({
      previousScore: 120,
      currentScore: 80,
      student: dummyStudent,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(result).not.toBeNull();
    expect(result?.direction).toBe('DOWN');
    expect(result?.fromLevelId).toBe(2);
    expect(result?.toLevelId).toBe(1);
    expect(result?.levelsChanged).toBe(1);
    expect(result?.toLevel.levelName).toBe('Khởi đầu');
  });

  it('7. Should fallback safely when globalSettings is null/undefined', () => {
    const result = detectLevelTransition({
      previousScore: 200,
      currentScore: 650,
      student: dummyStudent,
      globalSettings: null,
    });

    expect(result).not.toBeNull();
    expect(result?.direction).toBe('UP');
    expect(result?.fromLevelId).toBe(2);
    expect(result?.toLevelId).toBe(4);
    expect(result?.levelsGained).toBe(2);
  });
});

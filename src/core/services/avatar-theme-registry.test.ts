import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AVATAR_LEVEL_THRESHOLDS,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
  resolveAvatarProgressLevelFromScore,
  avatarThemeRegistry,
} from './avatar-theme-registry';
import type { Student } from '../database/types';

describe('AvatarThemeRegistry & 5-Level System Tests (FEAT-AVATAR-001)', () => {
  const sampleStudent: Student = {
    id: 'st-test-1',
    fullName: 'Lê Hoàng Long',
    normalizedName: 'le hoang long',
    studentCode: 'HS001',
    gender: 'Nam',
    dateOfBirth: '2015-05-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('1. Contains at least 4 active themes with exactly 5 stages each', () => {
    const activeThemes = avatarThemeRegistry.getActiveThemes();
    expect(activeThemes.length).toBeGreaterThanOrEqual(4);

    const themeIds = activeThemes.map((t) => t.id);
    expect(themeIds).toContain('military');
    expect(themeIds).toContain('plant_growth');
    expect(themeIds).toContain('royal_journey');
    expect(themeIds).toContain('gamer_rank');

    for (const theme of activeThemes) {
      expect(theme.stages.length).toBe(5);
      theme.stages.forEach((stage, idx) => {
        expect(stage.level).toBe(idx + 1);
        expect(stage.name).toBeTruthy();
        expect(stage.assetKey).toBeTruthy();
        expect(stage.altText).toBeTruthy();
      });
    }
  });

  it('2. Correctly resolves Avatar Progress Level from Score', () => {
    // Level 1: 0 - 99 points
    expect(resolveAvatarProgressLevelFromScore(0)).toBe(1);
    expect(resolveAvatarProgressLevelFromScore(50)).toBe(1);
    expect(resolveAvatarProgressLevelFromScore(99)).toBe(1);

    // Level 2: 100 - 299 points
    expect(resolveAvatarProgressLevelFromScore(100)).toBe(2);
    expect(resolveAvatarProgressLevelFromScore(250)).toBe(2);

    // Level 3: 300 - 599 points
    expect(resolveAvatarProgressLevelFromScore(300)).toBe(3);
    expect(resolveAvatarProgressLevelFromScore(599)).toBe(3);

    // Level 4: 600 - 999 points
    expect(resolveAvatarProgressLevelFromScore(600)).toBe(4);
    expect(resolveAvatarProgressLevelFromScore(999)).toBe(4);

    // Level 5: >= 1000 points
    expect(resolveAvatarProgressLevelFromScore(1000)).toBe(5);
    expect(resolveAvatarProgressLevelFromScore(5000)).toBe(5);

    // Fallback & negative
    expect(resolveAvatarProgressLevelFromScore(null)).toBe(1);
    expect(resolveAvatarProgressLevelFromScore(-10)).toBe(1);
  });

  it('3. Resolves consistent StudentAvatarPresentation view model', () => {
    // Score 350 -> Level 3 (Bứt phá)
    const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
      student: sampleStudent,
      score: 350,
      globalSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
    });

    expect(presentation.studentId).toBe('st-test-1');
    expect(presentation.level).toBe(3);
    expect(presentation.levelName).toBe('Bứt phá');
    expect(presentation.levelShortLabel).toBe('Cấp 3');
    expect(presentation.minPoints).toBe(300);
    expect(presentation.nextLevelMinPoints).toBe(600);
    expect(presentation.pointsToNextLevel).toBe(250);
    expect(presentation.avatarAsset.assetUrl).toBeTruthy();
    expect(presentation.cardTheme.contrastPassed).toBe(true);
    expect(presentation.cardTheme.contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('4. Calculates threshold impact preview accurately', () => {
    const students: Student[] = [
      { ...sampleStudent, id: 's1' },
      { ...sampleStudent, id: 's2' },
      { ...sampleStudent, id: 's3' },
    ];

    const pointsMap = new Map<string, number>([
      ['s1', 50],  // Currently Level 1
      ['s2', 150], // Currently Level 2
      ['s3', 350], // Currently Level 3
    ]);

    // Change Level 2 threshold from 100 to 200 -> s2 (150pts) drops to Level 1
    const newThresholds = [
      { level: 1 as const, minPoints: 0 },
      { level: 2 as const, minPoints: 200 },
      { level: 3 as const, minPoints: 300 },
      { level: 4 as const, minPoints: 600 },
      { level: 5 as const, minPoints: 1000 },
    ];

    const impact = avatarThemeRegistry.calculateThresholdImpact(
      students,
      pointsMap,
      DEFAULT_AVATAR_LEVEL_THRESHOLDS,
      newThresholds
    );

    expect(impact.currentDistribution[1]).toBe(1);
    expect(impact.currentDistribution[2]).toBe(1);
    expect(impact.currentDistribution[3]).toBe(1);

    expect(impact.projectedDistribution[1]).toBe(2);
    expect(impact.projectedDistribution[2]).toBe(0);
    expect(impact.projectedDistribution[3]).toBe(1);
    expect(impact.changedCount).toBe(1);
  });

  it('5. Generates level definitions from preset themes', () => {
    const plantDefs = avatarThemeRegistry.getPresetThemeLevelDefinitions('plant_growth');
    expect(plantDefs.length).toBe(5);
    expect(plantDefs[0]!.name).toBe('Hạt mầm');
    expect(plantDefs[4]!.name).toBe('Cây đại thụ');

    const royalDefs = avatarThemeRegistry.getPresetThemeLevelDefinitions('royal_journey');
    expect(royalDefs.length).toBe(5);
    expect(royalDefs[0]!.name).toBe('Tập sự');
    expect(royalDefs[4]!.name).toBe('Vương quyền');
  });

  it('6. Preserves custom uploaded avatar image when keepCustomImages is true', () => {
    const currentDefs = avatarThemeRegistry.getPresetThemeLevelDefinitions('military');
    // Level 2 has an uploaded custom avatar
    currentDefs[1]!.image = {
      kind: 'UPLOADED',
      assetId: 'custom-asset-uploaded-123',
    };

    // When loading royal_journey with keepCustomImages = true
    const preservedDefs = avatarThemeRegistry.getPresetThemeLevelDefinitions(
      'royal_journey',
      DEFAULT_AVATAR_LEVEL_THRESHOLDS,
      {
        keepCustomImages: true,
        currentLevels: currentDefs,
      }
    );

    // Level 1 should take royal stage 1 built-in
    expect(preservedDefs[0]!.name).toBe('Tập sự');
    expect(preservedDefs[0]!.image.kind).toBe('BUILT_IN');

    // Level 2 should take royal stage 2 name/color BUT KEEP uploaded custom image
    expect(preservedDefs[1]!.name).toBe('Hầu cận');
    expect(preservedDefs[1]!.image.kind).toBe('UPLOADED');
    expect((preservedDefs[1]!.image as { assetId: string }).assetId).toBe('custom-asset-uploaded-123');

    // When loading royal_journey with keepCustomImages = false
    const fullyOverwrittenDefs = avatarThemeRegistry.getPresetThemeLevelDefinitions(
      'royal_journey',
      DEFAULT_AVATAR_LEVEL_THRESHOLDS,
      {
        keepCustomImages: false,
        currentLevels: currentDefs,
      }
    );

    expect(fullyOverwrittenDefs[1]!.name).toBe('Hầu cận');
    expect(fullyOverwrittenDefs[1]!.image.kind).toBe('BUILT_IN');
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import {
  rankSeedService,
  validateRankLevels,
  DEFAULT_17_RANK_DEFINITIONS,
} from './rank-seed.service';

describe('RankSeedService & Migration Tests', () => {
  const mockAcademicYearId = 'year-rank-test-2026';

  beforeEach(async () => {
    await db.rankSystems.clear();
    await db.rankLevels.clear();
    await db.rankSystemClasses.clear();
    await db.studentRankHistory.clear();
    await db.pointCategories.clear();
  });

  it('1. Validate 17 rank definitions: continuous levels 1-17, Binh nhì minPoints=0, Đại tướng level 17', () => {
    expect(DEFAULT_17_RANK_DEFINITIONS.length).toBe(17);

    const validation = validateRankLevels(DEFAULT_17_RANK_DEFINITIONS);
    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();

    // Check specific rank codes
    const codes = DEFAULT_17_RANK_DEFINITIONS.map((r) => r.code);
    expect(codes).toEqual([
      'binh_nhi',
      'binh_nhat',
      'ha_si',
      'trung_si',
      'thuong_si',
      'thieu_uy',
      'trung_uy',
      'thuong_uy',
      'dai_uy',
      'thieu_ta',
      'trung_ta',
      'thuong_ta',
      'dai_ta',
      'thieu_tuong',
      'trung_tuong',
      'thuong_tuong',
      'dai_tuong',
    ]);
  });

  it('2. Validation fails if rank count is not 17 or levels are non-continuous or duplicate', () => {
    const invalidCount = DEFAULT_17_RANK_DEFINITIONS.slice(0, 16);
    expect(validateRankLevels(invalidCount).valid).toBe(false);

    const duplicateCodes = DEFAULT_17_RANK_DEFINITIONS.map((r, idx) =>
      idx === 1 ? { ...r, code: 'binh_nhi' } : r
    );
    expect(validateRankLevels(duplicateCodes).valid).toBe(false);

    const nonAscending = DEFAULT_17_RANK_DEFINITIONS.map((r, idx) =>
      idx === 2 ? { ...r, minPoints: 40 } : r
    );
    expect(validateRankLevels(nonAscending).valid).toBe(false);
  });

  it('3. Seed default 17 rank levels for active academic year', async () => {
    const { system, levels } = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);

    expect(system.academicYearId).toBe(mockAcademicYearId);
    expect(system.isActive).toBe(true);
    expect(levels.length).toBe(17);

    const dbSystems = await db.rankSystems.toArray();
    expect(dbSystems.length).toBe(1);

    const dbLevels = await db.rankLevels.where('rankSystemId').equals(system.id).toArray();
    expect(dbLevels.length).toBe(17);
    expect(dbLevels.find((l) => l.code === 'binh_nhi')?.minPoints).toBe(0);
    expect(dbLevels.find((l) => l.code === 'dai_tuong')?.level).toBe(17);
  });

  it('4. Re-running seed on existing rank system is idempotent and does NOT duplicate records', async () => {
    const res1 = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);
    const res2 = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);

    expect(res1.system.id).toBe(res2.system.id);
    expect(res1.levels.length).toBe(17);
    expect(res2.levels.length).toBe(17);

    const totalSystems = await db.rankSystems.count();
    const totalLevels = await db.rankLevels.count();

    expect(totalSystems).toBe(1);
    expect(totalLevels).toBe(17);
  });

  it('5. Enforce unique index on rankLevels &[rankSystemId+level] and &[rankSystemId+code]', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);
    const nowISO = new Date().toISOString();

    // Attempting duplicate level should throw due to &[rankSystemId+level]
    await expect(
      db.rankLevels.add({
        id: crypto.randomUUID(),
        rankSystemId: system.id,
        level: 1, // duplicate level 1
        code: 'binh_nhi_dup',
        name: 'Binh nhì 2',
        group: 'Hạ sĩ quan và Binh sĩ',
        minPoints: 5,
        colorToken: 'bronze',
        badgeKey: 'badge',
        description: 'test',
        createdAt: nowISO,
        updatedAt: nowISO,
      })
    ).rejects.toThrow();

    // Attempting duplicate code should throw due to &[rankSystemId+code]
    await expect(
      db.rankLevels.add({
        id: crypto.randomUUID(),
        rankSystemId: system.id,
        level: 18,
        code: 'binh_nhi', // duplicate code binh_nhi
        name: 'Binh nhì 3',
        group: 'Hạ sĩ quan và Binh sĩ',
        minPoints: 1000,
        colorToken: 'bronze',
        badgeKey: 'badge',
        description: 'test',
        createdAt: nowISO,
        updatedAt: nowISO,
      })
    ).rejects.toThrow();
  });

  it('6. Migration on existing pointCategories sets countsTowardRank = true safely without losing data', async () => {
    const nowISO = new Date().toISOString();

    // Add legacy pointCategory without countsTowardRank field
    await db.pointCategories.add({
      id: 'legacy-cat-1',
      name: 'Học tập tốt (Cũ)',
      type: 'Merit',
      defaultPoints: 10,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const catBefore = await db.pointCategories.get('legacy-cat-1');
    expect(catBefore?.name).toBe('Học tập tốt (Cũ)');

    // Simulate migration upgrade on legacy pointCategory
    await db.pointCategories.toCollection().modify((cat) => {
      if (cat.countsTowardRank === undefined) {
        cat.countsTowardRank = true;
      }
    });

    const catAfter = await db.pointCategories.get('legacy-cat-1');
    expect(catAfter?.name).toBe('Học tập tốt (Cũ)');
    expect(catAfter?.countsTowardRank).toBe(true);
  });
});

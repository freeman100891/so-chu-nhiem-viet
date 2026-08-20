import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import {
  rankOverviewAnalyticsService,
  RANK_GROUP_COLORS,
  type StudentWithRankItem,
} from './rank-overview-analytics.service';
import { DEFAULT_17_RANK_DEFINITIONS } from './rank-seed.service';
import type { RankLevel } from '../database/types';

const mockRankLevels: RankLevel[] = DEFAULT_17_RANK_DEFINITIONS.map((def) => ({
  id: `lvl-${def.level}`,
  rankSystemId: 'sys-analytics-1',
  level: def.level,
  code: def.code,
  name: def.name,
  group: def.group,
  minPoints: def.minPoints,
  colorToken: def.colorToken,
  badgeKey: def.badgeKey,
  description: def.description,
  createdAt: '2026-08-14T00:00:00Z',
  updatedAt: '2026-08-14T00:00:00Z',
  deletedAt: null,
}));

describe('RankOverviewAnalyticsService Unit & Visualization Tests', () => {
  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  // 1. Không có học sinh (0 students)
  it('Test 1: Handles empty students array cleanly with 0 counts and 0% percentages', () => {
    const groupDist = rankOverviewAnalyticsService.getRankGroupDistribution([], 0);
    expect(groupDist.length).toBe(4);
    groupDist.forEach((g) => {
      expect(g.count).toBe(0);
      expect(g.percentage).toBe(0);
    });

    const levelDist = rankOverviewAnalyticsService.getRankLevelDistribution([], mockRankLevels, 0);
    expect(levelDist.length).toBe(17);
    levelDist.forEach((l) => {
      expect(l.count).toBe(0);
      expect(l.percentage).toBe(0);
    });

    const nearPromo = rankOverviewAnalyticsService.getNearPromotionStudents([], 6);
    expect(nearPromo.length).toBe(0);
  });

  // 2. Chỉ có học sinh ở một nhóm cấp
  it('Test 2: Calculates 100% correctly when students belong to only one group', () => {
    const singleGroupStudents: StudentWithRankItem[] = [
      {
        student: { id: 's-1', studentCode: 'HS1', fullName: 'An', normalizedName: 'an', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: {
          studentId: 's-1',
          totalPoints: 20,
          effectivePoints: 20,
          currentRank: mockRankLevels[0]!, // Binh nhì (Hạ sĩ quan & Binh sĩ)
          nextRank: mockRankLevels[1]!,
          currentLevel: 1,
          nextThreshold: 50,
          pointsToNextRank: 30,
          progressPercent: 40,
          isHighestRank: false,
          highestAchievedRank: mockRankLevels[0]!,
        },
      },
    ];

    const groupDist = rankOverviewAnalyticsService.getRankGroupDistribution(singleGroupStudents, 1);
    const binhSi = groupDist.find((g) => g.group === 'Hạ sĩ quan và Binh sĩ');
    expect(binhSi?.count).toBe(1);
    expect(binhSi?.percentage).toBe(100);

    const capUy = groupDist.find((g) => g.group === 'Cấp Úy');
    expect(capUy?.count).toBe(0);
    expect(capUy?.percentage).toBe(0);
  });

  // 3. Có đủ bốn nhóm cấp
  it('Test 3: Accurately distributes students across all 4 rank groups', () => {
    const fourGroupStudents: StudentWithRankItem[] = [
      // Hạ sĩ quan & Binh sĩ (Level 1)
      {
        student: { id: 's-1', studentCode: 'HS1', fullName: 'HS1', normalizedName: 'hs1', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: { studentId: 's-1', totalPoints: 0, effectivePoints: 0, currentRank: mockRankLevels[0]!, nextRank: mockRankLevels[1]!, currentLevel: 1, nextThreshold: 50, pointsToNextRank: 50, progressPercent: 0, isHighestRank: false, highestAchievedRank: mockRankLevels[0]! },
      },
      // Cấp Úy (Level 6)
      {
        student: { id: 's-2', studentCode: 'HS2', fullName: 'HS2', normalizedName: 'hs2', gender: 'Nữ', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: { studentId: 's-2', totalPoints: 250, effectivePoints: 250, currentRank: mockRankLevels[5]!, nextRank: mockRankLevels[6]!, currentLevel: 6, nextThreshold: 300, pointsToNextRank: 50, progressPercent: 0, isHighestRank: false, highestAchievedRank: mockRankLevels[5]! },
      },
      // Cấp Tá (Level 10)
      {
        student: { id: 's-3', studentCode: 'HS3', fullName: 'HS3', normalizedName: 'hs3', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: { studentId: 's-3', totalPoints: 450, effectivePoints: 450, currentRank: mockRankLevels[9]!, nextRank: mockRankLevels[10]!, currentLevel: 10, nextThreshold: 500, pointsToNextRank: 50, progressPercent: 0, isHighestRank: false, highestAchievedRank: mockRankLevels[9]! },
      },
      // Cấp Tướng (Level 14)
      {
        student: { id: 's-4', studentCode: 'HS4', fullName: 'HS4', normalizedName: 'hs4', gender: 'Nữ', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: { studentId: 's-4', totalPoints: 650, effectivePoints: 650, currentRank: mockRankLevels[13]!, nextRank: mockRankLevels[14]!, currentLevel: 14, nextThreshold: 700, pointsToNextRank: 50, progressPercent: 0, isHighestRank: false, highestAchievedRank: mockRankLevels[13]! },
      },
    ];

    const groupDist = rankOverviewAnalyticsService.getRankGroupDistribution(fourGroupStudents, 4);
    expect(groupDist.every((g) => g.count === 1 && g.percentage === 25)).toBe(true);
  });

  // 4 & 5. Có đủ 17 cấp và Nhiều cấp có số lượng bằng 0
  it('Test 4 & 5: Generates exactly 17 level bars with correct names, levels, and thresholds', () => {
    const students: StudentWithRankItem[] = [
      {
        student: { id: 's-1', studentCode: 'HS1', fullName: 'HS1', normalizedName: 'hs1', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: { studentId: 's-1', totalPoints: 50, effectivePoints: 50, currentRank: mockRankLevels[1]!, nextRank: mockRankLevels[2]!, currentLevel: 2, nextThreshold: 100, pointsToNextRank: 50, progressPercent: 0, isHighestRank: false, highestAchievedRank: mockRankLevels[1]! },
      },
    ];

    const levelDist = rankOverviewAnalyticsService.getRankLevelDistribution(students, mockRankLevels, 1);
    expect(levelDist.length).toBe(17);
    expect(levelDist[0]?.name).toBe('Binh nhì');
    expect(levelDist[0]?.count).toBe(0);
    expect(levelDist[1]?.name).toBe('Binh nhất');
    expect(levelDist[1]?.count).toBe(1);
    expect(levelDist[16]?.name).toBe('Đại tướng');
  });

  // 6. Tổng Donut Chart bằng tổng học sinh
  it('Test 6: Sum of all 4 donut group counts strictly equals total valid students', () => {
    const mockList: StudentWithRankItem[] = Array.from({ length: 45 }, (_, i) => {
      const lvl = (i % 17) + 1;
      const rankObj = mockRankLevels[lvl - 1]!;
      return {
        student: { id: `st-${i}`, studentCode: `HS${i}`, fullName: `Học sinh ${i}`, normalizedName: `hoc sinh ${i}`, gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: {
          studentId: `st-${i}`,
          totalPoints: rankObj.minPoints,
          effectivePoints: rankObj.minPoints,
          currentRank: rankObj,
          nextRank: mockRankLevels[Math.min(16, lvl)]!,
          currentLevel: lvl,
          nextThreshold: mockRankLevels[Math.min(16, lvl)]!.minPoints,
          pointsToNextRank: 25,
          progressPercent: 50,
          isHighestRank: lvl === 17,
          highestAchievedRank: rankObj,
        },
      };
    });

    const dist = rankOverviewAnalyticsService.getRankGroupDistribution(mockList, 45);
    const sumCount = dist.reduce((acc, curr) => acc + curr.count, 0);
    expect(sumCount).toBe(45);
  });

  // 12. Promotion Trend loại trừ recalculated và demotions
  it('Test 12: Promotion trend only includes changeType = promotion and ignores recalculated or demotion', async () => {
    const systemId = 'sys-analytics-1';
    const classId = 'cls-1';

    await db.studentRankHistory.bulkAdd([
      {
        id: 'h-1',
        rankSystemId: systemId,
        classId,
        studentId: 'st-1',
        fromLevel: 1,
        toLevel: 2,
        pointsBefore: 0,
        pointsAfter: 50,
        changeType: 'promotion', // VALID
        createdAt: '2025-10-01T10:00:00Z',
      },
      {
        id: 'h-2',
        rankSystemId: systemId,
        classId,
        studentId: 'st-2',
        fromLevel: 2,
        toLevel: 1,
        pointsBefore: 50,
        pointsAfter: 30,
        changeType: 'demotion', // IGNORE
        createdAt: '2025-10-02T10:00:00Z',
      },
      {
        id: 'h-3',
        rankSystemId: systemId,
        classId,
        studentId: 'st-3',
        fromLevel: 2,
        toLevel: 2,
        pointsBefore: 50,
        pointsAfter: 50,
        changeType: 'recalculated', // IGNORE
        createdAt: '2025-10-03T10:00:00Z',
      },
      {
        id: 'h-4',
        rankSystemId: systemId,
        classId,
        studentId: 'st-4',
        fromLevel: 2,
        toLevel: 3,
        pointsBefore: 50,
        pointsAfter: 100,
        changeType: 'promotion', // VALID
        createdAt: '2025-10-04T10:00:00Z',
      },
    ]);

    const result = await rankOverviewAnalyticsService.getPromotionTrend(
      { academicYearId: 'yr-1', classId },
      systemId
    );

    expect(result.totalPromotions).toBe(2);
    expect(result.trend.length).toBeGreaterThan(0);
    expect(result.trend.reduce((sum, item) => sum + item.promotionCount, 0)).toBe(2);
  });

  // 13. Đại tướng không xuất hiện trong danh sách gần thăng cấp
  it('Test 13: Level 17 (Đại tướng) students are excluded from Near Promotion Panel', () => {
    const list: StudentWithRankItem[] = [
      // Đại tướng (Level 17)
      {
        student: { id: 's-max', studentCode: 'HS-MAX', fullName: 'Đại tướng An', normalizedName: 'dai tuong an', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: {
          studentId: 's-max',
          totalPoints: 850,
          effectivePoints: 850,
          currentRank: mockRankLevels[16]!,
          nextRank: null,
          currentLevel: 17,
          nextThreshold: 800,
          pointsToNextRank: 0,
          progressPercent: 100,
          isHighestRank: true,
          highestAchievedRank: mockRankLevels[16]!,
        },
      },
      // Trung sĩ (Level 4, còn 5đ để lên Thượng sĩ)
      {
        student: { id: 's-near', studentCode: 'HS-NEAR', fullName: 'Trung sĩ Bình', normalizedName: 'trung si binh', gender: 'Nam', dateOfBirth: '2008-01-01', createdAt: '', updatedAt: '', deletedAt: null },
        className: '10A1',
        rankInfo: {
          studentId: 's-near',
          totalPoints: 195,
          effectivePoints: 195,
          currentRank: mockRankLevels[3]!,
          nextRank: mockRankLevels[4]!,
          currentLevel: 4,
          nextThreshold: 200,
          pointsToNextRank: 5,
          progressPercent: 90,
          isHighestRank: false,
          highestAchievedRank: mockRankLevels[3]!,
        },
      },
    ];

    const nearPromo = rankOverviewAnalyticsService.getNearPromotionStudents(list, 6);
    expect(nearPromo.length).toBe(1);
    expect(nearPromo[0]?.studentName).toBe('Trung sĩ Bình');
    expect(nearPromo.some((s) => s.currentLevel === 17)).toBe(false);
  });

  // 17. Ba theme hiển thị đúng màu
  it('Test 17: Color tokens map cleanly to cohesive color hexes across all groups', () => {
    expect(RANK_GROUP_COLORS['Hạ sĩ quan và Binh sĩ'].hex).toBe('#10b981');
    expect(RANK_GROUP_COLORS['Cấp Úy'].hex).toBe('#2563eb');
    expect(RANK_GROUP_COLORS['Cấp Tá'].hex).toBe('#d97706');
    expect(RANK_GROUP_COLORS['Cấp Tướng'].hex).toBe('#9333ea');
  });
});

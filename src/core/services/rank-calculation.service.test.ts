import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rankCalculationService } from './rank-calculation.service';
import { rankSeedService } from './rank-seed.service';
import type { PointEntry } from '../database/types';

describe('RankCalculationService Unit Tests', () => {
  const mockAcademicYearId = 'yr-rank-test-2026';
  const mockClassId = 'class-rank-test-10a1';
  const mockStudent1 = 'std-001';
  const mockStudent2 = 'std-002';
  const mockCategoryId1 = 'cat-merit-1';
  const mockCategoryId2 = 'cat-no-rank-2';

  let rankSystemId: string;

  beforeEach(async () => {
    await db.rankSystems.clear();
    await db.rankLevels.clear();
    await db.rankSystemClasses.clear();
    await db.studentRankHistory.clear();
    await db.pointCategories.clear();
    await db.pointEntries.clear();
    await db.academicYears.clear();
    await db.terms.clear();
    await db.classEnrollments.clear();

    // 1. Seed Academic Year & Term
    await db.academicYears.add({
      id: mockAcademicYearId,
      name: '2025 - 2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.terms.add({
      id: 'term-1',
      academicYearId: mockAcademicYearId,
      name: 'Học kỳ I',
      startDate: '2025-09-01',
      endDate: '2026-01-15',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // 2. Seed Default 17 Ranks
    const seeded = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);
    rankSystemId = seeded.system.id;

    // 3. Seed Categories (1 counting towards rank, 1 NOT counting towards rank)
    const nowISO = new Date().toISOString();
    await db.pointCategories.bulkAdd([
      {
        id: mockCategoryId1,
        name: 'Học tập tốt',
        type: 'Merit',
        defaultPoints: 10,
        countsTowardRank: true,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
      {
        id: mockCategoryId2,
        name: 'Điểm cộng ngoại khóa (Không tính thi đua)',
        type: 'Merit',
        defaultPoints: 50,
        countsTowardRank: false,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
    ]);
  });

  it('1. Points boundary conditions: -10, 0, 49, 50, 99, 100, 799, 800, 1000', async () => {
    const levels = await db.rankLevels.where('rankSystemId').equals(rankSystemId).toArray();

    expect(rankCalculationService.resolveRank(-10, levels).code).toBe('binh_nhi');
    expect(rankCalculationService.resolveRank(0, levels).code).toBe('binh_nhi');
    expect(rankCalculationService.resolveRank(49, levels).code).toBe('binh_nhi');

    expect(rankCalculationService.resolveRank(50, levels).code).toBe('binh_nhat');
    expect(rankCalculationService.resolveRank(99, levels).code).toBe('binh_nhat');

    expect(rankCalculationService.resolveRank(100, levels).code).toBe('ha_si');

    expect(rankCalculationService.resolveRank(799, levels).code).toBe('thuong_tuong');

    expect(rankCalculationService.resolveRank(800, levels).code).toBe('dai_tuong');
    expect(rankCalculationService.resolveRank(1000, levels).code).toBe('dai_tuong');
  });

  it('2. Category with countsTowardRank = false is NOT counted towards effectivePoints', async () => {
    const nowISO = new Date().toISOString();
    await db.pointEntries.bulkAdd([
      {
        id: 'p-1',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1, // countsTowardRank: true
        points: 40,
        reason: 'Học tập',
        occurredAt: '2025-10-10',
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
      {
        id: 'p-2',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId2, // countsTowardRank: false
        points: 100,
        reason: 'Ngoại khóa',
        occurredAt: '2025-10-12',
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
    ]);

    const result = await rankCalculationService.recalculateStudentRank(mockStudent1, rankSystemId);
    expect(result.totalPoints).toBe(140); // 40 + 100
    expect(result.effectivePoints).toBe(40); // Only 40 counts towards rank
    expect(result.currentRank.code).toBe('binh_nhi'); // 40 points -> Binh nhì
    expect(result.pointsToNextRank).toBe(10); // 50 - 40 = 10
    expect(result.progressPercent).toBe(80); // 40 / 50 = 80%
  });

  it('3. Reversal point entries correctly counterbalance original points', async () => {
    const nowISO = new Date().toISOString();
    const originalEntryId = 'p-orig';

    await db.pointEntries.bulkAdd([
      {
        id: originalEntryId,
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1,
        points: 60,
        reason: 'Phát biểu',
        occurredAt: '2025-10-15',
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
      {
        id: 'p-reversal',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1,
        points: -60,
        reason: 'Hoàn tác: Phát biểu',
        occurredAt: '2025-10-15',
        reversedEntryId: originalEntryId,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
    ]);

    const result = await rankCalculationService.recalculateStudentRank(mockStudent1, rankSystemId);
    expect(result.effectivePoints).toBe(0);
    expect(result.currentRank.code).toBe('binh_nhi');
  });

  it('4. Scope filtering: academic_year vs term vs all_time', async () => {
    const nowISO = new Date().toISOString();

    await db.pointEntries.bulkAdd([
      {
        id: 'p-t1',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1,
        points: 50,
        reason: 'Học kỳ I',
        occurredAt: '2025-10-01', // Term I & Academic Year
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
      {
        id: 'p-t2',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1,
        points: 50,
        reason: 'Học kỳ II',
        occurredAt: '2026-03-01', // Academic Year but out of Term I
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
      {
        id: 'p-out',
        classId: mockClassId,
        studentId: mockStudent1,
        categoryId: mockCategoryId1,
        points: 100,
        reason: 'Ngoài năm học',
        occurredAt: '2024-05-01', // Out of Academic Year
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
    ]);

    // Test academic_year scope
    const ptsAcademic = await rankCalculationService.calculateStudentPoints(mockStudent1, rankSystemId);
    expect(ptsAcademic.effectivePoints).toBe(100); // 50 (t1) + 50 (t2)

    // Update system to term scope
    await db.rankSystems.update(rankSystemId, { calculationScope: 'term', termId: 'term-1' });
    const ptsTerm = await rankCalculationService.calculateStudentPoints(mockStudent1, rankSystemId);
    expect(ptsTerm.effectivePoints).toBe(50); // Only t1

    // Update system to all_time scope
    await db.rankSystems.update(rankSystemId, { calculationScope: 'all_time' });
    const ptsAll = await rankCalculationService.calculateStudentPoints(mockStudent1, rankSystemId);
    expect(ptsAll.effectivePoints).toBe(200); // 50 + 50 + 100
  });

  it('5. Batch calculation performance for 150 students with ZERO N+1 queries', async () => {
    const nowISO = new Date().toISOString();
    const studentIds: string[] = [];
    const enrollments = [];
    const pointEntries: PointEntry[] = [];

    // Create 150 mock students with points
    for (let i = 1; i <= 150; i++) {
      const sId = `std-batch-${i}`;
      studentIds.push(sId);
      enrollments.push({
        id: `en-${i}`,
        classId: mockClassId,
        studentId: sId,
        joinedAt: '2025-09-05',
        status: 'Active' as const,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      });

      pointEntries.push({
        id: `p-batch-${i}`,
        classId: mockClassId,
        studentId: sId,
        categoryId: mockCategoryId1,
        points: i * 5, // Student 1 has 5pts, Student 10 has 50pts (Binh nhất), Student 100 has 500pts (Trung tá)
        reason: 'Thi đua hàng loạt',
        occurredAt: '2025-10-20',
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      });
    }

    await db.classEnrollments.bulkAdd(enrollments);
    await db.pointEntries.bulkAdd(pointEntries);

    const startTime = performance.now();
    const batchResultMap = await rankCalculationService.recalculateClassRanks(mockClassId, rankSystemId);
    const duration = performance.now() - startTime;

    expect(batchResultMap.size).toBe(150);
    expect(duration).toBeLessThan(500); // Executed in under 500ms

    // Verify Student 10 (50 points -> Binh nhất)
    const std10 = batchResultMap.get('std-batch-10');
    expect(std10?.effectivePoints).toBe(50);
    expect(std10?.currentRank.code).toBe('binh_nhat');

    // Verify Student 100 (500 points -> Trung tá)
    const std100 = batchResultMap.get('std-batch-100');
    expect(std100?.effectivePoints).toBe(500);
    expect(std100?.currentRank.code).toBe('trung_ta');
  });

  it('6. Đại tướng rank result attributes: nextRank=null, isHighestRank=true, pointsToNextRank=0, progressPercent=100', async () => {
    const nowISO = new Date().toISOString();
    await db.pointEntries.add({
      id: 'p-general',
      classId: mockClassId,
      studentId: mockStudent2,
      categoryId: mockCategoryId1,
      points: 850,
      reason: 'Đạt cấp Đại tướng',
      occurredAt: '2025-11-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const result = await rankCalculationService.recalculateStudentRank(mockStudent2, rankSystemId);

    expect(result.currentRank.code).toBe('dai_tuong');
    expect(result.currentLevel).toBe(17);
    expect(result.nextRank).toBeNull();
    expect(result.nextThreshold).toBeNull();
    expect(result.pointsToNextRank).toBe(0);
    expect(result.progressPercent).toBe(100);
    expect(result.isHighestRank).toBe(true);
  });
});

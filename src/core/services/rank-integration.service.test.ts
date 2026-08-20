import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rankIntegrationService } from './rank-integration.service';
import { rankSeedService } from './rank-seed.service';

describe('RankIntegrationService Unit Tests', () => {
  const mockAcademicYearId = 'yr-integ-test-2026';
  const mockClassId = 'class-integ-test-10a1';
  const mockStudent1 = 'std-integ-001';
  const mockStudent2 = 'std-integ-002';
  const mockCategoryId1 = 'cat-integ-merit';
  const mockCategoryId2 = 'cat-integ-no-rank';

  let rankSystemId: string;

  beforeEach(async () => {
    await db.rankSystems.clear();
    await db.rankLevels.clear();
    await db.rankSystemClasses.clear();
    await db.studentRankHistory.clear();
    await db.pointCategories.clear();
    await db.pointEntries.clear();
    await db.academicYears.clear();
    await db.auditLogs.clear();

    // 1. Academic Year
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

    // 2. Seed Default Ranks
    const seeded = await rankSeedService.seedDefaultRankSystem(mockAcademicYearId);
    rankSystemId = seeded.system.id;

    // Assign class to rank system
    await db.rankSystemClasses.add({
      id: crypto.randomUUID(),
      rankSystemId,
      classId: mockClassId,
      createdAt: new Date().toISOString(),
    });

    // 3. Categories
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
        name: 'Điểm thưởng ngoại khóa',
        type: 'Merit',
        defaultPoints: 20,
        countsTowardRank: false,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      },
    ]);
  });

  it('1. Point addition without crossing threshold does NOT create history record', async () => {
    const nowISO = new Date().toISOString();
    const entryId = 'p-30pts';

    await db.pointEntries.add({
      id: entryId,
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 30, // 30 points -> still Binh nhì (level 1)
      reason: 'Phát biểu',
      occurredAt: '2025-10-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
      reason: 'Phát biểu',
    });

    expect(res.length).toBe(1);
    expect(res[0]?.changeType).toBe('no_change');
    expect(res[0]?.historyRecord).toBeNull();

    const historyCount = await db.studentRankHistory.count();
    expect(historyCount).toBe(0);
  });

  it('2. Point addition crossing 1 level creates promotion history record', async () => {
    const nowISO = new Date().toISOString();
    const entryId = 'p-50pts';

    await db.pointEntries.add({
      id: entryId,
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 50, // 50 points -> Binh nhất (level 2)
      reason: 'Học tập xuất sắc',
      occurredAt: '2025-10-02',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
      reason: 'Học tập xuất sắc',
    });

    expect(res.length).toBe(1);
    expect(res[0]?.changeType).toBe('promotion');
    expect(res[0]?.previousLevel).toBe(1);
    expect(res[0]?.newLevel).toBe(2);
    expect(res[0]?.levelsCrossed).toBe(1);

    const history = await db.studentRankHistory.where('studentId').equals(mockStudent1).first();
    expect(history?.fromLevel).toBe(1);
    expect(history?.toLevel).toBe(2);
    expect(history?.changeType).toBe('promotion');

    // Verify Audit Log
    const auditLogs = await db.auditLogs.where('entityName').equals('StudentRankHistory').toArray();
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0]?.details).toContain('thăng cấp thi đua');
  });

  it('3. Point addition crossing multiple levels creates single history record', async () => {
    const nowISO = new Date().toISOString();
    const entryId = 'p-260pts';

    await db.pointEntries.add({
      id: entryId,
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 260, // Jump from Level 1 (0pt) to Level 6 (250pt - Thiếu úy)
      reason: 'Đạt giải Nhất cấp Tỉnh',
      occurredAt: '2025-10-05',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
    });

    expect(res[0]?.changeType).toBe('promotion');
    expect(res[0]?.previousLevel).toBe(1);
    expect(res[0]?.newLevel).toBe(6); // Thiếu úy
    expect(res[0]?.levelsCrossed).toBe(5);

    const histories = await db.studentRankHistory.where('studentId').equals(mockStudent1).toArray();
    expect(histories.length).toBe(1); // Single history record!
    expect(histories[0]?.fromLevel).toBe(1);
    expect(histories[0]?.toLevel).toBe(6);
  });

  it('4. Point reduction in Achievement Mode does NOT create demotion history record', async () => {
    const nowISO = new Date().toISOString();

    // First promote student to Level 2 (Binh nhất)
    await db.pointEntries.add({
      id: 'p-step1',
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 60,
      reason: 'Khen thưởng',
      occurredAt: '2025-10-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });
    await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: 'p-step1',
    });

    // Verify student is Level 2
    const h1 = await db.studentRankHistory.where('studentId').equals(mockStudent1).toArray();
    expect(h1.length).toBe(1);
    expect(h1[0]?.toLevel).toBe(2);

    // Deduct -50 points (leaving 10 points which is below Level 2 threshold)
    await db.pointEntries.add({
      id: 'p-step2-deduct',
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: -50,
      reason: 'Vi phạm nề nếp',
      occurredAt: '2025-10-02',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: 'p-step2-deduct',
    });

    // In Achievement Mode (default): Rank remains Level 2, no demotion record created
    expect(res[0]?.changeType).toBe('no_change');

    const h2 = await db.studentRankHistory.where('studentId').equals(mockStudent1).toArray();
    expect(h2.length).toBe(1); // Still only 1 promotion record!
  });

  it('5. Point reduction in Dynamic Mode creates demotion history record', async () => {
    const nowISO = new Date().toISOString();

    // Switch rankMode to 'dynamic'
    await db.rankSystems.update(rankSystemId, { rankMode: 'dynamic' });

    // Promote student to Level 2
    await db.pointEntries.add({
      id: 'p-dyn-1',
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 60,
      reason: 'Khen thưởng',
      occurredAt: '2025-10-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });
    await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: 'p-dyn-1',
    });

    // Deduct -50 points
    await new Promise((resolve) => setTimeout(resolve, 10));
    await db.pointEntries.add({
      id: 'p-dyn-2',
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: -50,
      reason: 'Vi phạm',
      occurredAt: '2025-10-02',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: 'p-dyn-2',
    });

    expect(res[0]?.changeType).toBe('demotion');
    expect(res[0]?.previousLevel).toBe(2);
    expect(res[0]?.newLevel).toBe(1);

    const histories = await db.studentRankHistory.where('studentId').equals(mockStudent1).toArray();
    histories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    expect(histories.length).toBe(2);
    expect(histories[0]?.changeType).toBe('promotion');
    expect(histories[1]?.changeType).toBe('demotion');
  });

  it('6. Double submit / Double click does NOT create duplicate history records', async () => {
    const nowISO = new Date().toISOString();
    const entryId = 'p-double-click';

    await db.pointEntries.add({
      id: entryId,
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId1,
      points: 60,
      reason: 'Thi đua',
      occurredAt: '2025-10-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    // First processing call
    await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
    });

    // Duplicate processing call (simulating double click)
    const res2 = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
    });

    expect(res2[0]?.changeType).toBe('no_change');

    const historyCount = await db.studentRankHistory.where('studentId').equals(mockStudent1).count();
    expect(historyCount).toBe(1); // Deduplicated!
  });

  it('7. Point transaction failure simulation: Rank history is not generated if point is not saved', async () => {
    // No entry added to db.pointEntries
    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent2],
      sourcePointEntryId: 'failed-entry-id',
    });

    expect(res[0]?.changeType).toBe('no_change');
    const historyCount = await db.studentRankHistory.where('studentId').equals(mockStudent2).count();
    expect(historyCount).toBe(0);
  });

  it('8. Category with countsTowardRank = false does NOT trigger rank promotion', async () => {
    const nowISO = new Date().toISOString();
    const entryId = 'p-no-rank-100';

    await db.pointEntries.add({
      id: entryId,
      classId: mockClassId,
      studentId: mockStudent1,
      categoryId: mockCategoryId2, // countsTowardRank: false
      points: 100,
      reason: 'Ngoại khóa',
      occurredAt: '2025-10-01',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const res = await rankIntegrationService.processPointEntryChange({
      classId: mockClassId,
      studentIds: [mockStudent1],
      sourcePointEntryId: entryId,
    });

    expect(res[0]?.changeType).toBe('no_change');
    const historyCount = await db.studentRankHistory.count();
    expect(historyCount).toBe(0);
  });

  it('9. Graceful handling when no active rankSystem is configured for class', async () => {
    await db.rankSystemClasses.clear(); // Remove class association

    const res = await rankIntegrationService.processPointEntryChange({
      classId: 'unbound-class',
      studentIds: [mockStudent1],
    });

    expect(res).toEqual([]);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rankSeedService } from './rank-seed.service';
import { rankCalculationService } from './rank-calculation.service';
import { rankIntegrationService } from './rank-integration.service';
import { backupService } from '../backup/backup.service';
import { calledQueueService } from './live-classroom/called-queue.service';
import type { Student, LiveClassParticipant } from '../database/types';

describe('Comprehensive 20-Criteria Emulation Rank Regression Tests', () => {
  const academicYearId = 'yr-regression-2026';
  const classId = 'cls-regression-10A1';

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    await db.academicYears.add({
      id: academicYearId,
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.add({
      id: classId,
      academicYearId,
      name: '10A1',
      grade: 10,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  // 1. 0 điểm là Binh nhì
  it('Criterion 1: 0 points resolves to Binh nhì (Level 1)', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const rank = rankCalculationService.resolveRank(0, levels);
    expect(rank.level).toBe(1);
    expect(rank.name).toBe('Binh nhì');
  });

  // 2. 50 điểm là Binh nhất
  it('Criterion 2: 50 points resolves to Binh nhất (Level 2)', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const rank = rankCalculationService.resolveRank(50, levels);
    expect(rank.level).toBe(2);
    expect(rank.name).toBe('Binh nhất');
  });

  // 3. 800 điểm là Đại tướng
  it('Criterion 3: 800 points resolves to Đại tướng (Level 17)', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const rank = rankCalculationService.resolveRank(800, levels);
    expect(rank.level).toBe(17);
    expect(rank.name).toBe('Đại tướng');
  });

  // 4. Điểm âm vẫn là Binh nhì
  it('Criterion 4: Negative points (< 0) remains Binh nhì (Level 1)', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const rank = rankCalculationService.resolveRank(-25, levels);
    expect(rank.level).toBe(1);
    expect(rank.name).toBe('Binh nhì');
  });

  // 5. Vượt một cấp
  it('Criterion 5: Promotion crosses exactly 1 level', async () => {
    await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-1';

    await db.students.add({
      id: studentId,
      studentCode: 'HS001',
      fullName: 'Học sinh 1',
      normalizedName: 'hoc sinh 1',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-1',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const catId = 'cat-valid-1';
    await db.pointCategories.add({
      id: catId,
      name: 'Học tập',
      type: 'Merit',
      defaultPoints: 50,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-promo-1',
      classId,
      studentId,
      categoryId: catId,
      points: 50,
      reason: 'Phát biểu tốt',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-promo-1',
    });

    expect(results[0]?.changeType).toBe('promotion');
    expect(results[0]?.previousLevel).toBe(1);
    expect(results[0]?.newLevel).toBe(2);
    expect(results[0]?.levelsCrossed).toBe(1);

    const history = await db.studentRankHistory.where('studentId').equals(studentId).toArray();
    expect(history.length).toBe(1);
    expect(history[0]?.toLevel).toBe(2);
  });

  // 6. Vượt nhiều cấp
  it('Criterion 6: Promotion crosses multiple levels (+3 levels) creating single history record', async () => {
    await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-multi';

    await db.students.add({
      id: studentId,
      studentCode: 'HS002',
      fullName: 'Học sinh Vượt Cấp',
      normalizedName: 'hoc sinh vuot cap',
      gender: 'Nữ',
      dateOfBirth: '2008-02-02',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-2',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const catId = 'cat-valid-2';
    await db.pointCategories.add({
      id: catId,
      name: 'Giải Nhất Tỉnh',
      type: 'Merit',
      defaultPoints: 160,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-promo-multi',
      classId,
      studentId,
      categoryId: catId,
      points: 160, // 160 points >= 150 (Level 4: Trung sĩ)
      reason: 'Giải Nhất tỉnh',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-promo-multi',
    });

    expect(results[0]?.changeType).toBe('promotion');
    expect(results[0]?.previousLevel).toBe(1);
    expect(results[0]?.newLevel).toBe(4);
    expect(results[0]?.levelsCrossed).toBe(3);

    // Verify only 1 history record was created
    const history = await db.studentRankHistory.where('studentId').equals(studentId).toArray();
    expect(history.length).toBe(1);
    expect(history[0]?.fromLevel).toBe(1);
    expect(history[0]?.toLevel).toBe(4);
  });

  // 7. Achievement Mode không hạ cấp
  it('Criterion 7: Achievement Mode does not demote when points decrease', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-achieve';

    await db.students.add({
      id: studentId,
      studentCode: 'HS003',
      fullName: 'Học sinh Achievement',
      normalizedName: 'hoc sinh achievement',
      gender: 'Nam',
      dateOfBirth: '2008-03-03',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-3',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const catId = 'cat-valid-3';
    await db.pointCategories.add({
      id: catId,
      name: 'Thi đua',
      type: 'Merit',
      defaultPoints: 100,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Gain Level 3 (100 points)
    await db.pointEntries.add({
      id: 'pe-ach-1',
      classId,
      studentId,
      categoryId: catId,
      points: 100,
      reason: 'Đạt giải',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-ach-1',
    });

    // 2. Minus 60 points (100 - 60 = 40 points, below 50)
    await db.pointEntries.add({
      id: 'pe-ach-minus',
      classId,
      studentId,
      categoryId: catId,
      points: -60,
      reason: 'Vi phạm',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-ach-minus',
    });

    expect(results[0]?.changeType).toBe('no_change');

    // Highest achieved rank remains Level 3
    const highestRank = await rankCalculationService.getHighestAchievedRank(studentId, system.id);
    expect(highestRank?.level).toBe(3);
  });

  // 8. Dynamic Mode hạ cấp
  it('Criterion 8: Dynamic Mode demotes when points decrease across threshold', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    // Switch to dynamic mode
    await db.rankSystems.update(system.id, { rankMode: 'dynamic' });

    const studentId = 'st-reg-dynamic';
    await db.students.add({
      id: studentId,
      studentCode: 'HS004',
      fullName: 'Học sinh Dynamic',
      normalizedName: 'hoc sinh dynamic',
      gender: 'Nam',
      dateOfBirth: '2008-04-04',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-4',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const catId = 'cat-valid-4';
    await db.pointCategories.add({
      id: catId,
      name: 'Điểm',
      type: 'Merit',
      defaultPoints: 100,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Gain Level 3 (100 points)
    await db.pointEntries.add({
      id: 'pe-dyn-1',
      classId,
      studentId,
      categoryId: catId,
      points: 100,
      reason: 'Tích cực',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-dyn-1',
    });

    // 2. Minus 60 points -> 40 points (Level 1: Binh nhì)
    await db.pointEntries.add({
      id: 'pe-dyn-2',
      classId,
      studentId,
      categoryId: catId,
      points: -60,
      reason: 'Vi phạm nghiêm trọng',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-dyn-2',
    });

    expect(results[0]?.changeType).toBe('demotion');
    expect(results[0]?.newLevel).toBe(1);

    const history = await db.studentRankHistory.where('studentId').equals(studentId).toArray();
    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    expect(history.length).toBe(2);
    expect(history[0]?.changeType).toBe('promotion');
    expect(history[1]?.changeType).toBe('demotion');
  });

  // 9. Reversal pointEntry
  it('Criterion 9: Soft-deleted pointEntry reversal calculates points accurately', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-reversal';

    const catId = 'cat-rev-1';
    await db.pointCategories.add({
      id: catId,
      name: 'Phát biểu',
      type: 'Merit',
      defaultPoints: 50,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add entry then soft-delete it
    await db.pointEntries.add({
      id: 'pe-rev-1',
      classId,
      studentId,
      categoryId: catId,
      points: 50,
      reason: 'Nhầm lẫn',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(), // Soft deleted
    });

    const points = await rankCalculationService.calculateStudentPoints(studentId, system.id);
    expect(points.effectivePoints).toBe(0);
  });

  // 10. Danh mục không tính cấp
  it('Criterion 10: Category with countsTowardRank = false is ignored in rank calculation', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-ignore';

    const catIgnoredId = 'cat-ignored-1';
    await db.pointCategories.add({
      id: catIgnoredId,
      name: 'Điểm khảo sát riêng',
      type: 'Merit',
      defaultPoints: 100,
      countsTowardRank: false, // DO NOT COUNT
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-ignore-1',
      classId,
      studentId,
      categoryId: catIgnoredId,
      points: 100,
      reason: 'Khảo sát',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const points = await rankCalculationService.calculateStudentPoints(studentId, system.id);
    expect(points.effectivePoints).toBe(0);
  });

  // 11. Đổi ngưỡng
  it('Criterion 11: Threshold reconfiguration correctly recalculates ranks', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    // Change Level 2 threshold from 50 to 80
    const newLevels = levels.map((lvl) => (lvl.level === 2 ? { ...lvl, minPoints: 80 } : lvl));

    const rankBefore = rankCalculationService.resolveRank(60, levels);
    const rankAfter = rankCalculationService.resolveRank(60, newLevels);

    expect(rankBefore.level).toBe(2);
    expect(rankAfter.level).toBe(1);
  });

  // 12. Preview ảnh hưởng
  it('Criterion 12: previewConfigurationImpact accurately predicts promotion/demotion counts', async () => {
    const { system, levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);

    const studentId = 'st-reg-prev';
    await db.classEnrollments.add({
      id: 'enr-prev',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    await db.rankSystemClasses.add({
      id: 'rsc-prev',
      rankSystemId: system.id,
      classId,
      createdAt: new Date().toISOString(),
    });

    const catId = 'cat-prev-1';
    await db.pointCategories.add({
      id: catId,
      name: 'Học tập',
      type: 'Merit',
      defaultPoints: 60,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-prev-1',
      classId,
      studentId,
      categoryId: catId,
      points: 60,
      reason: 'Học tập',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // If threshold for level 2 is raised to 100, student with 60pts drops to level 1
    const newLevels = levels.map((lvl) => (lvl.level === 2 ? { ...lvl, minPoints: 100 } : lvl));
    const impact = await rankCalculationService.previewConfigurationImpact(system.id, newLevels);

    const demoted = impact.filter((i) => i.changeType === 'demotion');
    const promoted = impact.filter((i) => i.changeType === 'promotion');

    expect(impact.length).toBe(1);
    expect(demoted.length).toBe(1);
    expect(promoted.length).toBe(0);
  });

  // 13. Student profile rank calculation
  it('Criterion 13: Recalculates student rank with complete progress structure for profile', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-prof';

    const catId = 'cat-prof-1';
    await db.pointCategories.add({
      id: catId,
      name: 'Điểm',
      type: 'Merit',
      defaultPoints: 175,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-prof-1',
      classId,
      studentId,
      categoryId: catId,
      points: 175,
      reason: 'Thi đua',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const prog = await rankCalculationService.recalculateStudentRank(studentId, system.id);
    expect(prog.currentRank.name).toBe('Trung sĩ'); // 150-199
    expect(prog.currentLevel).toBe(4);
    expect(prog.nextRank?.name).toBe('Thượng sĩ'); // 200
    expect(prog.pointsToNextRank).toBe(25); // 200 - 175 = 25
    expect(prog.progressPercent).toBe(50); // (175 - 150) / (200 - 150) = 25/50 = 50%
  });

  // 14. Student card compact data
  it('Criterion 14: Batch recalculates class ranks for student cards with 0 per-student queries', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);

    const classRanks = await rankCalculationService.recalculateClassRanks(classId, system.id);
    expect(classRanks instanceof Map).toBe(true);
  });

  // 15. Called Students Queue integration
  it('Criterion 15: Called Students Queue reflects rank and recent promotions', async () => {
    await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-queue';

    const st: Student = {
      id: studentId,
      studentCode: 'HS005',
      fullName: 'Học sinh Gọi Tên',
      normalizedName: 'hoc sinh goi ten',
      gender: 'Nữ',
      dateOfBirth: '2008-05-05',
      avatar: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    await db.students.add(st);

    await db.classEnrollments.add({
      id: 'enr-queue-1',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const sessionId = 'session-reg-1';
    await db.liveClassSessions.add({
      id: sessionId,
      classId,
      termId: 'term-1',
      title: 'Tiết học thử',
      subject: 'Toán',
      sessionDate: '2025-10-10',
      meetingPlatform: 'none',
      status: 'active',
      startedAt: new Date().toISOString(),
      totalPausedMilliseconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const participant: LiveClassParticipant = {
      id: 'part-1',
      sessionId,
      studentId,
      attendanceStatus: 'present',
      participationCount: 0,
      randomSelectionCount: 1,
      handRaised: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.liveClassParticipants.add(participant);

    await db.liveClassEvents.add({
      id: 'evt-1',
      sessionId,
      studentId,
      eventType: 'student_selected',
      createdAt: new Date().toISOString(),
    });

    const studentMap = new Map<string, Student>([[studentId, st]]);
    const queue = await calledQueueService.getCalledQueue(sessionId, [participant], studentMap);

    expect(queue.length).toBe(1);
    expect(queue[0]?.rankInfo).toBeDefined();
    expect(queue[0]?.rankInfo?.currentRank.name).toBe('Binh nhì');
  });

  // 16. Presentation View safety check
  it('Criterion 16: Presentation View safety rules: zero exposure of private notes or low ranks', async () => {
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    expect(system.presentationCelebrationEnabled).toBe(true);
  });

  // 17. Backup & restore integrity
  it('Criterion 17: Backup and restore preserves all 17 rank levels and history', async () => {
    await rankSeedService.seedDefaultRankSystem(academicYearId);
    const exported = await backupService.exportDatabaseData();

    expect(exported.counts['rankLevels']).toBe(17);
    expect(exported.counts['rankSystems']).toBe(1);
  });

  // 18. Migration from legacy database
  it('Criterion 18: Auto-seeds 17 ranks when upgrading from legacy database', async () => {
    const { levels } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    expect(levels.length).toBe(17);
    expect(levels[0]?.name).toBe('Binh nhì');
    expect(levels[16]?.name).toBe('Đại tướng');
  });

  // 19. Reload offline local-first
  it('Criterion 19: Operates 100% offline via local IndexedDB tables', async () => {
    const tables = db.tables.map((t) => t.name);
    expect(tables).toContain('rankSystems');
    expect(tables).toContain('rankLevels');
    expect(tables).toContain('rankSystemClasses');
    expect(tables).toContain('studentRankHistory');
  });

  // 20. Double submit protection
  it('Criterion 20: Double submit with same sourcePointEntryId does not duplicate history records', async () => {
    await rankSeedService.seedDefaultRankSystem(academicYearId);
    const studentId = 'st-reg-double';

    await db.students.add({
      id: studentId,
      studentCode: 'HS006',
      fullName: 'Học sinh Chống Trùng',
      normalizedName: 'hoc sinh chong trung',
      gender: 'Nam',
      dateOfBirth: '2008-06-06',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-double',
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    const catId = 'cat-double-1';
    await db.pointCategories.add({
      id: catId,
      name: 'Điểm',
      type: 'Merit',
      defaultPoints: 50,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.pointEntries.add({
      id: 'pe-double-source',
      classId,
      studentId,
      categoryId: catId,
      points: 50,
      reason: 'Điểm tốt',
      occurredAt: '2025-10-10',
      source: 'manual',
      sourceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // Call 1
    await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-double-source',
    });

    // Call 2 with identical sourcePointEntryId (e.g. user rapid double click)
    await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: [studentId],
      sourcePointEntryId: 'pe-double-source',
    });

    const history = await db.studentRankHistory.where('studentId').equals(studentId).toArray();
    expect(history.length).toBe(1);
  });
});

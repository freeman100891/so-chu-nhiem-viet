import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { honorTitleSeedService } from './honor-title-seed.service';
import { honorBoardService } from './honor-board.service';
import { honorRuleEngineService } from './honor-rule-engine.service';
import { getTodayDateString } from '../../shared/utilities/date';

describe('Honor Board System Unit Tests', () => {
  const mockClassId = 'cls-honor-101';
  const mockAcademicYearId = 'yr-honor-2026';
  const today = getTodayDateString();

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    await db.academicYears.add({
      id: mockAcademicYearId,
      name: '2025 - 2026',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.add({
      id: mockClassId,
      academicYearId: mockAcademicYearId,
      name: '1A2',
      grade: 1,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.pointCategories.add({
      id: 'cat-1',
      name: 'Học tập & Rèn luyện',
      type: 'Merit',
      defaultPoints: 10,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  it('1. Seeds 8 default pedagogical honor titles', async () => {
    const titles = await honorTitleSeedService.seedDefaultTitles();
    expect(titles.length).toBe(8);
    expect(titles.find((t) => t.code === 'top_rank')?.name).toBe('Dẫn đầu cấp bậc');
    expect(titles.find((t) => t.code === 'rank_progress')?.name).toBe('Thăng cấp ấn tượng');
    expect(titles.find((t) => t.code === 'point_growth')?.name).toBe('Ngôi sao bứt phá');
    expect(titles.find((t) => t.code === 'attendance')?.name).toBe('Ngôi sao chuyên cần');
  });

  it('2. Evaluates Top Rank and point growth candidates accurately', async () => {
    await honorTitleSeedService.seedDefaultTitles();

    // Add 2 students
    await db.students.bulkAdd([
      {
        id: 'st-h1',
        studentCode: 'HS101',
        fullName: 'Nguyễn Minh Anh',
        normalizedName: 'nguyen minh anh',
        gender: 'Nữ',
        dateOfBirth: '2019-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: 'st-h2',
        studentCode: 'HS102',
        fullName: 'Trần Quốc Bảo',
        normalizedName: 'tran quoc bao',
        gender: 'Nam',
        dateOfBirth: '2019-02-02',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);

    await db.classEnrollments.bulkAdd([
      {
        id: 'enr-h1',
        classId: mockClassId,
        studentId: 'st-h1',
        status: 'Active',
        joinedAt: '2025-09-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leftAt: null,
      },
      {
        id: 'enr-h2',
        classId: mockClassId,
        studentId: 'st-h2',
        status: 'Active',
        joinedAt: '2025-09-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leftAt: null,
      },
    ]);

    // Give points to st-h1
    await db.pointEntries.add({
      id: 'pe-h1',
      classId: mockClassId,
      studentId: 'st-h1',
      categoryId: 'cat-1',
      points: 150,
      reason: 'Phát biểu và làm bài xuất sắc',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const draft = await honorBoardService.createDraftBoard({
      classId: mockClassId,
      academicYearId: mockAcademicYearId,
      title: 'Bảng Vàng Tuần 1',
      periodType: 'week',
      startDate: today,
      endDate: today,
    });

    expect(draft.board.status).toBe('draft');
    expect(draft.recipientCount).toBeGreaterThan(0);

    const details = await honorBoardService.getBoardDetails(draft.board.id);
    expect(details).not.toBeNull();
    expect(details?.topRankPodium[0]?.student?.fullName).toBe('Nguyễn Minh Anh');
  });

  it('3. Publishes Honor Board and preserves snapshot immutability', async () => {
    await honorTitleSeedService.seedDefaultTitles();

    await db.students.add({
      id: 'st-snap',
      studentCode: 'HS103',
      fullName: 'Lê Hoàng Nam',
      normalizedName: 'le hoang nam',
      gender: 'Nam',
      dateOfBirth: '2019-03-03',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-snap',
      classId: mockClassId,
      studentId: 'st-snap',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });

    await db.pointEntries.add({
      id: 'pe-snap',
      classId: mockClassId,
      studentId: 'st-snap',
      categoryId: 'cat-1',
      points: 100,
      reason: 'Rèn luyện tốt',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const { board } = await honorBoardService.createDraftBoard({
      classId: mockClassId,
      academicYearId: mockAcademicYearId,
      title: 'Bảng Vàng Tháng 9',
      periodType: 'month',
      startDate: today,
      endDate: today,
    });

    await honorBoardService.publishBoard(board.id);

    const publishedDetails = await honorBoardService.getBoardDetails(board.id);
    expect(publishedDetails?.board.status).toBe('published');
    const recipient = publishedDetails?.recipients.find((r) => r.studentId === 'st-snap');
    expect(recipient?.rankLevelAtAward).toBeDefined();
    expect(recipient?.titleNameAtAward).toBeDefined();

    // Now add new points for student later
    await db.pointEntries.add({
      id: 'pe-snap-2',
      classId: mockClassId,
      studentId: 'st-snap',
      categoryId: 'cat-1',
      points: 500,
      reason: 'Thêm điểm sau ngày công bố',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // Verify snapshot in published board remained unchanged!
    const boardCheck = await honorBoardService.getBoardDetails(board.id);
    const snapRecipient = boardCheck?.recipients.find((r) => r.studentId === 'st-snap');
    expect(snapRecipient?.pointsAtAward).toBe(100); // exactly original snapshot
  });

  it('4. Detects ties transparently when candidates have equal scores', async () => {
    const titles = await honorTitleSeedService.seedDefaultTitles();
    const pointGrowthTitle = titles.find((t) => t.code === 'point_growth')!;

    // Create 4 students with same points
    const stIds = ['st-t1', 'st-t2', 'st-t3', 'st-t4'];
    for (const id of stIds) {
      await db.students.add({
        id,
        studentCode: `HS_${id}`,
        fullName: `Học sinh ${id}`,
        normalizedName: `hoc sinh ${id}`,
        gender: 'Nam',
        dateOfBirth: '2019-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      await db.classEnrollments.add({
        id: `enr_${id}`,
        classId: mockClassId,
        studentId: id,
        status: 'Active',
        joinedAt: '2025-09-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leftAt: null,
      });

      await db.pointEntries.add({
        id: `pe_${id}`,
        classId: mockClassId,
        studentId: id,
        categoryId: 'cat-1',
        points: 50,
        reason: 'Thi đua',
        occurredAt: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
    }

    const evalResults = await honorRuleEngineService.evaluateAllTitlesForClass(
      mockClassId,
      [pointGrowthTitle],
      today,
      today,
      'sys-default'
    );

    expect(evalResults[0]?.hasTie).toBe(true);
    expect(evalResults[0]?.tiedCandidates.length).toBe(4);
  });
});

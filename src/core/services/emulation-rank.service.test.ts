import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { emulationRankService } from './emulation-rank.service';
import { DEFAULT_EMULATION_RANKS } from '../types/emulation-rank.types';

describe('EmulationRankService - 17 Cấp Bậc Thi Đua', () => {
  const mockStudent1 = 'st-rank-1';
  const mockStudent2 = 'st-rank-2';
  const mockClassId = 'class-rank-101';
  const mockCategoryId = 'cat-rank-1';

  beforeEach(async () => {
    await db.pointEntries.clear();
    await db.students.clear();

    const nowISO = new Date().toISOString();
    await db.students.bulkAdd([
      { id: mockStudent1, studentCode: 'HS101', fullName: 'Lê Văn A', normalizedName: 'le van a', gender: 'Nam', dateOfBirth: '2010-01-01', createdAt: nowISO, updatedAt: nowISO },
      { id: mockStudent2, studentCode: 'HS102', fullName: 'Nguyễn Thị B', normalizedName: 'nguyen thi b', gender: 'Nữ', dateOfBirth: '2010-02-02', createdAt: nowISO, updatedAt: nowISO },
    ]);
  });

  it('1. Verify all 17 default emulation ranks are configured correctly in ascending order', () => {
    expect(DEFAULT_EMULATION_RANKS.length).toBe(17);
    expect(DEFAULT_EMULATION_RANKS[0]?.name).toBe('Binh nhì');
    expect(DEFAULT_EMULATION_RANKS[0]?.minPoints).toBe(0);

    expect(DEFAULT_EMULATION_RANKS[16]?.name).toBe('Đại tướng');
    expect(DEFAULT_EMULATION_RANKS[16]?.minPoints).toBe(800);

    // Verify strict ascending order of minPoints & levels
    for (let i = 1; i < DEFAULT_EMULATION_RANKS.length; i++) {
      expect(DEFAULT_EMULATION_RANKS[i]!.level).toBe(i + 1);
      expect(DEFAULT_EMULATION_RANKS[i]!.minPoints).toBeGreaterThan(DEFAULT_EMULATION_RANKS[i - 1]!.minPoints);
    }
  });

  it('2. Map points accurately to all 17 rank thresholds', () => {
    const testCases = [
      { points: 0, expected: 'Binh nhì' },
      { points: 49, expected: 'Binh nhì' },
      { points: 50, expected: 'Binh nhất' },
      { points: 100, expected: 'Hạ sĩ' },
      { points: 150, expected: 'Trung sĩ' },
      { points: 200, expected: 'Thượng sĩ' },
      { points: 250, expected: 'Thiếu úy' },
      { points: 300, expected: 'Trung úy' },
      { points: 350, expected: 'Thượng úy' },
      { points: 400, expected: 'Đại úy' },
      { points: 450, expected: 'Thiếu tá' },
      { points: 500, expected: 'Trung tá' },
      { points: 550, expected: 'Thượng tá' },
      { points: 600, expected: 'Đại tá' },
      { points: 650, expected: 'Thiếu tướng' },
      { points: 700, expected: 'Trung tướng' },
      { points: 750, expected: 'Thượng tướng' },
      { points: 800, expected: 'Đại tướng' },
      { points: 1200, expected: 'Đại tướng' },
    ];

    testCases.forEach(({ points, expected }) => {
      const rank = emulationRankService.getRankForPoints(points);
      expect(rank.name).toBe(expected);
    });
  });

  it('3. Dynamically calculate points from pointEntries without storing totalPoints in students table', async () => {
    const nowISO = new Date().toISOString();

    // Add point entries for mockStudent1
    await db.pointEntries.bulkAdd([
      { id: 'p1', studentId: mockStudent1, classId: mockClassId, categoryId: mockCategoryId, points: 30, reason: 'Tích cực phát biểu', occurredAt: nowISO, source: 'live_classroom', createdAt: nowISO, updatedAt: nowISO },
      { id: 'p2', studentId: mockStudent1, classId: mockClassId, categoryId: mockCategoryId, points: 25, reason: 'Làm bài tập tốt', occurredAt: nowISO, source: 'live_classroom', createdAt: nowISO, updatedAt: nowISO },
      { id: 'p3', studentId: mockStudent1, classId: mockClassId, categoryId: mockCategoryId, points: -5, reason: 'Nói chuyện riêng', occurredAt: nowISO, source: 'live_classroom', createdAt: nowISO, updatedAt: nowISO },
    ]);

    const points = await emulationRankService.calculateStudentPoints(mockStudent1);
    expect(points).toBe(50); // 30 + 25 - 5 = 50

    const rankInfo = await emulationRankService.getStudentRankInfo(mockStudent1);
    expect(rankInfo.totalPoints).toBe(50);
    expect(rankInfo.currentRank.name).toBe('Binh nhất');
    expect(rankInfo.nextRank?.name).toBe('Hạ sĩ');
    expect(rankInfo.pointsToNextRank).toBe(50); // 100 - 50 = 50
    expect(rankInfo.progressPercent).toBe(0); // (50 - 50) / (100 - 50) = 0%
  });

  it('4. Batch calculate rank info for multiple students correctly', async () => {
    const nowISO = new Date().toISOString();

    await db.pointEntries.bulkAdd([
      { id: 'p1', studentId: mockStudent1, classId: mockClassId, categoryId: mockCategoryId, points: 260, reason: 'Thành tích xuất sắc', occurredAt: nowISO, source: 'live_classroom', createdAt: nowISO, updatedAt: nowISO },
      { id: 'p2', studentId: mockStudent2, classId: mockClassId, categoryId: mockCategoryId, points: 670, reason: 'Thành tích cao nhất', occurredAt: nowISO, source: 'live_classroom', createdAt: nowISO, updatedAt: nowISO },
    ]);

    const batchResult = await emulationRankService.batchGetStudentsRankInfo([mockStudent1, mockStudent2]);

    const st1Rank = batchResult.get(mockStudent1);
    expect(st1Rank?.totalPoints).toBe(260);
    expect(st1Rank?.currentRank.name).toBe('Thiếu úy');

    const st2Rank = batchResult.get(mockStudent2);
    expect(st2Rank?.totalPoints).toBe(670);
    expect(st2Rank?.currentRank.name).toBe('Thiếu tướng');
  });
});

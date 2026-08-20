import { db } from '../database/db';
import type { RankSystem, RankLevel } from '../database/types';
import { rankRepository } from '../repositories/rank.repository';
import { rankHistoryRepository } from '../repositories/rank-history.repository';

export interface RankProgressResult {
  studentId: string;
  totalPoints: number;
  effectivePoints: number;
  currentRank: RankLevel;
  nextRank: RankLevel | null;
  currentLevel: number;
  nextThreshold: number | null;
  pointsToNextRank: number;
  progressPercent: number; // 0 to 100
  isHighestRank: boolean;
  highestAchievedRank: RankLevel;
}

export class RankCalculationService {
  /**
   * Tính toán điểm số cho 1 học sinh theo hệ thống cấp bậc
   */
  async calculateStudentPoints(
    studentId: string,
    rankSystemId: string
  ): Promise<{ totalPoints: number; effectivePoints: number }> {
    const system = await rankRepository.findById(rankSystemId);
    if (!system) return { totalPoints: 0, effectivePoints: 0 };

    let entries = await db.pointEntries
      .where('studentId')
      .equals(studentId)
      .filter((e) => !e.deletedAt)
      .toArray();

    // Filter by scope
    entries = await this.filterEntriesByScope(entries, system);

    // Fetch categories to check countsTowardRank
    const categories = await db.pointCategories.toArray();
    const categoryMap = new Map<string, boolean>();
    categories.forEach((cat) => {
      // If countsTowardRank is undefined, default to true for existing data
      categoryMap.set(cat.id, cat.countsTowardRank !== false);
    });

    let totalPoints = 0;
    let effectivePoints = 0;

    for (const e of entries) {
      totalPoints += e.points;
      const countsToward = categoryMap.get(e.categoryId) ?? true;
      if (countsToward) {
        effectivePoints += e.points;
      }
    }

    return { totalPoints, effectivePoints };
  }

  /**
   * Batch calculate points for all students in a class (ZERO N+1 query)
   */
  async calculateClassPoints(
    classId: string,
    rankSystemId: string
  ): Promise<Map<string, { totalPoints: number; effectivePoints: number }>> {
    const resultMap = new Map<string, { totalPoints: number; effectivePoints: number }>();
    const system = await rankRepository.findById(rankSystemId);
    if (!system) return resultMap;

    // 1. Fetch all class enrollments
    const enrollments = await db.classEnrollments.where('classId').equals(classId).toArray();
    enrollments.forEach((en) => {
      resultMap.set(en.studentId, { totalPoints: 0, effectivePoints: 0 });
    });

    // 2. Batch fetch all point entries for class
    let allEntries = await db.pointEntries
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt)
      .toArray();

    // Filter by scope
    allEntries = await this.filterEntriesByScope(allEntries, system);

    // 3. Batch fetch all categories
    const categories = await db.pointCategories.toArray();
    const categoryMap = new Map<string, boolean>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat.countsTowardRank !== false);
    });

    // 4. Group & calculate in memory
    for (const e of allEntries) {
      const current = resultMap.get(e.studentId) || { totalPoints: 0, effectivePoints: 0 };
      current.totalPoints += e.points;

      const countsToward = categoryMap.get(e.categoryId) ?? true;
      if (countsToward) {
        current.effectivePoints += e.points;
      }

      resultMap.set(e.studentId, current);
    }

    return resultMap;
  }

  /**
   * Ánh xạ điểm số sang đúng cấp bậc (Level 1-17)
   */
  resolveRank(points: number, rankLevels: RankLevel[]): RankLevel {
    const sorted = [...rankLevels].sort((a, b) => a.minPoints - b.minPoints);
    if (sorted.length === 0) {
      throw new Error('Danh sách cấp bậc trống.');
    }

    // Points <= 0 -> lowest rank (level 1)
    if (points <= 0) {
      return sorted[0]!;
    }

    let matchedRank = sorted[0]!;
    for (const rank of sorted) {
      if (points >= rank.minPoints) {
        matchedRank = rank;
      } else {
        break;
      }
    }

    return matchedRank;
  }

  /**
   * Lấy cấp bậc tiếp theo
   */
  getNextRank(currentRank: RankLevel, rankLevels: RankLevel[]): RankLevel | null {
    const sorted = [...rankLevels].sort((a, b) => a.level - b.level);
    const index = sorted.findIndex((r) => r.level === currentRank.level);

    if (index !== -1 && index < sorted.length - 1) {
      return sorted[index + 1]!;
    }

    return null; // Level 17 (Đại tướng) -> no next rank
  }

  /**
   * Tính phần trăm tiến độ và điểm số cần để thăng cấp
   */
  getRankProgress(
    points: number,
    currentRank: RankLevel,
    nextRank: RankLevel | null
  ): {
    pointsToNextRank: number;
    progressPercent: number;
    isHighestRank: boolean;
    nextThreshold: number | null;
  } {
    if (!nextRank) {
      return {
        pointsToNextRank: 0,
        progressPercent: 100,
        isHighestRank: true,
        nextThreshold: null,
      };
    }

    const nextThreshold = nextRank.minPoints;
    const pointsToNextRank = Math.max(0, nextThreshold - points);
    const range = nextThreshold - currentRank.minPoints;
    const gained = points - currentRank.minPoints;

    let progressPercent = 100;
    if (range > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    }

    return {
      pointsToNextRank,
      progressPercent,
      isHighestRank: false,
      nextThreshold,
    };
  }

  /**
   * Truy vấn cấp bậc cao nhất từng đạt được của học sinh
   */
  async getHighestAchievedRank(studentId: string, rankSystemId: string): Promise<RankLevel | null> {
    const highestHistory = await rankHistoryRepository.getHighestAchievedHistory(studentId, rankSystemId);
    if (!highestHistory) return null;

    const levels = await rankRepository.findRankLevels(rankSystemId);
    return levels.find((l) => l.level === highestHistory.toLevel) || null;
  }

  /**
   * Tính toán kết quả cấp bậc hoàn chỉnh cho 1 học sinh
   */
  async recalculateStudentRank(studentId: string, rankSystemId: string): Promise<RankProgressResult> {
    const system = await rankRepository.findById(rankSystemId);
    if (!system) {
      throw new Error(`Không tìm thấy hệ thống cấp bậc với ID ${rankSystemId}`);
    }

    const levels = await rankRepository.findRankLevels(rankSystemId);
    if (levels.length === 0) {
      throw new Error('Hệ thống cấp bậc chưa có dữ liệu cấp độ.');
    }

    const { totalPoints, effectivePoints } = await this.calculateStudentPoints(studentId, rankSystemId);
    const calculatedRank = this.resolveRank(effectivePoints, levels);

    const highestAchievedRank = await this.getHighestAchievedRank(studentId, rankSystemId);

    // Achievement Mode vs Dynamic Mode
    let currentRank = calculatedRank;
    if (system.rankMode === 'achievement' && highestAchievedRank && highestAchievedRank.level > calculatedRank.level) {
      currentRank = highestAchievedRank;
    }

    const highestRank =
      highestAchievedRank && highestAchievedRank.level > currentRank.level
        ? highestAchievedRank
        : currentRank;

    const nextRank = this.getNextRank(currentRank, levels);
    const progress = this.getRankProgress(effectivePoints, currentRank, nextRank);

    return {
      studentId,
      totalPoints,
      effectivePoints,
      currentRank,
      nextRank,
      currentLevel: currentRank.level,
      nextThreshold: progress.nextThreshold,
      pointsToNextRank: progress.pointsToNextRank,
      progressPercent: progress.progressPercent,
      isHighestRank: progress.isHighestRank,
      highestAchievedRank: highestRank,
    };
  }

  /**
   * Batch calculate full rank progress results for all students in a class
   */
  async recalculateClassRanks(
    classId: string,
    rankSystemId: string
  ): Promise<Map<string, RankProgressResult>> {
    const resultMap = new Map<string, RankProgressResult>();
    const system = await rankRepository.findById(rankSystemId);
    if (!system) return resultMap;

    const levels = await rankRepository.findRankLevels(rankSystemId);
    if (levels.length === 0) return resultMap;

    // 1. Batch calculate class points
    const pointsMap = await this.calculateClassPoints(classId, rankSystemId);

    // 2. Batch fetch history for class
    const classHistories = await rankHistoryRepository.getClassHistory(classId, rankSystemId);

    // Build map of highest level achieved per student
    const highestLevelMap = new Map<string, RankLevel>();
    for (const h of classHistories) {
      const existing = highestLevelMap.get(h.studentId);
      if (!existing || h.toLevel > existing.level) {
        const levelObj = levels.find((l) => l.level === h.toLevel);
        if (levelObj) {
          highestLevelMap.set(h.studentId, levelObj);
        }
      }
    }

    // 3. Assemble results in memory for each student
    for (const [studentId, points] of pointsMap.entries()) {
      const calculatedRank = this.resolveRank(points.effectivePoints, levels);
      const highestAchievedRank = highestLevelMap.get(studentId) || null;

      let currentRank = calculatedRank;
      if (system.rankMode === 'achievement' && highestAchievedRank && highestAchievedRank.level > calculatedRank.level) {
        currentRank = highestAchievedRank;
      }

      const highestRank =
        highestAchievedRank && highestAchievedRank.level > currentRank.level
          ? highestAchievedRank
          : currentRank;

      const nextRank = this.getNextRank(currentRank, levels);
      const progress = this.getRankProgress(points.effectivePoints, currentRank, nextRank);

      resultMap.set(studentId, {
        studentId,
        totalPoints: points.totalPoints,
        effectivePoints: points.effectivePoints,
        currentRank,
        nextRank,
        currentLevel: currentRank.level,
        nextThreshold: progress.nextThreshold,
        pointsToNextRank: progress.pointsToNextRank,
        progressPercent: progress.progressPercent,
        isHighestRank: progress.isHighestRank,
        highestAchievedRank: highestRank,
      });
    }

    return resultMap;
  }

  /**
   * Xem trước tác động khi thay đổi ngưỡng/cấu hình cấp bậc
   */
  async previewConfigurationImpact(
    rankSystemId: string,
    newLevels: RankLevel[]
  ): Promise<
    {
      studentId: string;
      oldRankLevel: number;
      newRankLevel: number;
      changeType: 'promotion' | 'demotion' | 'no_change';
    }[]
  > {
    const currentLevels = await rankRepository.findRankLevels(rankSystemId);
    const system = await rankRepository.findById(rankSystemId);
    if (!system) return [];

    // Find all classes bound to this rank system
    const relations = await db.rankSystemClasses.where('rankSystemId').equals(rankSystemId).toArray();
    const impacts: {
      studentId: string;
      oldRankLevel: number;
      newRankLevel: number;
      changeType: 'promotion' | 'demotion' | 'no_change';
    }[] = [];

    for (const rel of relations) {
      const pointsMap = await this.calculateClassPoints(rel.classId, rankSystemId);
      for (const [studentId, points] of pointsMap.entries()) {
        const oldRank = this.resolveRank(points.effectivePoints, currentLevels);
        const newRank = this.resolveRank(points.effectivePoints, newLevels);

        let changeType: 'promotion' | 'demotion' | 'no_change' = 'no_change';
        if (newRank.level > oldRank.level) changeType = 'promotion';
        else if (newRank.level < oldRank.level) changeType = 'demotion';

        impacts.push({
          studentId,
          oldRankLevel: oldRank.level,
          newRankLevel: newRank.level,
          changeType,
        });
      }
    }

    return impacts;
  }

  /**
   * Helper filter entries by scope date ranges
   */
  private async filterEntriesByScope<T extends { occurredAt: string }>(
    entries: T[],
    system: RankSystem
  ): Promise<T[]> {
    if (system.calculationScope === 'academic_year') {
      const year = await db.academicYears.get(system.academicYearId);
      if (year) {
        return entries.filter((e) => e.occurredAt >= year.startDate && e.occurredAt <= year.endDate);
      }
    } else if (system.calculationScope === 'term' && system.termId) {
      const term = await db.terms.get(system.termId);
      if (term) {
        return entries.filter((e) => e.occurredAt >= term.startDate && e.occurredAt <= term.endDate);
      }
    }

    return entries;
  }
}

export const rankCalculationService = new RankCalculationService();

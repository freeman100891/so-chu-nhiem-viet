import { db } from '../database/db';
import {
  DEFAULT_EMULATION_RANKS,
  type EmulationRank,
  type StudentRankInfo,
} from '../types/emulation-rank.types';

class EmulationRankService {
  /**
   * Dynamically calculate total points for a student from pointEntries
   */
  async calculateStudentPoints(studentId: string, classId?: string): Promise<number> {
    if (!studentId) return 0;

    let entries = await db.pointEntries.where('studentId').equals(studentId).toArray();
    entries = entries.filter((e) => !e.deletedAt);

    if (classId) {
      entries = entries.filter((e) => e.classId === classId);
    }

    return entries.reduce((sum, e) => sum + e.points, 0);
  }

  /**
   * Determine rank from total points
   */
  getRankForPoints(points: number, customRanks: EmulationRank[] = DEFAULT_EMULATION_RANKS): EmulationRank {
    const sorted = [...customRanks].sort((a, b) => a.minPoints - b.minPoints);
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
   * Calculate full rank info including progress percent and next rank points
   */
  async getStudentRankInfo(
    studentId: string,
    classId?: string,
    customRanks: EmulationRank[] = DEFAULT_EMULATION_RANKS
  ): Promise<StudentRankInfo> {
    const totalPoints = await this.calculateStudentPoints(studentId, classId);
    const currentRank = this.getRankForPoints(totalPoints, customRanks);

    const sorted = [...customRanks].sort((a, b) => a.level - b.level);
    const currentIndex = sorted.findIndex((r) => r.id === currentRank.id);
    const nextRank = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1]! : null;

    let pointsToNextRank = 0;
    let progressPercent = 100;

    if (nextRank) {
      pointsToNextRank = Math.max(0, nextRank.minPoints - totalPoints);
      const range = nextRank.minPoints - currentRank.minPoints;
      const gainedInRange = totalPoints - currentRank.minPoints;
      progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((gainedInRange / range) * 100))) : 100;
    }

    return {
      studentId,
      totalPoints,
      currentRank,
      nextRank,
      pointsToNextRank,
      progressPercent,
    };
  }

  /**
   * Batch calculate rank info for multiple students efficiently
   */
  async batchGetStudentsRankInfo(
    studentIds: string[],
    classId?: string,
    customRanks: EmulationRank[] = DEFAULT_EMULATION_RANKS
  ): Promise<Map<string, StudentRankInfo>> {
    const result = new Map<string, StudentRankInfo>();
    if (studentIds.length === 0) return result;

    let allEntries = await db.pointEntries.toArray();
    allEntries = allEntries.filter((e) => !e.deletedAt);

    if (classId) {
      allEntries = allEntries.filter((e) => e.classId === classId);
    }

    const pointsMap = new Map<string, number>();
    allEntries.forEach((e) => {
      const current = pointsMap.get(e.studentId) || 0;
      pointsMap.set(e.studentId, current + e.points);
    });

    const sorted = [...customRanks].sort((a, b) => a.level - b.level);

    studentIds.forEach((stId) => {
      const totalPoints = pointsMap.get(stId) || 0;
      const currentRank = this.getRankForPoints(totalPoints, customRanks);

      const currentIndex = sorted.findIndex((r) => r.id === currentRank.id);
      const nextRank = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1]! : null;

      let pointsToNextRank = 0;
      let progressPercent = 100;

      if (nextRank) {
        pointsToNextRank = Math.max(0, nextRank.minPoints - totalPoints);
        const range = nextRank.minPoints - currentRank.minPoints;
        const gainedInRange = totalPoints - currentRank.minPoints;
        progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((gainedInRange / range) * 100))) : 100;
      }

      result.set(stId, {
        studentId: stId,
        totalPoints,
        currentRank,
        nextRank,
        pointsToNextRank,
        progressPercent,
      });
    });

    return result;
  }
}

export const emulationRankService = new EmulationRankService();

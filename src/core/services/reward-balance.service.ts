import { db } from '../database/db';
import type { StudentRewardBalance } from '../database/types';

export class RewardBalanceService {
  /**
   * Tính toán chi tiết số dư điểm đổi quà cho 1 học sinh
   */
  async calculateStudentBalance(studentId: string, classId: string): Promise<StudentRewardBalance> {
    // 1. Fetch positive conduct point entries for this student
    const entries = await db.pointEntries
      .where('studentId')
      .equals(studentId)
      .filter((e) => !e.deletedAt && e.classId === classId)
      .toArray();

    // Sum positive conduct points (achievement score)
    const achievementScore = entries.reduce((sum, e) => (e.points > 0 ? sum + e.points : sum), 0);

    // 2. Fetch all gift redemptions for this student
    const redemptions = await db.giftRedemptions
      .where('studentId')
      .equals(studentId)
      .filter((r) => !r.deletedAt)
      .toArray();

    let spentPoints = 0;
    let refundedPoints = 0;
    let completedRedemptionCount = 0;

    for (const r of redemptions) {
      if (r.status === 'COMPLETED') {
        spentPoints += r.totalPoints;
        completedRedemptionCount++;
      } else if (r.status === 'CANCELLED') {
        refundedPoints += r.totalPoints;
      }
    }

    const redeemableBalance = Math.max(0, achievementScore - spentPoints);

    return {
      studentId,
      classId,
      achievementScore,
      spentPoints,
      refundedPoints,
      redeemableBalance,
      completedRedemptionCount,
    };
  }

  /**
   * Batch tính toán số dư điểm cho toàn bộ học sinh trong 1 lớp (Zero N+1 Query)
   */
  async calculateClassBalances(classId: string): Promise<Map<string, StudentRewardBalance>> {
    const resultMap = new Map<string, StudentRewardBalance>();

    // 1. Fetch all enrollments for class
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((en) => en.status === 'Active' && !en.deletedAt)
      .toArray();

    enrollments.forEach((en) => {
      resultMap.set(en.studentId, {
        studentId: en.studentId,
        classId,
        achievementScore: 0,
        spentPoints: 0,
        refundedPoints: 0,
        redeemableBalance: 0,
        completedRedemptionCount: 0,
      });
    });

    if (enrollments.length === 0) {
      return resultMap;
    }

    // 2. Batch fetch all point entries for class
    const [allEntries, allRedemptions] = await Promise.all([
      db.pointEntries
        .where('classId')
        .equals(classId)
        .filter((e) => !e.deletedAt)
        .toArray(),
      db.giftRedemptions
        .where('classId')
        .equals(classId)
        .filter((r) => !r.deletedAt)
        .toArray(),
    ]);

    // Aggregate achievement score
    for (const e of allEntries) {
      if (e.points > 0) {
        const bal = resultMap.get(e.studentId);
        if (bal) {
          bal.achievementScore += e.points;
        }
      }
    }

    // Aggregate spent & refunded points
    for (const r of allRedemptions) {
      const bal = resultMap.get(r.studentId);
      if (bal) {
        if (r.status === 'COMPLETED') {
          bal.spentPoints += r.totalPoints;
          bal.completedRedemptionCount++;
        } else if (r.status === 'CANCELLED') {
          bal.refundedPoints += r.totalPoints;
        }
      }
    }

    // Compute final redeemable balances
    resultMap.forEach((bal) => {
      bal.redeemableBalance = Math.max(0, bal.achievementScore - bal.spentPoints);
    });

    return resultMap;
  }
}

export const rewardBalanceService = new RewardBalanceService();

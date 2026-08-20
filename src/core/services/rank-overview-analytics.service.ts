import { db } from '../database/db';
import type { RankLevel, Student } from '../database/types';
import type { RankProgressResult } from './rank-calculation.service';

export interface StudentWithRankItem {
  student: Student;
  rankInfo: RankProgressResult;
  className: string;
  lastPromotedAt?: string | null;
}

export type RankGroupName =
  | 'Hạ sĩ quan và Binh sĩ'
  | 'Cấp Úy'
  | 'Cấp Tá'
  | 'Cấp Tướng';

export interface RankGroupChartData {
  group: RankGroupName;
  count: number;
  percentage: number;
  colorToken: string;
  colorHex: string;
}

export interface RankLevelChartData {
  level: number;
  code: string;
  name: string;
  group: RankGroupName;
  count: number;
  percentage: number;
  colorToken: string;
  colorHex: string;
  minPoints: number;
}

export interface PromotionTrendData {
  bucketKey: string;
  label: string;
  startDate: string;
  endDate: string;
  promotionCount: number;
}

export interface NearPromotionStudentItem {
  studentId: string;
  studentName: string;
  avatar?: string | null;
  className: string;
  currentRank: RankLevel;
  nextRank: RankLevel | null;
  currentLevel: number;
  effectivePoints: number;
  nextThreshold: number | null;
  pointsToNextRank: number;
  progressPercent: number;
}

export interface RankOverviewAnalyticsResult {
  totalStudents: number;
  groupDistribution: RankGroupChartData[];
  levelDistribution: RankLevelChartData[];
  promotionTrend: PromotionTrendData[];
  totalPromotions: number;
  peakPeriodLabel?: string;
  nearPromotionStudents: NearPromotionStudentItem[];
}

export interface RankAnalyticsFilter {
  academicYearId: string;
  classId?: string; // 'all' or specific class ID
  termId?: string | null;
  startDate?: string;
  endDate?: string;
}

// Design Token Harmonious Colors
export const RANK_GROUP_COLORS: Record<RankGroupName, { hex: string; token: string }> = {
  'Hạ sĩ quan và Binh sĩ': { hex: '#10b981', token: 'emerald' }, // Green
  'Cấp Úy': { hex: '#2563eb', token: 'blue' },                   // Blue
  'Cấp Tá': { hex: '#d97706', token: 'amber' },                  // Amber
  'Cấp Tướng': { hex: '#9333ea', token: 'purple' },              // Purple
};

export const RANK_LEVEL_COLORS: Record<number, string> = {
  1: '#34d399', 2: '#10b981', 3: '#059669', 4: '#047857', 5: '#065f46',
  6: '#60a5fa', 7: '#3b82f6', 8: '#2563eb', 9: '#1d4ed8',
  10: '#fbbf24', 11: '#f59e0b', 12: '#d97706', 13: '#b45309',
  14: '#c084fc', 15: '#a855f7', 16: '#9333ea', 17: '#7e22ce',
};

export class RankOverviewAnalyticsService {
  /**
   * 1. Tổng hợp phân bố 4 nhóm cấp bậc cho Donut Chart
   */
  getRankGroupDistribution(
    studentsWithRank: StudentWithRankItem[],
    totalStudents: number
  ): RankGroupChartData[] {
    const groupOrder: RankGroupName[] = [
      'Hạ sĩ quan và Binh sĩ',
      'Cấp Úy',
      'Cấp Tá',
      'Cấp Tướng',
    ];

    const groupCounts: Record<RankGroupName, number> = {
      'Hạ sĩ quan và Binh sĩ': 0,
      'Cấp Úy': 0,
      'Cấp Tá': 0,
      'Cấp Tướng': 0,
    };

    for (const item of studentsWithRank) {
      const g = item.rankInfo.currentRank.group as RankGroupName;
      if (groupCounts[g] !== undefined) {
        groupCounts[g]++;
      }
    }

    return groupOrder.map((group) => {
      const count = groupCounts[group];
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      const colorInfo = RANK_GROUP_COLORS[group];
      return {
        group,
        count,
        percentage,
        colorToken: colorInfo.token,
        colorHex: colorInfo.hex,
      };
    });
  }

  /**
   * 2. Tổng hợp phân bố 17 cấp bậc cho Horizontal Bar Chart
   */
  getRankLevelDistribution(
    studentsWithRank: StudentWithRankItem[],
    rankLevels: RankLevel[],
    totalStudents: number
  ): RankLevelChartData[] {
    const levelCounts: Record<number, number> = {};
    for (let i = 1; i <= 17; i++) {
      levelCounts[i] = 0;
    }

    for (const item of studentsWithRank) {
      const lvl = item.rankInfo.currentLevel;
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    }

    const sortedLevels = [...rankLevels].sort((a, b) => a.level - b.level);

    return sortedLevels.map((lvl) => {
      const count = levelCounts[lvl.level] || 0;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      const groupName = lvl.group as RankGroupName;
      const colorHex = RANK_LEVEL_COLORS[lvl.level] || RANK_GROUP_COLORS[groupName]?.hex || '#3b82f6';

      return {
        level: lvl.level,
        code: lvl.code,
        name: lvl.name,
        group: groupName,
        count,
        percentage,
        colorToken: lvl.colorToken,
        colorHex,
        minPoints: lvl.minPoints,
      };
    });
  }

  /**
   * 3. Tổng hợp xu hướng thăng cấp theo thời gian (Area/Line Chart)
   */
  async getPromotionTrend(
    filter: RankAnalyticsFilter,
    systemId: string
  ): Promise<{
    trend: PromotionTrendData[];
    totalPromotions: number;
    peakPeriodLabel?: string;
  }> {
    // Query promotion histories for the system
    let query = db.studentRankHistory
      .where('rankSystemId')
      .equals(systemId)
      .filter((h) => h.changeType === 'promotion');

    if (filter.classId && filter.classId !== 'all') {
      query = db.studentRankHistory
        .where('classId')
        .equals(filter.classId)
        .filter((h) => h.rankSystemId === systemId && h.changeType === 'promotion');
    }

    const promotions = await query.toArray();

    if (promotions.length === 0) {
      return {
        trend: [],
        totalPromotions: 0,
      };
    }

    // Sort promotions chronologically
    promotions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Determine timeframe
    const firstDate = new Date(promotions[0]!.createdAt);
    const lastDate = new Date(promotions[promotions.length - 1]!.createdAt);
    const diffDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

    const trendBucketsMap = new Map<string, { label: string; count: number; startDate: string; endDate: string }>();

    if (diffDays <= 31) {
      // Bucket by Day (DD/MM)
      promotions.forEach((p) => {
        const d = new Date(p.createdAt);
        const dayKey = d.toISOString().split('T')[0]!;
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const current = trendBucketsMap.get(dayKey) || { label: dayLabel, count: 0, startDate: dayKey, endDate: dayKey };
        current.count++;
        trendBucketsMap.set(dayKey, current);
      });
    } else if (diffDays <= 180) {
      // Bucket by Week
      promotions.forEach((p) => {
        const d = new Date(p.createdAt);
        // Find Monday of the week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const weekKey = monday.toISOString().split('T')[0]!;
        const weekLabel = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')} - ${String(
          sunday.getDate()
        ).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

        const current = trendBucketsMap.get(weekKey) || {
          label: weekLabel,
          count: 0,
          startDate: weekKey,
          endDate: sunday.toISOString().split('T')[0]!,
        };
        current.count++;
        trendBucketsMap.set(weekKey, current);
      });
    } else {
      // Bucket by Month (Tháng MM/YYYY)
      promotions.forEach((p) => {
        const d = new Date(p.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `Thg ${d.getMonth() + 1}/${d.getFullYear()}`;
        const current = trendBucketsMap.get(monthKey) || {
          label: monthLabel,
          count: 0,
          startDate: `${monthKey}-01`,
          endDate: `${monthKey}-28`,
        };
        current.count++;
        trendBucketsMap.set(monthKey, current);
      });
    }

    const trend: PromotionTrendData[] = [];
    let maxCount = 0;
    let peakPeriodLabel: string | undefined;

    trendBucketsMap.forEach((val, key) => {
      trend.push({
        bucketKey: key,
        label: val.label,
        startDate: val.startDate,
        endDate: val.endDate,
        promotionCount: val.count,
      });

      if (val.count > maxCount) {
        maxCount = val.count;
        peakPeriodLabel = val.label;
      }
    });

    return {
      trend,
      totalPromotions: promotions.length,
      peakPeriodLabel: maxCount > 0 ? `${peakPeriodLabel} (${maxCount} lượt)` : undefined,
    };
  }

  /**
   * 4. Lấy danh sách học sinh sắp thăng cấp (Near-Promotion Panel)
   */
  getNearPromotionStudents(
    studentsWithRank: StudentWithRankItem[],
    limit: number = 6
  ): NearPromotionStudentItem[] {
    const list = studentsWithRank
      .filter((item) => !item.rankInfo.isHighestRank && item.rankInfo.currentLevel < 17)
      .map((item) => ({
        studentId: item.student.id,
        studentName: item.student.fullName,
        avatar: item.student.avatar || null,
        className: item.className,
        currentRank: item.rankInfo.currentRank,
        nextRank: item.rankInfo.nextRank,
        currentLevel: item.rankInfo.currentLevel,
        effectivePoints: item.rankInfo.effectivePoints,
        nextThreshold: item.rankInfo.nextThreshold,
        pointsToNextRank: item.rankInfo.pointsToNextRank,
        progressPercent: item.rankInfo.progressPercent,
      }));

    // Prioritize students with highest progressPercent or lowest pointsToNextRank
    list.sort((a, b) => {
      if (a.pointsToNextRank !== b.pointsToNextRank) {
        return a.pointsToNextRank - b.pointsToNextRank;
      }
      return b.progressPercent - a.progressPercent;
    });

    return list.slice(0, limit);
  }

  /**
   * 5. Tổng hợp toàn bộ dữ liệu Analytics cho trang Tổng quan
   */
  async getRankOverviewAnalytics(
    filter: RankAnalyticsFilter,
    studentsWithRank: StudentWithRankItem[],
    rankLevels: RankLevel[],
    systemId: string
  ): Promise<RankOverviewAnalyticsResult> {
    const totalStudents = studentsWithRank.length;

    const groupDistribution = this.getRankGroupDistribution(studentsWithRank, totalStudents);
    const levelDistribution = this.getRankLevelDistribution(studentsWithRank, rankLevels, totalStudents);
    const { trend, totalPromotions, peakPeriodLabel } = await this.getPromotionTrend(filter, systemId);
    const nearPromotionStudents = this.getNearPromotionStudents(studentsWithRank, 6);

    return {
      totalStudents,
      groupDistribution,
      levelDistribution,
      promotionTrend: trend,
      totalPromotions,
      peakPeriodLabel,
      nearPromotionStudents,
    };
  }
}

export const rankOverviewAnalyticsService = new RankOverviewAnalyticsService();

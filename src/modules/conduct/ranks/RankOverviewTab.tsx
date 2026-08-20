import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../../shared/components/Card';
import { EmulationRankBadge } from '../../../shared/components/EmulationRankBadge';
import type { RankLevel, StudentRankHistory } from '../../../core/database/types';
import { formatDateTimeVietnamese } from '../../../shared/utilities/date';
import {
  rankOverviewAnalyticsService,
  type StudentWithRankItem,
  type RankGroupName,
  type RankGroupChartData,
  type RankLevelChartData,
  type PromotionTrendData,
  type NearPromotionStudentItem,
  type RankAnalyticsFilter,
} from '../../../core/services/rank-overview-analytics.service';
import { RankGroupDonutChart } from './components/RankGroupDonutChart';
import { RankLevelBarChart } from './components/RankLevelBarChart';
import { RankPromotionTrendChart } from './components/RankPromotionTrendChart';
import { NearPromotionPanel } from './components/NearPromotionPanel';
import {
  TrendingUp,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';

export type { StudentWithRankItem };

export interface RankOverviewTabProps {
  studentsWithRank: StudentWithRankItem[];
  rankLevels: RankLevel[];
  recentPromotions: (StudentRankHistory & { studentName: string; className: string })[];
  rankSystemId?: string;
  filter?: RankAnalyticsFilter;
  onSelectStudent?: (studentId: string) => void;
  onNavigateToStudentsTabWithFilter?: (filterOptions?: {
    group?: string;
    level?: number;
    quickFilter?: 'all' | 'near_promo' | 'recent_promo';
  }) => void;
}

export const RankOverviewTab: React.FC<RankOverviewTabProps> = ({
  studentsWithRank,
  rankLevels,
  recentPromotions,
  rankSystemId,
  filter,
  onSelectStudent,
  onNavigateToStudentsTabWithFilter,
}) => {
  // Chart Interactive Filters
  const [selectedGroup, setSelectedGroup] = useState<RankGroupName | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Promotion Trend Data State
  const [promotionTrend, setPromotionTrend] = useState<PromotionTrendData[]>([]);
  const [totalPromotionsCount, setTotalPromotionsCount] = useState<number>(0);
  const [peakPeriod, setPeakPeriod] = useState<string | undefined>();
  const [loadingTrend, setLoadingTrend] = useState<boolean>(false);

  // 1. Statistics Calculations (Top Summary Cards)
  const stats = useMemo(() => {
    const total = studentsWithRank.length;
    if (total === 0) {
      return {
        total: 0,
        groupCounts: {
          'Hạ sĩ quan và Binh sĩ': 0,
          'Cấp Úy': 0,
          'Cấp Tá': 0,
          'Cấp Tướng': 0,
        },
        mostPopularRank: null,
        popularCount: 0,
        averagePoints: 0,
      };
    }

    const groupCounts: Record<string, number> = {
      'Hạ sĩ quan và Binh sĩ': 0,
      'Cấp Úy': 0,
      'Cấp Tá': 0,
      'Cấp Tướng': 0,
    };

    const levelCounts: Record<number, number> = {};
    let sumPoints = 0;

    for (const item of studentsWithRank) {
      sumPoints += item.rankInfo.effectivePoints;
      const group = item.rankInfo.currentRank.group;
      if (groupCounts[group] !== undefined) {
        groupCounts[group]++;
      }
      const lvl = item.rankInfo.currentLevel;
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    }

    // Most popular rank
    let maxCount = 0;
    let popularLevel = 1;
    for (const [lvl, count] of Object.entries(levelCounts)) {
      if (count > maxCount) {
        maxCount = count;
        popularLevel = parseInt(lvl);
      }
    }

    const mostPopularRank = rankLevels.find((l) => l.level === popularLevel) || rankLevels[0] || null;

    return {
      total,
      groupCounts,
      mostPopularRank,
      popularCount: maxCount,
      averagePoints: Math.round(sumPoints / total),
    };
  }, [studentsWithRank, rankLevels]);

  // 2. Chart 1: Donut Distribution
  const groupDistributionData: RankGroupChartData[] = useMemo(() => {
    return rankOverviewAnalyticsService.getRankGroupDistribution(studentsWithRank, stats.total);
  }, [studentsWithRank, stats.total]);

  // 3. Chart 2: Level Horizontal Bar Distribution
  const levelDistributionData: RankLevelChartData[] = useMemo(() => {
    return rankOverviewAnalyticsService.getRankLevelDistribution(studentsWithRank, rankLevels, stats.total);
  }, [studentsWithRank, rankLevels, stats.total]);

  // 4. Chart 3: Promotion Trend Loading
  const loadTrend = useCallback(async () => {
    if (!rankSystemId) return;
    setLoadingTrend(true);
    try {
      const activeFilter: RankAnalyticsFilter = filter || {
        academicYearId: '',
        classId: 'all',
      };
      const result = await rankOverviewAnalyticsService.getPromotionTrend(activeFilter, rankSystemId);
      setPromotionTrend(result.trend);
      setTotalPromotionsCount(result.totalPromotions);
      setPeakPeriod(result.peakPeriodLabel);
    } catch (err) {
      console.error('Error loading promotion trend:', err);
    } finally {
      setLoadingTrend(false);
    }
  }, [rankSystemId, filter]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  // 5. Near Promotion Students List
  const nearPromotionStudents: NearPromotionStudentItem[] = useMemo(() => {
    return rankOverviewAnalyticsService.getNearPromotionStudents(studentsWithRank, 6);
  }, [studentsWithRank]);

  // Group filter click handler
  const handleSelectGroup = (group: RankGroupName | null) => {
    setSelectedGroup(group);
    if (group && onNavigateToStudentsTabWithFilter) {
      onNavigateToStudentsTabWithFilter({ group });
    }
  };

  // Level filter click handler
  const handleSelectLevel = (level: number | null) => {
    setSelectedLevel(level);
    if (level && onNavigateToStudentsTabWithFilter) {
      onNavigateToStudentsTabWithFilter({ level });
    }
  };

  if (studentsWithRank.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <Shield className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">Chưa có dữ liệu học sinh trong phạm vi lựa chọn</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Vui lòng chọn lớp học có học sinh hoặc ghi nhận điểm thi đua để xem báo cáo trực quan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP ROW: 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GROUP 1 */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Hạ sĩ quan & Binh sĩ</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
              Cấp 1–5
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-950">{stats.groupCounts['Hạ sĩ quan và Binh sĩ'] ?? 0}</span>
            <span className="text-xs font-bold text-emerald-700">
              {stats.total > 0 ? Math.round(((stats.groupCounts['Hạ sĩ quan và Binh sĩ'] ?? 0) / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Binh nhì, Binh nhất, Hạ sĩ, Trung sĩ, Thượng sĩ</p>
        </Card>

        {/* GROUP 2 */}
        <Card className="p-4 bg-gradient-to-br from-blue-50/60 to-blue-100/30 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Cấp Úy</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
              Cấp 6–9
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-950">{stats.groupCounts['Cấp Úy'] ?? 0}</span>
            <span className="text-xs font-bold text-blue-700">
              {stats.total > 0 ? Math.round(((stats.groupCounts['Cấp Úy'] ?? 0) / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1 font-medium">Thiếu úy, Trung úy, Thượng úy, Đại úy</p>
        </Card>

        {/* GROUP 3 */}
        <Card className="p-4 bg-gradient-to-br from-amber-50/60 to-amber-100/40 border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Cấp Tá</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Cấp 10–13
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950">{stats.groupCounts['Cấp Tá'] ?? 0}</span>
            <span className="text-xs font-bold text-amber-800">
              {stats.total > 0 ? Math.round(((stats.groupCounts['Cấp Tá'] ?? 0) / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1 font-medium">Thiếu tá, Trung tá, Thượng tá, Đại tá</p>
        </Card>

        {/* GROUP 4 */}
        <Card className="p-4 bg-gradient-to-br from-purple-50/60 to-rose-100/30 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900">Cấp Tướng</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
              Cấp 14–17
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-950">{stats.groupCounts['Cấp Tướng'] ?? 0}</span>
            <span className="text-xs font-bold text-purple-700">
              {stats.total > 0 ? Math.round(((stats.groupCounts['Cấp Tướng'] ?? 0) / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-purple-700/80 mt-1 font-medium">Thiếu tướng, Trung tướng, Thượng tướng, Đại tướng</p>
        </Card>
      </div>

      {/* 2. HIGHLIGHTS ROW: MOST POPULAR RANK & AVERAGE POINTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MOST POPULAR RANK */}
        {stats.mostPopularRank && (
          <Card className="p-4 flex items-center gap-4 bg-white">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 shrink-0">
              <EmulationRankBadge rank={stats.mostPopularRank} size="md" showPoints={false} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cấp bậc phổ biến nhất</span>
              <h4 className="text-base font-extrabold text-slate-800 truncate">
                {stats.mostPopularRank.name} (Cấp {stats.mostPopularRank.level})
              </h4>
              <p className="text-xs text-slate-500">
                Có <span className="font-bold text-blue-600">{stats.popularCount} học sinh</span> ({Math.round((stats.popularCount / stats.total) * 100)}%) đang giữ cấp bậc này.
              </p>
            </div>
          </Card>
        )}

        {/* AVERAGE POINTS */}
        <Card className="p-4 flex items-center gap-4 bg-white">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Thi Đua Trung Bình</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{stats.averagePoints}</span>
              <span className="text-xs font-bold text-slate-500">điểm / học sinh</span>
            </div>
            <p className="text-xs text-slate-500">Tính trên toàn bộ {stats.total} học sinh trong phạm vi thi đua.</p>
          </div>
        </Card>
      </div>

      {/* 3. ROW 2 (12-COL RESPONSIVE GRID): DONUT (4/12) & HORIZONTAL BAR (8/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DONUT CHART (4/12) */}
        <div className="lg:col-span-4">
          <RankGroupDonutChart
            data={groupDistributionData}
            totalStudents={stats.total}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
          />
        </div>

        {/* HORIZONTAL BAR CHART (8/12) */}
        <div className="lg:col-span-8">
          <RankLevelBarChart
            data={levelDistributionData}
            totalStudents={stats.total}
            selectedLevel={selectedLevel}
            onSelectLevel={handleSelectLevel}
          />
        </div>
      </div>

      {/* 4. ROW 3 (12-COL RESPONSIVE GRID): PROMOTION TREND (8/12) & NEAR-PROMOTION (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PROMOTION TREND AREA CHART (8/12) */}
        <div className="lg:col-span-8">
          <RankPromotionTrendChart
            data={promotionTrend}
            totalPromotions={totalPromotionsCount}
            peakPeriodLabel={peakPeriod}
            loading={loadingTrend}
          />
        </div>

        {/* NEAR-PROMOTION PANEL (4/12) */}
        <div className="lg:col-span-4">
          <NearPromotionPanel
            students={nearPromotionStudents}
            onSelectStudent={onSelectStudent}
            onViewAll={() => {
              if (onNavigateToStudentsTabWithFilter) {
                onNavigateToStudentsTabWithFilter({ quickFilter: 'near_promo' });
              }
            }}
          />
        </div>
      </div>

      {/* 5. ROW 4: RECENT PROMOTIONS LIST */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-800">Học Sinh Vừa Thăng Cấp Gần Đây</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{recentPromotions.length} lượt mới</span>
        </div>

        {recentPromotions.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {recentPromotions.slice(0, 6).map((item) => {
              const rankLevelObj = rankLevels.find((l) => l.level === item.toLevel) || rankLevels[0]!;
              return (
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                      {item.studentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{item.studentName}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>{item.className}</span> • <Clock className="w-3 h-3 inline" /> {formatDateTimeVietnamese(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <EmulationRankBadge rank={rankLevelObj} size="sm" showPoints={false} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            Chưa có học sinh thăng cấp trong phiên gần đây.
          </div>
        )}
      </Card>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import type { DashboardRankJourneyData } from '../../../core/services/dashboard-overview.service';
import {
  Zap,
  ChevronRight,
  ArrowRight,
  Trophy,
} from 'lucide-react';

export interface DashboardRankJourneyCardProps {
  rankData: DashboardRankJourneyData;
  loading?: boolean;
}

export const DashboardRankJourneyCard: React.FC<DashboardRankJourneyCardProps> = ({
  rankData,
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      title="Hành Trình Cấp Bậc Avatar Của Lớp"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-app-primary font-bold p-0 hover:bg-transparent"
          onClick={() => navigate('/students')}
        >
          Xem học sinh <ChevronRight className="w-4 h-4 ml-0.5 inline" />
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* 5 AVATAR LEVELS DISTRIBUTION MINI PILLS */}
            {rankData.levelsDistribution && rankData.levelsDistribution.length > 0 ? (
              <div className="grid grid-cols-5 gap-1.5">
                {rankData.levelsDistribution.map((lvl) => (
                  <div
                    key={lvl.level}
                    style={{ borderTopColor: lvl.cardBaseColor, borderTopWidth: '3px' }}
                    className="p-2 rounded-xl bg-app-surface border border-app shadow-2xs text-center space-y-0.5"
                  >
                    <span className="text-[10px] font-extrabold text-app-muted block truncate" title={lvl.name}>
                      {lvl.shortLabel || `Cấp ${lvl.level}`}
                    </span>
                    <span className="text-sm sm:text-base font-black text-app-main font-mono">
                      {lvl.count} <span className="text-[9px] font-normal text-app-muted">HS</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block truncate">Cấp 1 & 2</span>
                  <span className="text-base font-black text-emerald-950 dark:text-emerald-100 font-mono">
                    {rankData.groupCounts['Hạ sĩ quan và Binh sĩ']} <span className="text-[10px] font-normal text-emerald-700">em</span>
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block truncate">Cấp 3</span>
                  <span className="text-base font-black text-blue-950 dark:text-blue-100 font-mono">
                    {rankData.groupCounts['Cấp Úy']} <span className="text-[10px] font-normal text-blue-700">em</span>
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block truncate">Cấp 4</span>
                  <span className="text-base font-black text-amber-950 dark:text-amber-100 font-mono">
                    {rankData.groupCounts['Cấp Tá']} <span className="text-[10px] font-normal text-amber-700">em</span>
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40">
                  <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 block truncate">Cấp 5</span>
                  <span className="text-base font-black text-purple-950 dark:text-purple-100 font-mono">
                    {rankData.groupCounts['Cấp Tướng']} <span className="text-[10px] font-normal text-purple-700">em</span>
                  </span>
                </div>
              </div>
            )}

            {/* POPULAR LEVEL & CLASS AVERAGE */}
            {rankData.mostPopularRank && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-app rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-app-muted uppercase">Cấp độ phổ biến nhất</span>
                    <p className="text-xs font-black text-app-main truncate">
                      {rankData.mostPopularRank.name} (Cấp {rankData.mostPopularRank.level})
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-app-muted uppercase">Điểm TB Lớp</span>
                  <p className="text-xs font-black text-emerald-600 font-mono">{rankData.classAveragePoints} đ</p>
                </div>
              </div>
            )}

            {/* TOP NEAR PROMOTIONS */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-app-main">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                  Sắp thăng cấp (Cần thầy cô khích lệ)
                </span>
                <span className="text-[11px] text-app-muted font-normal">
                  {rankData.nearPromotionStudents.length} em sát ngưỡng
                </span>
              </div>

              {rankData.nearPromotionStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-app-muted italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-app">
                  Chưa có học sinh sát ngưỡng thăng cấp.
                </div>
              ) : (
                <div className="divide-y divide-app max-h-56 overflow-y-auto pr-1">
                  {rankData.nearPromotionStudents.map((item) => (
                    <div
                      key={item.student.id}
                      onClick={() => navigate(`/students/${item.student.id}`)}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.student.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-app-main truncate">{item.student.fullName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-app-muted">
                            <span>{item.currentLevelName || `Cấp ${item.currentLevel}`}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              {item.nextLevelName || `Cấp ${item.nextLevel || item.currentLevel + 1}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-emerald-600 font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
                          Còn {item.pointsToNextRank} đ
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden ml-auto">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

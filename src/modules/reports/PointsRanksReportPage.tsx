import React from 'react';
import { useReports } from './ReportsContext';
import { PointTrendReportChart } from './components/PointTrendReportChart';
import { RankDistributionReportChart } from './components/RankDistributionReportChart';
import { PromotionHistoryReportChart } from './components/PromotionHistoryReportChart';

export const PointsRanksReportPage: React.FC = () => {
  const { report } = useReports();

  if (!report) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. POINT TREND */}
      <PointTrendReportChart data={report.pointTrend} />

      {/* 2. RANK DISTRIBUTION & PROMOTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RankDistributionReportChart data={report.rankDistribution} />
        </div>
        <div className="lg:col-span-5">
          <PromotionHistoryReportChart data={report.promotionHistory} />
        </div>
      </div>
    </div>
  );
};

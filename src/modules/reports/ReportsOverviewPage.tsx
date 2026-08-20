import React from 'react';
import { useReports } from './ReportsContext';
import { ReportKpiSection } from './components/ReportKpiSection';
import { AttendanceTrendChart } from './components/AttendanceTrendChart';
import { RankDistributionReportChart } from './components/RankDistributionReportChart';
import { PointTrendReportChart } from './components/PointTrendReportChart';
import { PromotionHistoryReportChart } from './components/PromotionHistoryReportChart';
import { EngagementReportChart } from './components/EngagementReportChart';
import { HonorTitlesReportChart } from './components/HonorTitlesReportChart';
import { ReportInsightPanel } from './components/ReportInsightPanel';

export const ReportsOverviewPage: React.FC = () => {
  const { report } = useReports();

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. KPI CARDS */}
      <ReportKpiSection kpis={report.kpis} />

      {/* 2. ATTENDANCE (8 COLS) & RANK DISTRIBUTION (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AttendanceTrendChart data={report.attendanceTrend} />
        </div>
        <div className="lg:col-span-4">
          <RankDistributionReportChart data={report.rankDistribution} />
        </div>
      </div>

      {/* 3. POINT TREND (8 COLS) & PROMOTION HISTORY (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PointTrendReportChart data={report.pointTrend} />
        </div>
        <div className="lg:col-span-4">
          <PromotionHistoryReportChart data={report.promotionHistory} />
        </div>
      </div>

      {/* 4. ENGAGEMENT (6 COLS) & HONORS (6 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <EngagementReportChart data={report.engagement} />
        </div>
        <div className="lg:col-span-6">
          <HonorTitlesReportChart data={report.honorTitlesStats} />
        </div>
      </div>

      {/* 5. AUTOMATED INSIGHTS & ATTENTION LIST (12 COLS) */}
      <ReportInsightPanel
        insights={report.insights}
        attentionStudents={report.attentionStudents}
      />
    </div>
  );
};

import React from 'react';
import { useReports } from './ReportsContext';
import { EngagementReportChart } from './components/EngagementReportChart';

export const EngagementReportPage: React.FC = () => {
  const { report } = useReports();

  if (!report) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <EngagementReportChart data={report.engagement} />
    </div>
  );
};

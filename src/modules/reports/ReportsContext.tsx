import React from 'react';
import type { FullReportViewModel, ReportFilterParams } from '../../core/services/report-aggregation.service';
import type { ClassRoom, AcademicYear } from '../../core/database/types';

export interface ReportsContextType {
  report: FullReportViewModel | null;
  loading: boolean;
  filter: ReportFilterParams;
  onFilterChange: (newFilter: ReportFilterParams) => void;
  classList: ClassRoom[];
  academicYears: AcademicYear[];
  reload: () => Promise<void>;
}

export const ReportsContext = React.createContext<ReportsContextType | null>(null);

export const useReports = () => {
  const ctx = React.useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsLayoutPage');
  return ctx;
};

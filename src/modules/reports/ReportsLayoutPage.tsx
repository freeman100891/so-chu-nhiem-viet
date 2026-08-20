import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import {
  reportAggregationService,
  type ReportFilterParams,
  type FullReportViewModel,
} from '../../core/services/report-aggregation.service';
import { reportExportService } from '../../core/services/report-export.service';
import { getTodayDateString } from '../../shared/utilities/date';
import { db } from '../../core/database/db';
import { ReportFilterBar } from './components/ReportFilterBar';
import type { ClassRoom, AcademicYear, Term, TeacherProfile } from '../../core/database/types';
import {
  BarChart3,
  CalendarCheck,
  Award,
  MessageSquare,
  Trophy,
  GitCompare,
  Tv,
  FileSpreadsheet,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

import { ReportsContext } from './ReportsContext';

export const ReportsLayoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);

  // Filter State with default Month period
  const today = new Date();
  const firstDayStr = getTodayDateString(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDayStr = getTodayDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [filter, setFilter] = useState<ReportFilterParams>({
    classId: '',
    academicYearId: '',
    termId: null,
    startDate: firstDayStr,
    endDate: lastDayStr,
    periodType: 'this_month',
    comparePreviousPeriod: true,
  });

  const [report, setReport] = useState<FullReportViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // 1. Initial Metadata Load
  const loadMetadata = useCallback(async () => {
    try {
      const profile = await db.teacherProfiles.toCollection().first();
      setTeacher(profile || null);

      const years = await academicYearRepository.findAll();
      setAcademicYears(years);

      const settings = await settingsRepository.getSettings();
      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const curYear = await academicYearRepository.getCurrentYear();
        yearId = curYear?.id || years[0]?.id;
      }

      if (yearId) {
        const classes = await classRepository.findByAcademicYear(yearId);
        setClassList(classes);

        const yearTerms = await db.terms
          .where('academicYearId')
          .equals(yearId)
          .filter((t) => !t.deletedAt)
          .toArray();
        setTerms(yearTerms);

        let activeClsId = classes[0]?.id || '';
        if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
          activeClsId = settings.activeClassId;
        }

        setFilter((prev) => ({
          ...prev,
          academicYearId: yearId!,
          classId: activeClsId,
        }));
      }
    } catch (err) {
      console.error('Error loading report metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // 2. Fetch Full Report on Filter Change
  const loadReport = useCallback(async () => {
    if (!filter.classId || !filter.academicYearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await reportAggregationService.generateFullReport(filter);
      setReport(data);
    } catch (err) {
      console.error('Error computing report view model:', err);
      showError('Lỗi tính toán báo cáo', 'Không thể tổng hợp dữ liệu báo cáo.');
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // 3. Export Excel
  const handleExportExcel = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const blob = await reportExportService.exportFullReportToExcel(report, teacher);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCao_${report.className.replace(/\s+/g, '')}_${filter.startDate}_${filter.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Xuất báo cáo Excel thành công', 'File đã sẵn sàng để lưu hoặc in.');
    } catch (err) {
      console.error('Error exporting excel:', err);
      showError('Lỗi xuất file Excel', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Nav tabs
  const navTabs = [
    { to: '/reports', label: 'Tổng quan', icon: BarChart3, exact: true },
    { to: '/reports/attendance', label: 'Chuyên cần', icon: CalendarCheck },
    { to: '/reports/points-ranks', label: 'Điểm & Cấp bậc', icon: Award },
    { to: '/reports/engagement', label: 'Tương tác', icon: MessageSquare },
    { to: '/reports/honors', label: 'Bảng vàng', icon: Trophy },
    { to: '/reports/compare', label: 'So sánh lớp', icon: GitCompare },
  ];

  const currentPath = location.pathname;

  return (
    <ReportsContext.Provider
      value={{
        report,
        loading,
        filter,
        onFilterChange: setFilter,
        classList,
        academicYears,
        reload: loadReport,
      }}
    >
      <div className="space-y-6 animate-fadeIn pb-12 print:m-0 print:p-0">
        {/* PAGE HEADER */}
        <div className="print:hidden">
          <PageHeader
            title="Báo Cáo & Thống Kê"
            description="Bảng điều khiển trực quan theo dõi chuyên cần, điểm thi đua, 17 cấp bậc và tương tác lớp học"
            badgeText={report?.className}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
                  onClick={loadReport}
                  disabled={loading}
                >
                  Làm mới
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                >
                  In Báo Cáo
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="font-bold"
                  leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                  onClick={handleExportExcel}
                  disabled={exporting || !report}
                >
                  {exporting ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                  leftIcon={<Tv className="w-4 h-4" />}
                  onClick={() => navigate('/reports/presentation')}
                >
                  Trình chiếu 16:9
                </Button>
              </div>
            }
          />
        </div>

        {/* COMMON FILTER BAR */}
        <div className="print:hidden">
          <ReportFilterBar
            filter={filter}
            onFilterChange={setFilter}
            classList={classList}
            academicYears={academicYears}
            terms={terms}
            studentsList={report?.studentsList || []}
          />
        </div>

        {/* NAV TABS */}
        <div className="flex border-b border-app overflow-x-auto print:hidden">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact ? currentPath === tab.to : currentPath.startsWith(tab.to);

            return (
              <button
                key={tab.to}
                onClick={() => navigate(tab.to)}
                className={cn(
                  'px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px]',
                  isActive
                    ? 'border-app-primary text-app-primary bg-app-primary-light/10'
                    : 'border-transparent text-app-muted hover:text-app-main hover:bg-app-surface-hover'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* OUTLET OR LOADING */}
        {loading && !report ? (
          <div className="space-y-6">
            <LoadingSkeleton type="card" count={3} />
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </ReportsContext.Provider>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Select } from '../../shared/components/Select';
import { Button } from '../../shared/components/Button';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { themeService, type ThemeId } from '../../core/services/theme.service';
import {
  dashboardOverviewService,
  type DashboardGreeting,
  type DashboardTaskItem,
  type DashboardKPIStatsData,
  type DashboardAttendanceDonutItem,
  type DashboardPointTrendItem,
  type DashboardRankJourneyData,
  type DashboardSpotlightStudent,
  type DashboardUpcomingBirthday,
  type DashboardRecentActivityItem,
  type DashboardBackupHealthData,
} from '../../core/services/dashboard-overview.service';

import { DashboardHero } from './components/DashboardHero';
import { DashboardTasksCard } from './components/DashboardTasksCard';
import { DashboardKPIStats } from './components/DashboardKPIStats';
import { DashboardAttendanceDonut } from './components/DashboardAttendanceDonut';
import { DashboardPointTrendChart } from './components/DashboardPointTrendChart';
import { DashboardRankJourneyCard } from './components/DashboardRankJourneyCard';
import { DashboardHonorBoardWidget } from './components/DashboardHonorBoardWidget';
import { DashboardStudentSpotlightCard } from './components/DashboardStudentSpotlightCard';
import { DashboardBirthdayEventsCard } from './components/DashboardBirthdayEventsCard';
import { DashboardQuickActionsGrid } from './components/DashboardQuickActionsGrid';
import { DashboardRecentActivities } from './components/DashboardRecentActivities';
import { DashboardDataHealthCard } from './components/DashboardDataHealthCard';
import { DashboardCustomizeModal } from './components/DashboardCustomizeModal';
import {
  DEFAULT_DASHBOARD_CONFIG,
  type DashboardWidgetConfig,
} from './dashboard.types';
import { WidgetErrorBoundary } from './components/WidgetErrorBoundary';

import type { ClassRoom, AcademicYear } from '../../core/database/types';
import { Sliders, RefreshCw } from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

export const DashboardPage: React.FC = () => {
  // Navigation & Metadata state
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('military');

  // Widget custom configuration
  const [widgetConfig, setWidgetConfig] = useState<DashboardWidgetConfig>(() => {
    try {
      const saved = localStorage.getItem('dashboard_widget_preferences');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_DASHBOARD_CONFIG;
  });
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Range for point trend
  const [trendDaysRange, setTrendDaysRange] = useState<number>(7);

  // Aggregated data state
  const [greeting, setGreeting] = useState<DashboardGreeting | null>(null);
  const [tasks, setTasks] = useState<DashboardTaskItem[]>([]);
  const [kpiStats, setKpiStats] = useState<DashboardKPIStatsData | null>(null);
  const [attendanceDonut, setAttendanceDonut] = useState<{ total: number; data: DashboardAttendanceDonutItem[] }>({
    total: 0,
    data: [],
  });
  const [pointTrend, setPointTrend] = useState<DashboardPointTrendItem[]>([]);
  const [rankJourney, setRankJourney] = useState<DashboardRankJourneyData | null>(null);
  const [spotlights, setSpotlights] = useState<{
    positive: DashboardSpotlightStudent[];
    attention: DashboardSpotlightStudent[];
  }>({ positive: [], attention: [] });
  const [birthdays, setBirthdays] = useState<{
    todayCount: number;
    items: DashboardUpcomingBirthday[];
  }>({ todayCount: 0, items: [] });
  const [recentActivities, setRecentActivities] = useState<DashboardRecentActivityItem[]>([]);
  const [backupHealth, setBackupHealth] = useState<DashboardBackupHealthData | null>(null);

  const [loading, setLoading] = useState(true);

  // 1. Load Initial Metadata (Academic year, classes, theme)
  const loadInitialMetadata = useCallback(async () => {
    try {
      const t = await themeService.initTheme();
      setCurrentTheme(t);

      const settings = await settingsRepository.getSettings();
      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      if (yearId) {
        const year = await academicYearRepository.findById(yearId);
        setActiveYear(year || null);

        const classes = await classRepository.findByAcademicYear(yearId);
        setClassList(classes);

        let initialClassId = classes[0]?.id || '';
        if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
          initialClassId = settings.activeClassId;
        }

        setSelectedClassId((prev) => prev || initialClassId);
      }
    } catch (err) {
      console.error('Error loading dashboard metadata:', err);
    }
  }, []);

  // 2. Load Batch Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const classId = selectedClassId;
      const yearId = activeYear?.id;

      // Parallel batch query
      const [
        greetingData,
        tasksData,
        kpiData,
        donutData,
        trendData,
        rankData,
        spotlightData,
        birthdayData,
        activitiesData,
        healthData,
      ] = await Promise.all([
        dashboardOverviewService.getGreetingInfo(classId, yearId),
        dashboardOverviewService.getTodayTasks(classId),
        dashboardOverviewService.getTodayKPIStats(classId, yearId),
        dashboardOverviewService.getAttendanceDonutData(classId),
        dashboardOverviewService.getPointTrendData(classId, trendDaysRange),
        dashboardOverviewService.getRankJourneyData(classId, yearId),
        dashboardOverviewService.getStudentSpotlights(classId),
        dashboardOverviewService.getUpcomingBirthdaysAndEvents(classId, 30),
        dashboardOverviewService.getRecentActivities(classId, 8),
        dashboardOverviewService.getBackupHealth(),
      ]);

      setGreeting(greetingData);
      setTasks(tasksData);
      setKpiStats(kpiData);
      setAttendanceDonut(donutData);
      setPointTrend(trendData);
      setRankJourney(rankData);
      setSpotlights(spotlightData);
      setBirthdays(birthdayData);
      setRecentActivities(activitiesData);
      setBackupHealth(healthData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, activeYear?.id, trendDaysRange]);

  useEffect(() => {
    loadInitialMetadata();
  }, [loadInitialMetadata]);

  useEffect(() => {
    if (selectedClassId || activeYear) {
      loadDashboardData();
    }
  }, [selectedClassId, activeYear, loadDashboardData]);

  // Handle widget config save
  const handleSaveConfig = (newConfig: DashboardWidgetConfig) => {
    setWidgetConfig(newConfig);
    try {
      localStorage.setItem('dashboard_widget_preferences', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Could not save widget preferences to localStorage', e);
    }
  };

  return (
    <div
      className={cn(
        'animate-fadeIn transition-all',
        widgetConfig.density === 'compact' ? 'space-y-4' : 'space-y-6'
      )}
    >
      {/* 1. TOP CONTROLS: PAGE HEADER + CLASS SELECTOR + CUSTOMIZE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Bảng Điều Khiển Lớp Học"
          description="Trung tâm điều hành và theo dõi toàn diện hoạt động lớp chủ nhiệm"
          badgeText={activeYear?.name}
        />

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* CLASS SELECTOR */}
          <div className="w-48 sm:w-56">
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
            />
          </div>

          {/* REFRESH BUTTON */}
          <Button
            variant="outline"
            size="md"
            className="p-2.5 rounded-xl text-app-muted hover:text-app-main shrink-0"
            onClick={loadDashboardData}
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>

          {/* CUSTOMIZE DASHBOARD BUTTON */}
          <Button
            variant="outline"
            size="md"
            className="font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
            onClick={() => setIsCustomizeModalOpen(true)}
            title="Tùy chỉnh các khối thông tin hiển thị"
          >
            <Sliders className="w-4 h-4 text-app-primary" />
            <span className="hidden md:inline">Tùy chỉnh</span>
          </Button>
        </div>
      </div>

      {loading && !greeting ? (
        <div className="space-y-4">
          <LoadingSkeleton type="card" count={4} />
        </div>
      ) : (
        <>
          {/* SECTION 1: DASHBOARD HERO */}
          {widgetConfig.showHero && greeting && (
            <WidgetErrorBoundary widgetName="Khung Chào Mừng" onRetry={loadDashboardData}>
              <DashboardHero greeting={greeting} themeId={currentTheme} />
            </WidgetErrorBoundary>
          )}

          {/* SECTION 2: TODAY'S TASKS (ACTION CENTER) */}
          {widgetConfig.showTasks && (
            <WidgetErrorBoundary widgetName="Việc Cần Làm Hôm Nay" onRetry={loadDashboardData}>
              <DashboardTasksCard tasks={tasks} loading={loading} />
            </WidgetErrorBoundary>
          )}

          {/* SECTION 3: 5 KPI STAT CARDS */}
          {widgetConfig.showKPIStats && kpiStats && (
            <WidgetErrorBoundary widgetName="Thẻ Thống Kê Nhanh" onRetry={loadDashboardData}>
              <DashboardKPIStats stats={kpiStats} loading={loading} />
            </WidgetErrorBoundary>
          )}

          {/* SECTION 4: ATTENDANCE DONUT (4/12) & POINT TREND (8/12) */}
          {(widgetConfig.showAttendanceDonut || widgetConfig.showPointTrend) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {widgetConfig.showAttendanceDonut && (
                <div className={widgetConfig.showPointTrend ? 'lg:col-span-4' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="Biểu Đồ Chuyên Cần" onRetry={loadDashboardData}>
                    <DashboardAttendanceDonut
                      total={attendanceDonut.total}
                      data={attendanceDonut.data}
                      loading={loading}
                    />
                  </WidgetErrorBoundary>
                </div>
              )}

              {widgetConfig.showPointTrend && (
                <div className={widgetConfig.showAttendanceDonut ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="Biểu Đồ Thi Đua" onRetry={loadDashboardData}>
                    <DashboardPointTrendChart
                      data={pointTrend}
                      daysRange={trendDaysRange}
                      onRangeChange={setTrendDaysRange}
                      loading={loading}
                    />
                  </WidgetErrorBoundary>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: RANK JOURNEY CARD & HONOR BOARD WIDGET */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {widgetConfig.showRankJourney && rankJourney && (
              <div className="lg:col-span-8">
                <WidgetErrorBoundary widgetName="Hành Trình Cấp Bậc" onRetry={loadDashboardData}>
                  <DashboardRankJourneyCard rankData={rankJourney} loading={loading} />
                </WidgetErrorBoundary>
              </div>
            )}
            <div className={widgetConfig.showRankJourney && rankJourney ? 'lg:col-span-4' : 'lg:col-span-12'}>
              <WidgetErrorBoundary widgetName="Bảng Vàng Tuần Này" onRetry={loadDashboardData}>
                <DashboardHonorBoardWidget classId={selectedClassId} />
              </WidgetErrorBoundary>
            </div>
          </div>

          {/* SECTION 6: SPOTLIGHTS (6/12) & BIRTHDAYS (6/12) */}
          {(widgetConfig.showSpotlights || widgetConfig.showBirthdays) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {widgetConfig.showSpotlights && (
                <div className={widgetConfig.showBirthdays ? 'lg:col-span-6' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="Gương Mặt Nổi Bật" onRetry={loadDashboardData}>
                    <DashboardStudentSpotlightCard
                      positiveList={spotlights.positive}
                      attentionList={spotlights.attention}
                      loading={loading}
                    />
                  </WidgetErrorBoundary>
                </div>
              )}

              {widgetConfig.showBirthdays && (
                <div className={widgetConfig.showSpotlights ? 'lg:col-span-6' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="Sinh Nhật Sắp Tới" onRetry={loadDashboardData}>
                    <DashboardBirthdayEventsCard birthdays={birthdays} loading={loading} />
                  </WidgetErrorBoundary>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: QUICK ACTIONS GRID */}
          {widgetConfig.showQuickActions && (
            <WidgetErrorBoundary widgetName="Phím Tắt Thao Tác Nhanh">
              <DashboardQuickActionsGrid />
            </WidgetErrorBoundary>
          )}

          {/* SECTION 8: RECENT ACTIVITIES (8/12) & DATA HEALTH (4/12) */}
          {(widgetConfig.showRecentActivities || widgetConfig.showDataHealth) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {widgetConfig.showRecentActivities && (
                <div className={widgetConfig.showDataHealth ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="Nhật Ký Hoạt Động" onRetry={loadDashboardData}>
                    <DashboardRecentActivities activities={recentActivities} loading={loading} />
                  </WidgetErrorBoundary>
                </div>
              )}

              {widgetConfig.showDataHealth && backupHealth && (
                <div className={widgetConfig.showRecentActivities ? 'lg:col-span-4' : 'lg:col-span-12'}>
                  <WidgetErrorBoundary widgetName="An Toàn Dữ Liệu" onRetry={loadDashboardData}>
                    <DashboardDataHealthCard health={backupHealth} loading={loading} />
                  </WidgetErrorBoundary>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CUSTOMIZE MODAL */}
      <DashboardCustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        config={widgetConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
};

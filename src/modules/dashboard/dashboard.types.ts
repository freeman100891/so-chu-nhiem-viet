export interface DashboardWidgetConfig {
  showHero: boolean;
  showTasks: boolean;
  showKPIStats: boolean;
  showAttendanceDonut: boolean;
  showPointTrend: boolean;
  showRankJourney: boolean;
  showSpotlights: boolean;
  showBirthdays: boolean;
  showQuickActions: boolean;
  showRecentActivities: boolean;
  showDataHealth: boolean;
  density: 'spacious' | 'compact';
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardWidgetConfig = {
  showHero: true,
  showTasks: true,
  showKPIStats: true,
  showAttendanceDonut: true,
  showPointTrend: true,
  showRankJourney: true,
  showSpotlights: true,
  showBirthdays: true,
  showQuickActions: true,
  showRecentActivities: true,
  showDataHealth: true,
  density: 'spacious',
};

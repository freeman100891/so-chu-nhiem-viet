import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../shared/layouts/AppLayout';
import { LoadingSkeleton } from '../shared/components/LoadingSkeleton';

// Lazy loading route modules for fast initial bundle load
const OnboardingPage = lazy(() => import('../modules/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AcademicYearsPage = lazy(() => import('../modules/academic-years/AcademicYearsPage').then((m) => ({ default: m.AcademicYearsPage })));
const ClassesPage = lazy(() => import('../modules/classes/ClassesPage').then((m) => ({ default: m.ClassesPage })));
const ClassDetailPage = lazy(() => import('../modules/classes/ClassDetailPage').then((m) => ({ default: m.ClassDetailPage })));
const StudentsPage = lazy(() => import('../modules/students/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import('../modules/students/StudentDetailPage').then((m) => ({ default: m.StudentDetailPage })));
const AttendancePage = lazy(() => import('../modules/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const ConductPage = lazy(() => import('../modules/conduct/ConductPage').then((m) => ({ default: m.ConductPage })));
const HonorBoardListPage = lazy(() => import('../modules/conduct/honor-board/HonorBoardListPage').then((m) => ({ default: m.HonorBoardListPage })));
const HonorBoardCreateWizard = lazy(() => import('../modules/conduct/honor-board/HonorBoardCreateWizard').then((m) => ({ default: m.HonorBoardCreateWizard })));
const HonorBoardDetailPage = lazy(() => import('../modules/conduct/honor-board/HonorBoardDetailPage').then((m) => ({ default: m.HonorBoardDetailPage })));
const HonorBoardPresentPage = lazy(() => import('../modules/conduct/honor-board/HonorBoardPresentPage').then((m) => ({ default: m.HonorBoardPresentPage })));
const HonorBoardHistoryPage = lazy(() => import('../modules/conduct/honor-board/HonorBoardHistoryPage').then((m) => ({ default: m.HonorBoardHistoryPage })));
const EvaluationsPage = lazy(() => import('../modules/evaluations/EvaluationsPage').then((m) => ({ default: m.EvaluationsPage })));
const GiftsPage = lazy(() => import('../modules/gifts/GiftsPage').then((m) => ({ default: m.GiftsPage })));
const GiftPresentationPage = lazy(() => import('../modules/gifts/GiftPresentationPage').then((m) => ({ default: m.GiftPresentationPage })));
const ParentContactsPage = lazy(() => import('../modules/parent-contacts/ParentContactsPage').then((m) => ({ default: m.ParentContactsPage })));
const ReportsLayoutPage = lazy(() => import('../modules/reports/ReportsLayoutPage').then((m) => ({ default: m.ReportsLayoutPage })));
const ReportsOverviewPage = lazy(() => import('../modules/reports/ReportsOverviewPage').then((m) => ({ default: m.ReportsOverviewPage })));
const AttendanceReportPage = lazy(() => import('../modules/reports/AttendanceReportPage').then((m) => ({ default: m.AttendanceReportPage })));
const PointsRanksReportPage = lazy(() => import('../modules/reports/PointsRanksReportPage').then((m) => ({ default: m.PointsRanksReportPage })));
const EngagementReportPage = lazy(() => import('../modules/reports/EngagementReportPage').then((m) => ({ default: m.EngagementReportPage })));
const HonorsReportPage = lazy(() => import('../modules/reports/HonorsReportPage').then((m) => ({ default: m.HonorsReportPage })));
const ClassComparisonPage = lazy(() => import('../modules/reports/ClassComparisonPage').then((m) => ({ default: m.ClassComparisonPage })));
const StudentReportPage = lazy(() => import('../modules/reports/StudentReportPage').then((m) => ({ default: m.StudentReportPage })));
const ReportPresentationPage = lazy(() => import('../modules/reports/ReportPresentationPage').then((m) => ({ default: m.ReportPresentationPage })));
const BackupPage = lazy(() => import('../modules/backup/BackupPage').then((m) => ({ default: m.BackupPage })));
const TrashPage = lazy(() => import('../modules/trash/TrashPage').then((m) => ({ default: m.TrashPage })));
const AuditLogPage = lazy(() => import('../modules/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const PrivacyStoragePage = lazy(() => import('../modules/privacy/PrivacyStoragePage').then((m) => ({ default: m.PrivacyStoragePage })));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const LiveClassroomDashboard = lazy(() => import('../modules/live-classroom/LiveClassroomDashboard').then((m) => ({ default: m.LiveClassroomDashboard })));
const CreateLiveSessionPage = lazy(() => import('../modules/live-classroom/CreateLiveSessionPage').then((m) => ({ default: m.CreateLiveSessionPage })));
const LiveClassroomActivePage = lazy(() => import('../modules/live-classroom/LiveClassroomActivePage').then((m) => ({ default: m.LiveClassroomActivePage })));
const LiveClassroomPresentPage = lazy(() => import('../modules/live-classroom/LiveClassroomPresentPage').then((m) => ({ default: m.LiveClassroomPresentPage })));
const LiveClassroomHistoryPage = lazy(() => import('../modules/live-classroom/LiveClassroomHistoryPage').then((m) => ({ default: m.LiveClassroomHistoryPage })));

export const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<LoadingSkeleton type="card" count={3} />}>
        <OnboardingPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><DashboardPage /></Suspense> },
      { path: 'academic-years', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><AcademicYearsPage /></Suspense> },
      { path: 'classes', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ClassesPage /></Suspense> },
      { path: 'classes/:classId', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ClassDetailPage /></Suspense> },
      { path: 'students', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><StudentsPage /></Suspense> },
      { path: 'students/:studentId', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><StudentDetailPage /></Suspense> },
      { path: 'attendance', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><AttendancePage /></Suspense> },
      { path: 'conduct', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ConductPage /></Suspense> },
      { path: 'conduct/ranks', element: <Navigate to="/conduct" replace /> },
      { path: 'conduct/honor-board', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardListPage /></Suspense> },
      { path: 'conduct/honor-board/new', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardCreateWizard /></Suspense> },
      { path: 'conduct/honor-board/:boardId', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardDetailPage /></Suspense> },
      { path: 'conduct/honor-board/:boardId/edit', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardCreateWizard /></Suspense> },
      { path: 'conduct/honor-board/:boardId/present', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardPresentPage /></Suspense> },
      { path: 'conduct/honor-board/history', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorBoardHistoryPage /></Suspense> },
      { path: 'evaluations', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><EvaluationsPage /></Suspense> },
      { path: 'gifts', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><GiftsPage /></Suspense> },
      { path: 'gifts/presentation', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><GiftPresentationPage /></Suspense> },
      { path: 'parent-contacts', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ParentContactsPage /></Suspense> },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<LoadingSkeleton type="card" count={3} />}>
            <ReportsLayoutPage />
          </Suspense>
        ),
        children: [
          { index: true, element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ReportsOverviewPage /></Suspense> },
          { path: 'attendance', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><AttendanceReportPage /></Suspense> },
          { path: 'points-ranks', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><PointsRanksReportPage /></Suspense> },
          { path: 'engagement', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><EngagementReportPage /></Suspense> },
          { path: 'honors', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><HonorsReportPage /></Suspense> },
          { path: 'compare', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ClassComparisonPage /></Suspense> },
        ],
      },
      { path: 'reports/student/:studentId', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><StudentReportPage /></Suspense> },
      { path: 'reports/presentation', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><ReportPresentationPage /></Suspense> },
      { path: 'live-classroom', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><LiveClassroomDashboard /></Suspense> },
      { path: 'live-classroom/new', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><CreateLiveSessionPage /></Suspense> },
      { path: 'live-classroom/:sessionId', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><LiveClassroomActivePage /></Suspense> },
      { path: 'live-classroom/:sessionId/present', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><LiveClassroomPresentPage /></Suspense> },
      { path: 'live-classroom/history', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><LiveClassroomHistoryPage /></Suspense> },
      { path: 'backup', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><BackupPage /></Suspense> },
      { path: 'trash', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><TrashPage /></Suspense> },
      { path: 'audit-logs', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><AuditLogPage /></Suspense> },
      { path: 'privacy', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><PrivacyStoragePage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<LoadingSkeleton type="card" count={3} />}><SettingsPage /></Suspense> },
    ],
  },
]);

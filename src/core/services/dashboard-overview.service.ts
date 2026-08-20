import { db } from '../database/db';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import { rankSeedService } from './rank-seed.service';
import { settingsRepository } from '../repositories/settings.repository';
import {
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
  resolveAvatarProgressLevelFromScore,
} from './avatar-theme-registry';
import type { AvatarProgressLevel } from '../types/avatar-theme.types';
import type {
  Student,
  RankLevel,
  StudentRankHistory,
} from '../database/types';

export interface DashboardGreeting {
  salutation: string; // Chào buổi sáng / Chào buổi chiều / Chào buổi tối
  teacherName: string;
  teacherAvatar?: string;
  className: string;
  dateVietnamese: string;
  academicYearName: string;
  termName: string;
  quote: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface DashboardTaskItem {
  id: string;
  type: 'attendance_missing' | 'attendance_draft' | 'parent_followup' | 'student_attention' | 'backup_needed' | 'live_session_active';
  title: string;
  description: string;
  priority: TaskPriority;
  actionLabel: string;
  actionRoute: string;
}

export interface DashboardKPIStatsData {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  excusedAbsentToday: number;
  unexcusedAbsentToday: number;
  lateToday: number;
  isAttendanceTaken: boolean;
  presentComparisonText?: string;
  todayPointsAwarded: number;
  todayMeritCount: number;
  recentPromotionsCount: number;
}

export interface DashboardAttendanceDonutItem {
  name: string;
  count: number;
  percentage: number;
  colorHex: string;
}

export interface DashboardPointTrendItem {
  date: string;
  label: string;
  meritPoints: number;
  demeritPoints: number;
  netPoints: number;
}

export interface DashboardLevelCountItem {
  level: AvatarProgressLevel;
  name: string;
  shortLabel: string;
  count: number;
  minPoints: number;
  cardBaseColor: string;
}

export interface DashboardNearPromotionStudent {
  student: Student;
  currentLevel: number;
  currentLevelName?: string;
  nextLevel?: number;
  nextLevelName?: string;
  effectivePoints: number;
  pointsToNextRank: number;
  progressPercent: number;
  currentRank?: RankLevel;
  nextRank?: RankLevel | null;
}

export interface DashboardRankJourneyData {
  groupCounts: {
    'Hạ sĩ quan và Binh sĩ': number;
    'Cấp Úy': number;
    'Cấp Tá': number;
    'Cấp Tướng': number;
  };
  levelCounts?: Record<number, number>;
  levelsDistribution?: DashboardLevelCountItem[];
  mostPopularRank: { level: number; name: string; shortLabel?: string } | RankLevel | null;
  popularCount: number;
  classAveragePoints: number;
  nearPromotionStudents: DashboardNearPromotionStudent[];
  recentPromotions: (StudentRankHistory & { studentName: string; rankLevel: RankLevel })[];
}

export interface DashboardSpotlightStudent {
  student: Student;
  reason: string;
  badgeLabel: string;
  badgeType: 'success' | 'warning' | 'info';
  currentRank?: RankLevel | null;
  detailText?: string;
  score?: number;
  avatarLevel?: AvatarProgressLevel;
}

export interface DashboardUpcomingBirthday {
  student: Student;
  daysLeft: number;
  dateStr: string;
  isToday: boolean;
}

export interface DashboardRecentActivityItem {
  id: string;
  type: 'attendance' | 'point' | 'rank' | 'note' | 'parent' | 'backup' | 'live';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  actionRoute?: string;
}

export interface DashboardBackupHealthData {
  status: 'safe' | 'warning' | 'danger';
  lastBackupDate: string | null;
  daysSinceLastBackup: number | null;
  totalRecordsCount: number;
}

export interface FullDashboardOverviewResult {
  greeting: DashboardGreeting;
  tasks: DashboardTaskItem[];
  kpiStats: DashboardKPIStatsData;
  attendanceDonut: {
    total: number;
    data: DashboardAttendanceDonutItem[];
  };
  pointTrend: DashboardPointTrendItem[];
  rankJourney: DashboardRankJourneyData;
  spotlights: {
    positive: DashboardSpotlightStudent[];
    attention: DashboardSpotlightStudent[];
  };
  birthdays: {
    todayCount: number;
    items: DashboardUpcomingBirthday[];
  };
  recentActivities: DashboardRecentActivityItem[];
  backupHealth: DashboardBackupHealthData;
}

// Pedagogical inspiring quotes for primary school homeroom teachers
const PEDAGOGICAL_QUOTES = [
  'Mỗi ngày đến trường là một ngày vui và tràn đầy năng lượng tích cực!',
  'Khích lệ và khen ngợi đúng lúc là chiếc chìa khóa vàng mở lối tiềm năng học trò.',
  'Sự ân cần và kiên nhẫn của thầy cô là bệ phóng vững chắc cho tương lai các em.',
  'Học tập là một hành trình khám phá diệu kỳ của tuổi thơ.',
  'Thắp sáng niềm say mê học tập trong từng ánh mắt trẻ thơ.',
];

export class DashboardOverviewService {
  /**
   * 1. Sinh thông tin chào mừng và câu nói sư phạm
   */
  async getGreetingInfo(classId?: string, academicYearId?: string): Promise<DashboardGreeting> {
    const now = new Date();
    const hour = now.getHours();

    let salutation = 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) {
      salutation = 'Chào buổi chiều';
    } else if (hour >= 18 || hour < 5) {
      salutation = 'Chào buổi tối';
    }

    // Teacher profile name & avatar
    const profile = await db.teacherProfiles.toCollection().first();
    const teacherName = profile?.fullName ? `thầy/cô ${profile.fullName}` : 'Thầy/Cô Chủ Nhiệm';
    const teacherAvatar = profile?.avatar || undefined;

    // Class name
    let className = 'Lớp học';
    if (classId) {
      const cls = await db.classes.get(classId);
      if (cls) className = `Lớp ${cls.name}`;
    }

    // Academic Year
    let academicYearName = 'Năm học hiện tại';
    if (academicYearId) {
      const yr = await db.academicYears.get(academicYearId);
      if (yr) academicYearName = yr.name;
    }

    // Active Term
    const terms = await db.terms.filter((t) => !t.deletedAt && t.isActive).toArray();
    const termName = terms[0]?.name || 'Học kỳ 1';

    const quote = PEDAGOGICAL_QUOTES[now.getDay() % PEDAGOGICAL_QUOTES.length]!;

    return {
      salutation,
      teacherName,
      teacherAvatar,
      className,
      dateVietnamese: formatDateVietnamese(getTodayDateString()),
      academicYearName,
      termName,
      quote,
    };
  }

  /**
   * 2. Lấy danh sách việc cần làm hôm nay (To-Do / Action Center)
   */
  async getTodayTasks(classId?: string): Promise<DashboardTaskItem[]> {
    const tasks: DashboardTaskItem[] = [];
    const today = getTodayDateString();

    if (!classId) return tasks;

    // 1. Kiểm tra điểm danh hôm nay
    const todaySession = await db.attendanceSessions
      .where('[classId+sessionDate]')
      .equals([classId, today])
      .first();

    if (!todaySession) {
      tasks.push({
        id: 'task-attendance-missing',
        type: 'attendance_missing',
        title: 'Chưa thực hiện điểm danh hôm nay',
        description: 'Vui lòng hoàn thành điểm danh sĩ số đầu giờ cho lớp.',
        priority: 'high',
        actionLabel: 'Điểm danh ngay',
        actionRoute: '/attendance',
      });
    } else if (todaySession.status === 'Pending') {
      tasks.push({
        id: 'task-attendance-draft',
        type: 'attendance_draft',
        title: 'Phiên điểm danh hôm nay còn ở dạng bản nháp',
        description: 'Có dữ liệu điểm danh chưa được lưu chính thức.',
        priority: 'medium',
        actionLabel: 'Hoàn tất điểm danh',
        actionRoute: '/attendance',
      });
    }

    // 2. Kiểm tra lịch hẹn liên hệ phụ huynh hôm nay hoặc quá hạn
    const pendingInteractions = await db.parentInteractions
      .where('classId')
      .equals(classId)
      .filter((i) => !i.deletedAt && i.status === 'Pending' && (i.followUpDate ? i.followUpDate <= today : true))
      .toArray();

    if (pendingInteractions.length > 0) {
      tasks.push({
        id: 'task-parent-followup',
        type: 'parent_followup',
        title: `Có ${pendingInteractions.length} phụ huynh cần liên hệ hôm nay`,
        description: `Ghi chú hẹn tái liên lạc về tình hình học tập và nề nếp.`,
        priority: 'high',
        actionLabel: 'Xem danh sách',
        actionRoute: '/parent-contacts',
      });
    }

    // 3. Kiểm tra sao lưu dữ liệu
    const lastBackup = await db.backupHistory.reverse().sortBy('createdAt');
    let daysSinceBackup = 999;
    if (lastBackup.length > 0 && lastBackup[0]?.createdAt) {
      const bDate = new Date(lastBackup[0].createdAt);
      daysSinceBackup = Math.floor((new Date().getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (daysSinceBackup >= 7) {
      tasks.push({
        id: 'task-backup-needed',
        type: 'backup_needed',
        title: daysSinceBackup >= 900 ? 'Chưa từng tạo bản sao lưu dữ liệu' : `Đã ${daysSinceBackup} ngày chưa sao lưu dữ liệu`,
        description: 'Sao lưu định kỳ giúp bảo vệ an toàn toàn bộ sổ điểm và nhận xét.',
        priority: daysSinceBackup >= 14 ? 'high' : 'medium',
        actionLabel: 'Sao lưu ngay',
        actionRoute: '/backup',
      });
    }

    // 4. Kiểm tra phiên lớp trực tuyến đang chạy
    const activeLiveSessions = await db.liveClassSessions
      .where('classId')
      .equals(classId)
      .filter((s) => s.status === 'active' || s.status === 'paused')
      .toArray();

    if (activeLiveSessions.length > 0) {
      tasks.push({
        id: 'task-live-active',
        type: 'live_session_active',
        title: 'Có phiên lớp học tương tác đang diễn ra',
        description: `Phiên "${activeLiveSessions[0]?.title}" đang hoạt động.`,
        priority: 'medium',
        actionLabel: 'Vào lớp ngay',
        actionRoute: `/live-classroom/${activeLiveSessions[0]?.id}`,
      });
    }

    return tasks;
  }

  /**
   * 3. Lấy 5 thẻ thống kê KPI
   */
  async getTodayKPIStats(classId?: string, academicYearId?: string): Promise<DashboardKPIStatsData> {
    const today = getTodayDateString();

    if (!classId) {
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        excusedAbsentToday: 0,
        unexcusedAbsentToday: 0,
        lateToday: 0,
        isAttendanceTaken: false,
        todayPointsAwarded: 0,
        todayMeritCount: 0,
        recentPromotionsCount: 0,
      };
    }

    // Enrollments
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();
    const totalStudents = enrollments.length;

    // Attendance Today
    let presentToday = 0;
    let absentToday = 0;
    let excusedAbsentToday = 0;
    let unexcusedAbsentToday = 0;
    let lateToday = 0;
    let isAttendanceTaken = false;

    const todaySession = await db.attendanceSessions
      .where('[classId+sessionDate]')
      .equals([classId, today])
      .first();

    if (todaySession) {
      isAttendanceTaken = true;
      const records = await db.attendanceRecords
        .where('sessionId')
        .equals(todaySession.id)
        .filter((r) => !r.deletedAt)
        .toArray();

      records.forEach((r) => {
        if (r.status === 'Present') {
          presentToday++;
        } else if (r.status === 'Late' || r.status === 'EarlyLeave') {
          presentToday++;
          lateToday++;
        } else if (r.status === 'ExcusedAbsence') {
          absentToday++;
          excusedAbsentToday++;
        } else if (r.status === 'UnexcusedAbsence') {
          absentToday++;
          unexcusedAbsentToday++;
        }
      });
    }

    // Points Awarded Today
    const todayPoints = await db.pointEntries
      .where('classId')
      .equals(classId)
      .filter((p) => !p.deletedAt && p.occurredAt === today)
      .toArray();

    let todayPointsAwarded = 0;
    let todayMeritCount = 0;
    todayPoints.forEach((p) => {
      todayPointsAwarded += p.points;
      if (p.points > 0) todayMeritCount++;
    });

    // Recent Promotions
    let recentPromotionsCount = 0;
    if (academicYearId) {
      const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
      const promoHistories = await db.studentRankHistory
        .where('classId')
        .equals(classId)
        .filter((h) => h.rankSystemId === system.id && h.changeType === 'promotion')
        .toArray();
      recentPromotionsCount = promoHistories.length;
    }

    return {
      totalStudents,
      presentToday,
      absentToday,
      excusedAbsentToday,
      unexcusedAbsentToday,
      lateToday,
      isAttendanceTaken,
      todayPointsAwarded,
      todayMeritCount,
      recentPromotionsCount,
    };
  }

  /**
   * 4. Biểu đồ tròn chuyên cần hôm nay (Donut Chart)
   */
  async getAttendanceDonutData(classId?: string): Promise<{ total: number; data: DashboardAttendanceDonutItem[] }> {
    const today = getTodayDateString();

    if (!classId) {
      return { total: 0, data: [] };
    }

    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();
    const total = enrollments.length;

    let present = 0;
    let late = 0;
    let excused = 0;
    let unexcused = 0;

    const todaySession = await db.attendanceSessions
      .where('[classId+sessionDate]')
      .equals([classId, today])
      .first();

    if (todaySession) {
      const records = await db.attendanceRecords
        .where('sessionId')
        .equals(todaySession.id)
        .filter((r) => !r.deletedAt)
        .toArray();

      records.forEach((r) => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Late' || r.status === 'EarlyLeave') late++;
        else if (r.status === 'ExcusedAbsence') excused++;
        else if (r.status === 'UnexcusedAbsence') unexcused++;
      });
    }

    const checkedTotal = present + late + excused + unexcused;
    const notChecked = Math.max(0, total - checkedTotal);

    const data: DashboardAttendanceDonutItem[] = [
      { name: 'Có mặt đúng giờ', count: present, percentage: total > 0 ? Math.round((present / total) * 100) : 0, colorHex: '#10b981' },
      { name: 'Đi muộn / Về sớm', count: late, percentage: total > 0 ? Math.round((late / total) * 100) : 0, colorHex: '#f59e0b' },
      { name: 'Vắng có phép', count: excused, percentage: total > 0 ? Math.round((excused / total) * 100) : 0, colorHex: '#3b82f6' },
      { name: 'Vắng không phép', count: unexcused, percentage: total > 0 ? Math.round((unexcused / total) * 100) : 0, colorHex: '#ef4444' },
    ];

    if (notChecked > 0) {
      data.push({
        name: 'Chưa điểm danh',
        count: notChecked,
        percentage: total > 0 ? Math.round((notChecked / total) * 100) : 0,
        colorHex: '#cbd5e1',
      });
    }

    return { total, data };
  }

  /**
   * 5. Biểu đồ miền xu hướng điểm thi đua theo ngày (Recharts Area Chart)
   */
  async getPointTrendData(classId?: string, days: number = 7): Promise<DashboardPointTrendItem[]> {
    if (!classId) return [];

    const now = new Date();
    const result: DashboardPointTrendItem[] = [];
    const dateKeys: string[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      dateKeys.push(dateStr);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        date: dateStr,
        label: dayLabel,
        meritPoints: 0,
        demeritPoints: 0,
        netPoints: 0,
      });
    }

    const minDate = dateKeys[0]!;
    const maxDate = dateKeys[dateKeys.length - 1]!;

    const entries = await db.pointEntries
      .where('classId')
      .equals(classId)
      .filter((p) => !p.deletedAt && p.occurredAt >= minDate && p.occurredAt <= maxDate)
      .toArray();

    const dateMap = new Map<string, { merit: number; demerit: number }>();
    dateKeys.forEach((k) => dateMap.set(k, { merit: 0, demerit: 0 }));

    entries.forEach((e) => {
      const cur = dateMap.get(e.occurredAt);
      if (cur) {
        if (e.points > 0) cur.merit += e.points;
        else cur.demerit += Math.abs(e.points);
      }
    });

    return result.map((item) => {
      const stats = dateMap.get(item.date) || { merit: 0, demerit: 0 };
      return {
        ...item,
        meritPoints: stats.merit,
        demeritPoints: stats.demerit,
        netPoints: stats.merit - stats.demerit,
      };
    });
  }

  /**
   * 6. Hành trình cấp bậc của lớp & danh sách sắp thăng cấp (5 Cấp Avatar Toàn Cục)
   */
  async getRankJourneyData(classId?: string, _academicYearId?: string): Promise<DashboardRankJourneyData> {
    const emptyResult: DashboardRankJourneyData = {
      groupCounts: {
        'Hạ sĩ quan và Binh sĩ': 0,
        'Cấp Úy': 0,
        'Cấp Tá': 0,
        'Cấp Tướng': 0,
      },
      levelCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      levelsDistribution: [],
      mostPopularRank: null,
      popularCount: 0,
      classAveragePoints: 0,
      nearPromotionStudents: [],
      recentPromotions: [],
    };

    if (!classId) return emptyResult;

    try {
      // 1. Load settings & levels
      const settings = await settingsRepository.getSettings();
      const sysSettings = settings?.avatarSystemSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
      const levels = sysSettings.levels;
      const thresholds = levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));

      // 2. Load active enrollments
      const enrollments = await db.classEnrollments
        .where('classId')
        .equals(classId)
        .filter((e) => !e.deletedAt && e.status === 'Active')
        .toArray();

      if (enrollments.length === 0) return emptyResult;
      const studentIds = enrollments.map((e) => e.studentId);

      // 3. Batch load point entries
      const pointEntries = await db.pointEntries
        .where('classId')
        .equals(classId)
        .filter((p) => !p.deletedAt)
        .toArray();

      const pointsMap = new Map<string, number>();
      for (const pe of pointEntries) {
        pointsMap.set(pe.studentId, (pointsMap.get(pe.studentId) || 0) + pe.points);
      }

      // 4. Batch load students
      const allStudents = await db.students.toArray();
      const activeStudents = allStudents.filter((s) => !s.deletedAt && studentIds.includes(s.id));

      const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sumPoints = 0;
      const nearPromoList: DashboardNearPromotionStudent[] = [];

      for (const st of activeStudents) {
        const pts = pointsMap.get(st.id) || 0;
        sumPoints += pts;
        const lvl = resolveAvatarProgressLevelFromScore(pts, thresholds);
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;

        const currentDef = levels.find((l) => l.level === lvl) || levels[0]!;
        const nextDef = levels.find((l) => l.level === lvl + 1);

        if (nextDef) {
          const pointsToNext = Math.max(0, nextDef.minPoints - pts);
          const range = nextDef.minPoints - currentDef.minPoints;
          const progressPercent = range > 0
            ? Math.min(100, Math.max(0, Math.round(((pts - currentDef.minPoints) / range) * 100)))
            : 100;

          if (progressPercent >= 60 || pointsToNext <= 50) {
            nearPromoList.push({
              student: st,
              currentLevel: lvl,
              currentLevelName: currentDef.name,
              nextLevel: nextDef.level,
              nextLevelName: nextDef.name,
              effectivePoints: pts,
              pointsToNextRank: pointsToNext,
              progressPercent,
            });
          }
        }
      }

      // Sort near promotions: closest to next rank first
      nearPromoList.sort((a, b) => {
        if (a.pointsToNextRank !== b.pointsToNextRank) return a.pointsToNextRank - b.pointsToNextRank;
        return b.progressPercent - a.progressPercent;
      });

      // 5. Popular Level
      let maxCount = 0;
      let popularLevel = 1;
      for (const [lvlStr, count] of Object.entries(levelCounts)) {
        const countNum = Number(count);
        if (countNum > maxCount) {
          maxCount = countNum;
          popularLevel = parseInt(lvlStr, 10);
        }
      }
      const mostPopularDef = levels.find((l) => l.level === popularLevel) || levels[0]!;

      // 6. Format levels distribution
      const levelsDistribution: DashboardLevelCountItem[] = levels.map((l) => ({
        level: l.level,
        name: l.name,
        shortLabel: l.shortLabel || `Cấp ${l.level}`,
        count: levelCounts[l.level] || 0,
        minPoints: l.minPoints,
        cardBaseColor: l.cardBaseColor,
      }));

      // Backward compatible group counts for legacy tests
      const groupCounts = {
        'Hạ sĩ quan và Binh sĩ': (levelCounts[1] ?? 0) + (levelCounts[2] ?? 0),
        'Cấp Úy': levelCounts[3] ?? 0,
        'Cấp Tá': levelCounts[4] ?? 0,
        'Cấp Tướng': levelCounts[5] ?? 0,
      };

      return {
        groupCounts,
        levelCounts,
        levelsDistribution,
        mostPopularRank: {
          level: mostPopularDef.level,
          name: mostPopularDef.name,
          shortLabel: mostPopularDef.shortLabel,
        },
        popularCount: maxCount,
        classAveragePoints: activeStudents.length > 0 ? Math.round(sumPoints / activeStudents.length) : 0,
        nearPromotionStudents: nearPromoList.slice(0, 5),
        recentPromotions: [],
      };
    } catch (err) {
      console.error('Error fetching dashboard rank journey:', err);
      return emptyResult;
    }
  }

  /**
   * 7. Học sinh nổi bật & Học sinh cần quan tâm theo dõi (Spotlights)
   */
  async getStudentSpotlights(classId?: string): Promise<{
    positive: DashboardSpotlightStudent[];
    attention: DashboardSpotlightStudent[];
  }> {
    const result = {
      positive: [] as DashboardSpotlightStudent[],
      attention: [] as DashboardSpotlightStudent[],
    };

    if (!classId) return result;

    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();

    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) return result;

    // Load total cumulative points to pass score for proper 5-level avatar
    const allClassPointEntries = await db.pointEntries
      .where('classId')
      .equals(classId)
      .filter((p) => !p.deletedAt)
      .toArray();

    const cumulativePointsMap = new Map<string, number>();
    const meritCountMap = new Map<string, number>();

    allClassPointEntries.forEach((p) => {
      cumulativePointsMap.set(p.studentId, (cumulativePointsMap.get(p.studentId) || 0) + p.points);
      if (p.points > 0) {
        meritCountMap.set(p.studentId, (meritCountMap.get(p.studentId) || 0) + p.points);
      }
    });

    const sortedMeritStudents = Array.from(meritCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    for (const [stId, totalPts] of sortedMeritStudents) {
      const st = await db.students.get(stId);
      if (st && !st.deletedAt) {
        result.positive.push({
          student: st,
          reason: 'Tích cực tham gia phát biểu & học tập',
          badgeLabel: `+${totalPts} điểm`,
          badgeType: 'success',
          detailText: 'Đóng góp nhiều lượt phát biểu sôi nổi',
          score: cumulativePointsMap.get(stId) || 0,
        });
      }
    }

    // B. Học sinh cần theo dõi (Vắng nhiều buổi hoặc có ghi chú chưa xử lý)
    const attendanceRecords = await db.attendanceRecords
      .filter((r) => !r.deletedAt && studentIds.includes(r.studentId) && (r.status === 'ExcusedAbsence' || r.status === 'UnexcusedAbsence' || r.status === 'Late'))
      .toArray();

    const absentCountMap = new Map<string, number>();
    attendanceRecords.forEach((r) => {
      absentCountMap.set(r.studentId, (absentCountMap.get(r.studentId) || 0) + 1);
    });

    const sortedAttention = Array.from(absentCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    for (const [stId, count] of sortedAttention) {
      const st = await db.students.get(stId);
      if (st && !st.deletedAt) {
        result.attention.push({
          student: st,
          reason: 'Cần động viên chuyên cần',
          badgeLabel: `${count} buổi vắng/muộn`,
          badgeType: 'warning',
          detailText: 'Thầy cô nên trò chuyện, thăm hỏi lý do',
          score: cumulativePointsMap.get(stId) || 0,
        });
      }
    }

    return result;
  }

  /**
   * 8. Sinh nhật & Sự kiện sắp tới
   */
  async getUpcomingBirthdaysAndEvents(classId?: string, days: number = 30): Promise<{
    todayCount: number;
    items: DashboardUpcomingBirthday[];
  }> {
    if (!classId) return { todayCount: 0, items: [] };

    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();

    const studentIds = enrollments.map((e) => e.studentId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const list: DashboardUpcomingBirthday[] = [];
    let todayCount = 0;

    for (const stId of studentIds) {
      const st = await db.students.get(stId);
      if (st && !st.deletedAt && st.dateOfBirth) {
        const parts = st.dateOfBirth.split('-');
        if (parts.length === 3) {
          const dobMonth = parseInt(parts[1]!, 10);
          const dobDay = parseInt(parts[2]!, 10);

          let diffDays = (dobMonth - currentMonth) * 30 + (dobDay - currentDay);
          if (diffDays < 0) diffDays += 365;

          if (diffDays >= 0 && diffDays <= days) {
            const isToday = diffDays === 0;
            if (isToday) todayCount++;
            list.push({
              student: st,
              daysLeft: diffDays,
              dateStr: `${String(dobDay).padStart(2, '0')}/${String(dobMonth).padStart(2, '0')}`,
              isToday,
            });
          }
        }
      }
    }

    list.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      todayCount,
      items: list.slice(0, 6),
    };
  }

  /**
   * 9. Dòng thời gian hoạt động gần đây (Activity Timeline)
   */
  async getRecentActivities(classId?: string, limit: number = 8): Promise<DashboardRecentActivityItem[]> {
    const activities: DashboardRecentActivityItem[] = [];

    // 1. Point entries
    let pointQuery = db.pointEntries.filter((p) => !p.deletedAt);
    if (classId) pointQuery = db.pointEntries.where('classId').equals(classId).filter((p) => !p.deletedAt);
    const recentPoints = await pointQuery.reverse().limit(5).toArray();

    for (const p of recentPoints) {
      const st = await db.students.get(p.studentId);
      activities.push({
        id: `act-pt-${p.id}`,
        type: 'point',
        title: `${st ? st.fullName : 'Học sinh'} ${p.points >= 0 ? 'được cộng' : 'bị trừ'} ${Math.abs(p.points)} điểm`,
        description: p.reason || 'Điểm thi đua rèn luyện',
        timestamp: p.createdAt,
        relativeTime: this.formatRelativeTime(p.createdAt),
        actionRoute: '/conduct',
      });
    }

    // 2. Rank Promotions
    let rankQuery = db.studentRankHistory.filter((h) => h.changeType === 'promotion');
    if (classId) rankQuery = db.studentRankHistory.where('classId').equals(classId).filter((h) => h.changeType === 'promotion');
    const recentRanks = await rankQuery.reverse().limit(4).toArray();

    for (const r of recentRanks) {
      const st = await db.students.get(r.studentId);
      activities.push({
        id: `act-rnk-${r.id}`,
        type: 'rank',
        title: `🚀 ${st ? st.fullName : 'Học sinh'} vừa thăng cấp thi đua`,
        description: `Đạt Cấp bậc ${r.toLevel}/17`,
        timestamp: r.createdAt,
        relativeTime: this.formatRelativeTime(r.createdAt),
        actionRoute: '/conduct/ranks',
      });
    }

    // 3. Attendance Sessions
    let attQuery = db.attendanceSessions.filter((a) => !a.deletedAt);
    if (classId) attQuery = db.attendanceSessions.where('classId').equals(classId).filter((a) => !a.deletedAt);
    const recentAtt = await attQuery.reverse().limit(3).toArray();

    for (const a of recentAtt) {
      activities.push({
        id: `act-att-${a.id}`,
        type: 'attendance',
        title: `Đã hoàn thành điểm danh ngày ${formatDateVietnamese(a.sessionDate)}`,
        description: `Sĩ số có mặt: ${a.totalPresent ?? 0} em`,
        timestamp: a.createdAt,
        relativeTime: this.formatRelativeTime(a.createdAt),
        actionRoute: '/attendance',
      });
    }

    // Sort chronologically descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  }

  /**
   * 10. Tình trạng an toàn dữ liệu & sao lưu
   */
  async getBackupHealth(): Promise<DashboardBackupHealthData> {
    const lastBackup = await db.backupHistory.reverse().sortBy('createdAt');
    let daysSinceLastBackup: number | null = null;
    let lastBackupDate: string | null = null;

    if (lastBackup.length > 0 && lastBackup[0]?.createdAt) {
      lastBackupDate = lastBackup[0].createdAt;
      const bDate = new Date(lastBackup[0].createdAt);
      daysSinceLastBackup = Math.floor((new Date().getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (daysSinceLastBackup === null || daysSinceLastBackup >= 14) {
      status = 'danger';
    } else if (daysSinceLastBackup >= 7) {
      status = 'warning';
    }

    // Estimate record count across major tables
    const totalRecordsCount =
      (await db.students.count()) +
      (await db.pointEntries.count()) +
      (await db.attendanceRecords.count()) +
      (await db.studentRankHistory.count());

    return {
      status,
      lastBackupDate,
      daysSinceLastBackup,
      totalRecordsCount,
    };
  }

  /**
   * Helper định dạng thời gian tương đối tiếng Việt
   */
  private formatRelativeTime(dateString: string): string {
    try {
      const past = new Date(dateString).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((now - past) / 1000));

      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return 'Hôm qua';
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return formatDateVietnamese(dateString.split('T')[0]!);
    } catch {
      return '';
    }
  }
}

export const dashboardOverviewService = new DashboardOverviewService();

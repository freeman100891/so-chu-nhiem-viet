import { db } from '../database/db';
import { reportRepository } from '../repositories/report.repository';
import { rankCalculationService } from './rank-calculation.service';
import { rankSeedService } from './rank-seed.service';
import { honorTitleRepository } from '../repositories/honor-board.repository';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type {
  Student,
  HonorTitle,
} from '../database/types';

export interface ReportFilterParams {
  classId: string;
  academicYearId: string;
  termId?: string | null;
  studentId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodType: 'today' | 'last_7_days' | 'this_week' | 'this_month' | 'this_term' | 'this_year' | 'custom';
  comparePreviousPeriod?: boolean;
}

export interface MetricWithDelta {
  current: number;
  previous?: number;
  delta?: number;
  percentChange?: number | null; // null if previous === 0
}

export interface ReportKpiData {
  activeStudentsCount: MetricWithDelta;
  attendanceRate: MetricWithDelta;
  meritPoints: MetricWithDelta;
  demeritPoints: MetricWithDelta;
  netPoints: MetricWithDelta;
  engagementRate: MetricWithDelta;
  promotedStudentsCount: MetricWithDelta;
  honorsCount: MetricWithDelta;
}

export interface AttendanceTrendDataPoint {
  date: string;
  label: string;
  rate: number;
  present: number;
  late: number;
  excused: number;
  unexcused: number;
  total: number;
}

export interface AttendanceHeatmapDay {
  date: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  dayOfMonth: number;
  rate: number | null;
  status: 'excellent' | 'good' | 'warning' | 'no_session';
  totalSessions: number;
}

export interface PointTrendDataPoint {
  date: string;
  label: string;
  merit: number;
  demerit: number;
  net: number;
}

export interface RankGroupDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RankLevelDistributionItem {
  level: number;
  code: string;
  name: string;
  group: string;
  count: number;
  color: string;
  students: Student[];
}

export interface RankDistributionData {
  groups: RankGroupDistributionItem[];
  levels: RankLevelDistributionItem[];
}

export interface PromotedStudentDetail {
  studentId: string;
  studentName: string;
  fromLevel: number;
  toLevel: number;
  rankName: string;
  date: string;
  points: number;
}

export interface PromotionHistoryDataPoint {
  periodLabel: string;
  count: number;
  promotions: PromotedStudentDetail[];
}

export interface EngagementData {
  totalEvents: number;
  callsCount: number;
  answersCount: number;
  handRaisesCount: number;
  groupWorkCount: number;
  quickPointsCount: number;
  studentRanking: { studentId: string; studentName: string; interactionCount: number }[];
}

export interface HonorTitleStats {
  title: HonorTitle;
  recipientCount: number;
  recipients: { studentId: string; studentName: string; rankName: string; reason: string; date: string }[];
}

export interface ReportInsight {
  id: string;
  type: 'success' | 'info' | 'warning';
  text: string;
  category: string;
}

export interface AttentionStudentItem {
  studentId: string;
  studentName: string;
  avatar?: string;
  reasons: string[];
  attendanceRate: number;
  demeritCount: number;
  interactionCount: number;
}

export interface FullReportViewModel {
  filter: ReportFilterParams;
  className: string;
  academicYearName: string;
  kpis: ReportKpiData;
  attendanceTrend: AttendanceTrendDataPoint[];
  attendanceHeatmap: AttendanceHeatmapDay[];
  pointTrend: PointTrendDataPoint[];
  rankDistribution: RankDistributionData;
  promotionHistory: PromotionHistoryDataPoint[];
  engagement: EngagementData;
  honorTitlesStats: HonorTitleStats[];
  insights: ReportInsight[];
  attentionStudents: AttentionStudentItem[];
  studentsList: Student[];
}

export class ReportAggregationService {
  /**
   * Tính toán khoảng ngày kỳ so sánh liền trước có cùng số ngày
   */
  getComparisonDateRange(startDate: string, endDate: string): { prevStartDate: string; prevEndDate: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (diffDays - 1));

    return {
      prevStartDate: prevStart.toISOString().split('T')[0]!,
      prevEndDate: prevEnd.toISOString().split('T')[0]!,
    };
  }

  /**
   * Tính toán số liệu chênh lệch (Delta & Percent Change an toàn không chia cho 0)
   */
  calculateMetricDelta(current: number, previous?: number): MetricWithDelta {
    if (previous === undefined) {
      return { current };
    }
    const delta = current - previous;
    let percentChange: number | null = null;

    if (previous !== 0) {
      percentChange = Math.round(((current - previous) / Math.abs(previous)) * 100);
    }

    return {
      current,
      previous,
      delta,
      percentChange,
    };
  }

  /**
   * Tạo báo cáo toàn diện (Single-batch loading, 0 N+1)
   */
  async generateFullReport(filter: ReportFilterParams): Promise<FullReportViewModel> {
    const { classId, academicYearId, startDate, endDate, studentId, comparePreviousPeriod = true } = filter;

    // 1. Tải thông tin lớp học & năm học
    const currentClass = await db.classes.get(classId);
    const className = currentClass ? `Lớp ${currentClass.name}` : 'Lớp học';
    const academicYear = await db.academicYears.get(academicYearId);
    const academicYearName = academicYear ? academicYear.name : 'Năm học';

    // 2. Tải học sinh đang hoạt động trong lớp
    const enrollments = await reportRepository.getActiveEnrollments(classId);
    const studentIds = enrollments.map((e) => e.studentId);
    const studentsMap = await reportRepository.getStudentsMap(studentIds);
    const studentsList = Array.from(studentsMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'vi')
    );

    // 3. Tải hệ thống cấp bậc thi đua của năm học
    const { system } = await rankSeedService.seedDefaultRankSystem(academicYearId);
    const classRanks = await rankCalculationService.recalculateClassRanks(classId, system.id);
    const rankLevels = await db.rankLevels
      .where('rankSystemId')
      .equals(system.id)
      .filter((l) => !l.deletedAt)
      .toArray();
    rankLevels.sort((a, b) => a.level - b.level);

    // 4. Tải dữ liệu kỳ hiện tại (Current Period)
    const { sessions: curSessions, records: curRecords } = await reportRepository.getAttendanceData(
      classId,
      startDate,
      endDate
    );
    const curPoints = await reportRepository.getPointEntries(classId, startDate, endDate, studentId);
    const curHistories = await reportRepository.getRankHistories(classId, startDate, endDate);
    const curEvents = await reportRepository.getLiveClassEvents(classId, startDate, endDate);
    const { boards: curBoards, recipients: curRecipients } = await reportRepository.getPublishedHonors(
      classId,
      startDate,
      endDate
    );

    // 5. Tải dữ liệu kỳ so sánh trước (nếu bật so sánh)
    let prevRecords: typeof curRecords = [];
    let prevPoints: typeof curPoints = [];
    let prevHistories: typeof curHistories = [];
    let prevEvents: typeof curEvents = [];
    let prevRecipients: typeof curRecipients = [];

    if (comparePreviousPeriod) {
      const { prevStartDate, prevEndDate } = this.getComparisonDateRange(startDate, endDate);
      const prevAtt = await reportRepository.getAttendanceData(classId, prevStartDate, prevEndDate);
      prevRecords = prevAtt.records;
      prevPoints = await reportRepository.getPointEntries(classId, prevStartDate, prevEndDate, studentId);
      prevHistories = await reportRepository.getRankHistories(classId, prevStartDate, prevEndDate);
      prevEvents = await reportRepository.getLiveClassEvents(classId, prevStartDate, prevEndDate);
      const prevHonors = await reportRepository.getPublishedHonors(classId, prevStartDate, prevEndDate);
      prevRecipients = prevHonors.recipients;
    }

    // 6. TÍNH TOÁN CÁC CHỈ SỐ KPI
    // a. Chuyên cần
    const calcAttendanceRate = (records: typeof curRecords): number => {
      if (records.length === 0) return 100;
      const attended = records.filter(
        (r) => r.status === 'Present' || r.status === 'Late' || r.status === 'EarlyLeave'
      ).length;
      return Math.round((attended / records.length) * 100);
    };

    const curAttendanceRate = calcAttendanceRate(curRecords);
    const prevAttendanceRate = comparePreviousPeriod ? calcAttendanceRate(prevRecords) : undefined;

    // b. Điểm cộng & Điểm trừ
    const calcMerit = (pts: typeof curPoints) => pts.filter((p) => p.points > 0).reduce((sum, p) => sum + p.points, 0);
    const calcDemerit = (pts: typeof curPoints) => pts.filter((p) => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0);

    const curMerit = calcMerit(curPoints);
    const curDemerit = calcDemerit(curPoints);
    const curNet = curMerit - curDemerit;

    const prevMerit = comparePreviousPeriod ? calcMerit(prevPoints) : undefined;
    const prevDemerit = comparePreviousPeriod ? calcDemerit(prevPoints) : undefined;
    const prevNet = comparePreviousPeriod && prevMerit !== undefined && prevDemerit !== undefined ? prevMerit - prevDemerit : undefined;

    // c. Tương tác lớp học
    const calcEngagementRate = (events: typeof curEvents) => {
      if (studentIds.length === 0) return 0;
      const interactedStudents = new Set(events.map((e) => e.studentId).filter(Boolean));
      return Math.round((interactedStudents.size / studentIds.length) * 100);
    };
    const curEngageRate = calcEngagementRate(curEvents);
    const prevEngageRate = comparePreviousPeriod ? calcEngagementRate(prevEvents) : undefined;

    // d. Học sinh thăng cấp
    const curPromotedCount = new Set(curHistories.filter((h) => h.changeType === 'promotion').map((h) => h.studentId)).size;
    const prevPromotedCount = comparePreviousPeriod
      ? new Set(prevHistories.filter((h) => h.changeType === 'promotion').map((h) => h.studentId)).size
      : undefined;

    // e. Danh hiệu trao
    const curHonorsCount = curRecipients.length;
    const prevHonorsCount = comparePreviousPeriod ? prevRecipients.length : undefined;

    const kpis: ReportKpiData = {
      activeStudentsCount: this.calculateMetricDelta(studentIds.length, comparePreviousPeriod ? studentIds.length : undefined),
      attendanceRate: this.calculateMetricDelta(curAttendanceRate, prevAttendanceRate),
      meritPoints: this.calculateMetricDelta(curMerit, prevMerit),
      demeritPoints: this.calculateMetricDelta(curDemerit, prevDemerit),
      netPoints: this.calculateMetricDelta(curNet, prevNet),
      engagementRate: this.calculateMetricDelta(curEngageRate, prevEngageRate),
      promotedStudentsCount: this.calculateMetricDelta(curPromotedCount, prevPromotedCount),
      honorsCount: this.calculateMetricDelta(curHonorsCount, prevHonorsCount),
    };

    // 7. BIỂU ĐỒ XU HƯỚNG CHUYÊN CẦN (ATTENDANCE TREND)
    const sessionMap = new Map<string, typeof curRecords>();
    curRecords.forEach((r) => {
      const list = sessionMap.get(r.sessionId) || [];
      list.push(r);
      sessionMap.set(r.sessionId, list);
    });

    const attendanceTrend: AttendanceTrendDataPoint[] = curSessions.map((s) => {
      const recs = sessionMap.get(s.id) || [];
      const present = recs.filter((r) => r.status === 'Present').length;
      const late = recs.filter((r) => r.status === 'Late' || r.status === 'EarlyLeave').length;
      const excused = recs.filter((r) => r.status === 'ExcusedAbsence').length;
      const unexcused = recs.filter((r) => r.status === 'UnexcusedAbsence').length;
      const total = recs.length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return {
        date: s.sessionDate,
        label: formatDateVietnamese(s.sessionDate),
        rate,
        present,
        late,
        excused,
        unexcused,
        total,
      };
    });

    // 8. LỊCH NHIỆT CHUYÊN CẦN (HEATMAP)
    const attendanceHeatmap: AttendanceHeatmapDay[] = [];
    const dStart = new Date(startDate);
    const dEnd = new Date(endDate);
    const curDateIter = new Date(dStart);

    const sessionByDateMap = new Map<string, AttendanceTrendDataPoint>();
    attendanceTrend.forEach((pt) => sessionByDateMap.set(pt.date, pt));

    while (curDateIter <= dEnd) {
      const dateStr = curDateIter.toISOString().split('T')[0]!;
      const sessionData = sessionByDateMap.get(dateStr);
      let status: AttendanceHeatmapDay['status'] = 'no_session';
      let rate: number | null = null;

      if (sessionData) {
        rate = sessionData.rate;
        if (rate >= 95) status = 'excellent';
        else if (rate >= 85) status = 'good';
        else status = 'warning';
      }

      attendanceHeatmap.push({
        date: dateStr,
        dayOfWeek: curDateIter.getDay(),
        dayOfMonth: curDateIter.getDate(),
        rate,
        status,
        totalSessions: sessionData ? 1 : 0,
      });

      curDateIter.setDate(curDateIter.getDate() + 1);
    }

    // 9. BIỂU ĐỒ BIẾN ĐỘNG ĐIỂM (POINT TREND)
    const pointByDateMap = new Map<string, { merit: number; demerit: number }>();
    curPoints.forEach((p) => {
      const cur = pointByDateMap.get(p.occurredAt) || { merit: 0, demerit: 0 };
      if (p.points > 0) cur.merit += p.points;
      else if (p.points < 0) cur.demerit += Math.abs(p.points);
      pointByDateMap.set(p.occurredAt, cur);
    });

    const pointDates = Array.from(pointByDateMap.keys()).sort();
    const pointTrend: PointTrendDataPoint[] = pointDates.map((dStr) => {
      const vals = pointByDateMap.get(dStr)!;
      return {
        date: dStr,
        label: formatDateVietnamese(dStr),
        merit: vals.merit,
        demerit: vals.demerit,
        net: vals.merit - vals.demerit,
      };
    });

    // 10. PHÂN BỐ CẤP BẬC (RANK DISTRIBUTION)
    const levelCountsMap = new Map<number, Student[]>();
    rankLevels.forEach((l) => levelCountsMap.set(l.level, []));

    studentsList.forEach((st) => {
      const rInfo = classRanks.get(st.id);
      const lvl = rInfo ? rInfo.currentLevel : 1;
      const list = levelCountsMap.get(lvl) || [];
      list.push(st);
      levelCountsMap.set(lvl, list);
    });

    const levelsDistribution: RankLevelDistributionItem[] = rankLevels.map((l) => ({
      level: l.level,
      code: l.code,
      name: l.name,
      group: l.group,
      count: levelCountsMap.get(l.level)?.length || 0,
      color: l.colorToken,
      students: levelCountsMap.get(l.level) || [],
    }));

    // 4 Group aggregation
    const groupColors: Record<string, string> = {
      'Hạ sĩ quan và Binh sĩ': '#10b981', // green
      'Cấp Úy': '#3b82f6', // blue
      'Cấp Tá': '#8b5cf6', // purple
      'Cấp Tướng': '#f59e0b', // gold
    };

    const groupMap = new Map<string, number>();
    levelsDistribution.forEach((l) => {
      groupMap.set(l.group, (groupMap.get(l.group) || 0) + l.count);
    });

    const totalStudents = studentsList.length || 1;
    const groupsDistribution: RankGroupDistributionItem[] = Array.from(groupMap.entries()).map(([grpName, count]) => ({
      name: grpName,
      count,
      percentage: Math.round((count / totalStudents) * 100),
      color: groupColors[grpName] || '#64748b',
    }));

    // 11. LỊCH SỬ THĂNG CẤP (PROMOTION HISTORY)
    const promoHistories = curHistories.filter((h) => h.changeType === 'promotion');
    const promotionsByPeriodMap = new Map<string, PromotedStudentDetail[]>();

    promoHistories.forEach((h) => {
      const dateStr = h.createdAt.split('T')[0]!;
      const list = promotionsByPeriodMap.get(dateStr) || [];
      const st = studentsMap.get(h.studentId);
      const targetLevelObj = rankLevels.find((l) => l.level === h.toLevel);

      list.push({
        studentId: h.studentId,
        studentName: st?.fullName || 'Học sinh',
        fromLevel: h.fromLevel ?? 1,
        toLevel: h.toLevel,
        rankName: targetLevelObj?.name || `Cấp ${h.toLevel}`,
        date: dateStr,
        points: h.pointsAfter,
      });

      promotionsByPeriodMap.set(dateStr, list);
    });

    const promotionHistory: PromotionHistoryDataPoint[] = Array.from(promotionsByPeriodMap.entries())
      .map(([dateStr, promos]) => ({
        periodLabel: formatDateVietnamese(dateStr),
        count: promos.length,
        promotions: promos,
      }))
      .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));

    // 12. TƯƠNG TÁC LỚP HỌC (ENGAGEMENT)
    let callsCount = 0;
    let answersCount = 0;
    let handRaisesCount = 0;
    let groupWorkCount = 0;
    let quickPointsCount = 0;
    const studentInteractionMap = new Map<string, number>();

    curEvents.forEach((e) => {
      if (e.eventType === 'student_selected') callsCount++;
      else if (e.eventType === 'participation_added') answersCount++;
      else if (e.eventType === 'hand_raised') handRaisesCount++;
      else if (e.eventType === 'batch_points_awarded') groupWorkCount++;
      else if (e.eventType === 'individual_point') quickPointsCount++;

      if (e.studentId) {
        studentInteractionMap.set(e.studentId, (studentInteractionMap.get(e.studentId) || 0) + 1);
      }
    });

    const studentRanking = Array.from(studentInteractionMap.entries())
      .map(([stId, count]) => ({
        studentId: stId,
        studentName: studentsMap.get(stId)?.fullName || 'Học sinh',
        interactionCount: count,
      }))
      .sort((a, b) => b.interactionCount - a.interactionCount);

    const engagement: EngagementData = {
      totalEvents: curEvents.length,
      callsCount,
      answersCount,
      handRaisesCount,
      groupWorkCount,
      quickPointsCount,
      studentRanking,
    };

    // 13. THỐNG KÊ DANH HIỆU & BẢNG VÀNG
    const allTitles = await honorTitleRepository.getAll();
    const honorTitlesStats: HonorTitleStats[] = allTitles.map((t) => {
      const recs = curRecipients.filter((r) => r.titleId === t.id);
      const boardTitleMap = new Map<string, string>();
      curBoards.forEach((b) => boardTitleMap.set(b.id, b.title));

      return {
        title: t,
        recipientCount: recs.length,
        recipients: recs.map((r) => ({
          studentId: r.studentId,
          studentName: studentsMap.get(r.studentId)?.fullName || 'Học sinh',
          rankName: r.rankNameAtAward,
          reason: r.reason,
          date: formatDateVietnamese(r.createdAt.split('T')[0]!),
        })),
      };
    });

    // 14. PHÁT HIỆN & NHẬN XÉT TỰ ĐỘNG (RULE-BASED INSIGHTS)
    const insights: ReportInsight[] = [];

    // Chuyên cần insight
    if (kpis.attendanceRate.percentChange !== null && kpis.attendanceRate.percentChange !== undefined) {
      if (kpis.attendanceRate.delta! > 0) {
        insights.push({
          id: 'ins-att-up',
          type: 'success',
          category: 'Chuyên cần',
          text: `Tỷ lệ chuyên cần của lớp đạt ${curAttendanceRate}%, tăng +${kpis.attendanceRate.delta}% so với kỳ trước.`,
        });
      } else if (kpis.attendanceRate.delta! < 0) {
        insights.push({
          id: 'ins-att-down',
          type: 'warning',
          category: 'Chuyên cần',
          text: `Tỷ lệ chuyên cần giảm ${Math.abs(kpis.attendanceRate.delta!)}% so với kỳ trước (${curAttendanceRate}%). Thầy/Cô cần lưu ý nhắc nhở các em.`,
        });
      }
    } else {
      insights.push({
        id: 'ins-att-base',
        type: 'info',
        category: 'Chuyên cần',
        text: `Tỷ lệ chuyên cần toàn lớp đạt mức ${curAttendanceRate}%.`,
      });
    }

    // Điểm thi đua insight
    if (curMerit > 0) {
      insights.push({
        id: 'ins-merit',
        type: 'success',
        category: 'Thi đua',
        text: `Cả lớp đã đạt tổng cộng +${curMerit} điểm thi đua tích cực trong khoảng thời gian này.`,
      });
    }

    // Thăng cấp insight
    if (curPromotedCount > 0) {
      insights.push({
        id: 'ins-promo',
        type: 'success',
        category: 'Cấp bậc',
        text: `Có ${curPromotedCount} chiến sĩ nhỏ xuất sắc thăng cấp bậc thi đua mới trong kỳ xét!`,
      });
    }

    // Tương tác insight
    if (curEngageRate >= 80) {
      insights.push({
        id: 'ins-engage',
        type: 'success',
        category: 'Tương tác',
        text: `${curEngageRate}% học sinh đã tích cực phát biểu hoặc tham gia hoạt động lớp học.`,
      });
    } else if (curEngageRate > 0) {
      insights.push({
        id: 'ins-engage-low',
        type: 'info',
        category: 'Tương tác',
        text: `Lớp có ${curEngageRate}% học sinh tham gia tương tác. Thầy/Cô có thể tăng cường sử dụng vòng quay gọi tên ngẫu nhiên để khích lệ thêm các em khác.`,
      });
    }

    // 15. HỌC SINH CẦN GIÁO VIÊN HỖ TRỢ (PRIVATE TEACHER MODE ONLY)
    const attentionStudents: AttentionStudentItem[] = [];

    studentsList.forEach((st) => {
      const reasons: string[] = [];
      // Attendance rate for student
      const stRecords = curRecords.filter((r) => r.studentId === st.id);
      let stAttRate = 100;
      if (stRecords.length > 0) {
        const attended = stRecords.filter(
          (r) => r.status === 'Present' || r.status === 'Late' || r.status === 'EarlyLeave'
        ).length;
        stAttRate = Math.round((attended / stRecords.length) * 100);
        if (stAttRate < 80) {
          reasons.push(`Chuyên cần thấp (${stAttRate}%, vắng ${stRecords.length - attended} buổi)`);
        }
      }

      // Demerits for student
      const stDemerits = curPoints.filter((p) => p.studentId === st.id && p.points < 0).length;
      if (stDemerits >= 2) {
        reasons.push(`Có ${stDemerits} lượt ghi nhận điểm trừ nề nếp`);
      }

      // Interactions
      const stInteractions = studentInteractionMap.get(st.id) || 0;
      if (curEvents.length >= 5 && stInteractions === 0) {
        reasons.push('Chưa có lượt tương tác hoặc phát biểu nào');
      }

      if (reasons.length > 0) {
        attentionStudents.push({
          studentId: st.id,
          studentName: st.fullName,
          avatar: st.avatar,
          reasons,
          attendanceRate: stAttRate,
          demeritCount: stDemerits,
          interactionCount: stInteractions,
        });
      }
    });

    return {
      filter,
      className,
      academicYearName,
      kpis,
      attendanceTrend,
      attendanceHeatmap,
      pointTrend,
      rankDistribution: {
        groups: groupsDistribution,
        levels: levelsDistribution,
      },
      promotionHistory,
      engagement,
      honorTitlesStats,
      insights,
      attentionStudents,
      studentsList,
    };
  }
}

export const reportAggregationService = new ReportAggregationService();

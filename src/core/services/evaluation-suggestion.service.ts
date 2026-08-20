import { db } from '../database/db';
import type {
  EvaluationPeriodCode,
  RegulationProfileCode,
} from '../database/types';

export interface ConcreteEvidenceItem {
  id: string;
  sourceType: 'ATTENDANCE' | 'POINT_MERIT' | 'POINT_DEMERIT' | 'LIVE_PARTICIPATION' | 'NOTE';
  date: string;
  title: string;
  detail: string;
  metricValue?: number;
}

export interface StudentEvidenceSummary {
  studentId: string;
  totalPresentSessions: number;
  totalAbsences: number;
  totalLateSessions: number;
  attendanceRatePercent: number;
  totalMeritPoints: number;
  totalDemeritPoints: number;
  topMeritReasons: string[];
  topDemeritReasons: string[];
  totalLiveParticipations: number;
  totalHandRaises: number;
  concreteEvidenceList: ConcreteEvidenceItem[];
  suggestedComments: {
    domain: string;
    levelHint?: string;
    text: string;
    evidenceText: string;
  }[];
}

export class EvaluationSuggestionService {
  /**
   * Tổng hợp minh chứng thực tế từ cơ sở dữ liệu cục bộ trong kỳ đánh giá
   */
  async aggregateEvidence(
    classId: string,
    studentId: string,
    _academicYearId: string,
    _periodCode: EvaluationPeriodCode,
    regulationCode: RegulationProfileCode
  ): Promise<StudentEvidenceSummary> {
    // 1. Lấy dữ liệu Chuyên cần (Attendance)
    const sessions = await db.attendanceSessions
      .where('classId')
      .equals(classId)
      .filter((s) => !s.deletedAt)
      .toArray();

    const sessionIds = sessions.map((s) => s.id);
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    const attendanceRecords = await db.attendanceRecords
      .where('studentId')
      .equals(studentId)
      .filter((r) => !r.deletedAt && sessionIds.includes(r.sessionId))
      .toArray();

    let totalPresentSessions = 0;
    let totalAbsences = 0;
    let totalLateSessions = 0;
    const concreteEvidenceList: ConcreteEvidenceItem[] = [];

    for (const rec of attendanceRecords) {
      const sess = sessionMap.get(rec.sessionId);
      const sessDate = sess ? sess.sessionDate : '';

      if (rec.status === 'Present') {
        totalPresentSessions++;
      } else if (rec.status === 'ExcusedAbsence' || rec.status === 'UnexcusedAbsence') {
        totalAbsences++;
        concreteEvidenceList.push({
          id: rec.id,
          sourceType: 'ATTENDANCE',
          date: sessDate,
          title: rec.status === 'ExcusedAbsence' ? 'Nghỉ có phép' : 'Nghỉ không phép',
          detail: rec.reason || rec.note || 'Ghi nhận vắng trong sổ điểm danh',
        });
      } else if (rec.status === 'Late') {
        totalLateSessions++;
        concreteEvidenceList.push({
          id: rec.id,
          sourceType: 'ATTENDANCE',
          date: sessDate,
          title: 'Đi học muộn',
          detail: rec.note || 'Điểm danh trễ giờ',
        });
      }
    }

    const totalSessionsRecorded = totalPresentSessions + totalAbsences + totalLateSessions;
    const attendanceRatePercent =
      totalSessionsRecorded > 0 ? Math.round((totalPresentSessions / totalSessionsRecorded) * 100) : 100;

    // 2. Lấy dữ liệu Điểm thi đua & Rèn luyện (Point Entries)
    const pointEntries = await db.pointEntries
      .where('studentId')
      .equals(studentId)
      .filter((p) => !p.deletedAt && p.classId === classId && !p.reversedEntryId)
      .toArray();

    let totalMeritPoints = 0;
    let totalDemeritPoints = 0;
    const meritReasonsMap = new Map<string, number>();
    const demeritReasonsMap = new Map<string, number>();

    for (const pt of pointEntries) {
      if (pt.points > 0) {
        totalMeritPoints += pt.points;
        const count = meritReasonsMap.get(pt.reason) || 0;
        meritReasonsMap.set(pt.reason, count + 1);
        concreteEvidenceList.push({
          id: pt.id,
          sourceType: 'POINT_MERIT',
          date: pt.occurredAt,
          title: `+${pt.points} điểm: ${pt.reason}`,
          detail: pt.reason,
          metricValue: pt.points,
        });
      } else {
        totalDemeritPoints += Math.abs(pt.points);
        const count = demeritReasonsMap.get(pt.reason) || 0;
        demeritReasonsMap.set(pt.reason, count + 1);
        concreteEvidenceList.push({
          id: pt.id,
          sourceType: 'POINT_DEMERIT',
          date: pt.occurredAt,
          title: `${pt.points} điểm: ${pt.reason}`,
          detail: pt.reason,
          metricValue: pt.points,
        });
      }
    }

    const topMeritReasons = Array.from(meritReasonsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([reason]) => reason)
      .slice(0, 3);

    const topDemeritReasons = Array.from(demeritReasonsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([reason]) => reason)
      .slice(0, 3);

    // 3. Lấy dữ liệu Lớp học trực tuyến (Live Classroom)
    const participants = await db.liveClassParticipants
      .where('studentId')
      .equals(studentId)
      .toArray();

    let totalLiveParticipations = 0;
    let totalHandRaises = 0;

    for (const p of participants) {
      totalLiveParticipations += p.participationCount || 0;
      if (p.handRaised || p.randomSelectionCount > 0) {
        totalHandRaises += (p.randomSelectionCount || 0) + (p.handRaised ? 1 : 0);
      }
    }

    if (totalLiveParticipations > 0) {
      concreteEvidenceList.push({
        id: `live_part_${studentId}`,
        sourceType: 'LIVE_PARTICIPATION',
        date: '',
        title: 'Tương tác lớp học trực tuyến',
        detail: `Đã có ${totalLiveParticipations} lượt phát biểu và trả lời câu hỏi trong giờ học`,
        metricValue: totalLiveParticipations,
      });
    }

    // 4. Sinh các câu gợi ý sư phạm dựa trên minh chứng thực tế (Không gán nhãn, chỉ gợi ý câu mở rộng)
    const suggestedComments: StudentEvidenceSummary['suggestedComments'] = [];

    // Gợi ý chuyên cần / rèn luyện
    if (attendanceRatePercent === 100 && totalAbsences === 0 && totalLateSessions === 0) {
      suggestedComments.push({
        domain: regulationCode === 'TT27_2020_PRIMARY' ? 'QUALITY' : 'CONDUCT',
        levelHint: 'TOT',
        text: 'Em đi học chuyên cần 100%, đúng giờ, có ý thức kỷ luật tốt và gương mẫu trong mọi nề nếp của lớp.',
        evidenceText: 'Chuyên cần 100%, không vắng, không muộn',
      });
    } else if (totalAbsences > 0 || totalLateSessions > 0) {
      suggestedComments.push({
        domain: regulationCode === 'TT27_2020_PRIMARY' ? 'QUALITY' : 'CONDUCT',
        levelHint: 'DAT',
        text: `Em có cố gắng trong học tập; cần duy trì đi học đều đặn và đúng giờ hơn (vắng ${totalAbsences} buổi, muộn ${totalLateSessions} lần).`,
        evidenceText: `Đã ghi nhận vắng ${totalAbsences} buổi, muộn ${totalLateSessions} lần`,
      });
    }

    // Gợi ý rèn luyện / phẩm chất từ điểm thi đua
    if (topMeritReasons.length > 0) {
      const topStr = topMeritReasons.join(', ');
      suggestedComments.push({
        domain: regulationCode === 'TT27_2020_PRIMARY' ? 'QUALITY' : 'HOMEROOM_SUMMARY',
        levelHint: 'TOT',
        text: `Em có ý thức rèn luyện tốt, nổi bật ở các biểu hiện: ${topStr}. Tiếp tục phát huy trong thời gian tới.`,
        evidenceText: `Đạt +${totalMeritPoints} điểm thi đua (${topStr})`,
      });
    }

    // Gợi ý năng lực / học tập từ lượt tương tác
    if (totalLiveParticipations >= 5) {
      suggestedComments.push({
        domain: regulationCode === 'TT27_2020_PRIMARY' ? 'GENERAL_CAPACITY' : 'LEARNING',
        levelHint: 'TOT',
        text: `Em hăng hái, tích cực phát biểu xây dựng bài và tương tác sôi nổi trong các tiết học (${totalLiveParticipations} lượt tham gia).`,
        evidenceText: `Đã tham gia phát biểu ${totalLiveParticipations} lượt`,
      });
    }

    return {
      studentId,
      totalPresentSessions,
      totalAbsences,
      totalLateSessions,
      attendanceRatePercent,
      totalMeritPoints,
      totalDemeritPoints,
      topMeritReasons,
      topDemeritReasons,
      totalLiveParticipations,
      totalHandRaises,
      concreteEvidenceList,
      suggestedComments,
    };
  }
}

export const evaluationSuggestionService = new EvaluationSuggestionService();

import { db } from '../database/db';
import { rankCalculationService } from './rank-calculation.service';
import type {
  Student,
  HonorTitle,
  RankLevel,
  ClassEnrollment,
} from '../database/types';

export interface CandidateProposal {
  student: Student;
  position?: number | null;
  metricValue: number;
  metricLabel: string;
  reason: string;
  rankLevel: number;
  rankName: string;
  badgeKey: string;
  points: number;
  isTied?: boolean;
}

export interface TitleEvaluationResult {
  title: HonorTitle;
  candidates: CandidateProposal[];
  hasTie: boolean;
  tiedCandidates: CandidateProposal[];
}

export class HonorRuleEngineService {
  /**
   * Tính toán toàn bộ ứng viên theo danh hiệu cho một kỳ xét (Single-batch query, 0 N+1)
   */
  async evaluateAllTitlesForClass(
    classId: string,
    titles: HonorTitle[],
    startDate: string,
    endDate: string,
    rankSystemId: string,
    academicYearId?: string
  ): Promise<TitleEvaluationResult[]> {
    // 1. Tải toàn bộ học sinh đang active trong lớp
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();

    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) {
      return titles.map((t) => ({ title: t, candidates: [], hasTie: false, tiedCandidates: [] }));
    }

    const studentsMap = new Map<string, Student>();
    for (const stId of studentIds) {
      const st = await db.students.get(stId);
      if (st && !st.deletedAt) {
        studentsMap.set(st.id, st);
      }
    }

    // 2. Tính toán cấp bậc hiện tại của học sinh
    const classRanks = await rankCalculationService.recalculateClassRanks(classId, rankSystemId);

    // 3. Tải các cấu hình cấp bậc (levels)
    const rankLevels = await db.rankLevels
      .where('rankSystemId')
      .equals(rankSystemId)
      .filter((l) => !l.deletedAt)
      .toArray();
    rankLevels.sort((a, b) => a.level - b.level);

    // 4. Đánh giá từng danh hiệu
    const results: TitleEvaluationResult[] = [];

    for (const title of titles) {
      const evalResult = await this.evaluateSingleTitle(
        title,
        classId,
        studentsMap,
        enrollments,
        classRanks,
        rankLevels,
        startDate,
        endDate,
        academicYearId
      );
      results.push(evalResult);
    }

    return results;
  }

  /**
   * Đánh giá một danh hiệu cụ thể
   */
  private async evaluateSingleTitle(
    title: HonorTitle,
    classId: string,
    studentsMap: Map<string, Student>,
    _enrollments: ClassEnrollment[],
    classRanks: Map<string, { currentRank: RankLevel; currentLevel: number; effectivePoints: number }>,
    _rankLevels: RankLevel[],
    startDate: string,
    endDate: string,
    _academicYearId?: string
  ): Promise<TitleEvaluationResult> {
    const studentList = Array.from(studentsMap.values());
    let proposals: CandidateProposal[] = [];

    switch (title.calculationType) {
      // 1. DẪN ĐẦU CẤP BẬC (TOP RANK)
      case 'top_rank': {
        const rankScores = studentList.map((st) => {
          const rInfo = classRanks.get(st.id);
          const lvl = rInfo ? rInfo.currentLevel : 1;
          const pts = rInfo ? rInfo.effectivePoints : 0;
          const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
          const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
          return {
            student: st,
            level: lvl,
            points: pts,
            rankName: rName,
            badgeKey: badge,
          };
        });

        // Sắp xếp: Level cao nhất -> Điểm cao nhất
        rankScores.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          if (b.points !== a.points) return b.points - a.points;
          return a.student.fullName.localeCompare(b.student.fullName, 'vi');
        });

        proposals = rankScores.map((item, idx) => ({
          student: item.student,
          position: idx + 1,
          metricValue: item.points,
          metricLabel: `${item.points} điểm`,
          reason: `Đạt ${item.rankName} (Cấp ${item.level}) với ${item.points} điểm thi đua`,
          rankLevel: item.level,
          rankName: item.rankName,
          badgeKey: item.badgeKey,
          points: item.points,
        }));
        break;
      }

      // 2. THĂNG CẤP ẤN TƯỢNG (RANK PROGRESS)
      case 'rank_progress': {
        const startISO = `${startDate}T00:00:00.000Z`;
        const endISO = `${endDate}T23:59:59.999Z`;

        const histories = await db.studentRankHistory
          .where('classId')
          .equals(classId)
          .filter((h) => h.changeType === 'promotion' && h.createdAt >= startISO && h.createdAt <= endISO)
          .toArray();

        const studentPromoMap = new Map<string, number>();
        histories.forEach((h) => {
          const jump = Math.max(1, h.toLevel - (h.fromLevel ?? h.toLevel - 1));
          studentPromoMap.set(h.studentId, (studentPromoMap.get(h.studentId) || 0) + jump);
        });

        const candidates = Array.from(studentPromoMap.entries())
          .map(([stId, jumpCount]) => {
            const st = studentsMap.get(stId);
            if (!st) return null;
            const rInfo = classRanks.get(stId);
            const lvl = rInfo ? rInfo.currentLevel : 1;
            const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
            const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
            const pts = rInfo ? rInfo.effectivePoints : 0;
            return {
              student: st,
              metricValue: jumpCount,
              metricLabel: `+${jumpCount} cấp`,
              reason: `Đã xuất sắc thăng liên tiếp ${jumpCount} cấp bậc trong kỳ`,
              rankLevel: lvl,
              rankName: rName,
              badgeKey: badge,
              points: pts,
            };
          })
          .filter(Boolean) as CandidateProposal[];

        candidates.sort((a, b) => b.metricValue - a.metricValue);
        proposals = candidates;
        break;
      }

      // 3. NGÔI SAO BỨT PHÁ (POINT GROWTH)
      case 'point_growth': {
        const entries = await db.pointEntries
          .where('classId')
          .equals(classId)
          .filter((p) => !p.deletedAt && p.occurredAt >= startDate && p.occurredAt <= endDate)
          .toArray();

        const studentPointsMap = new Map<string, number>();
        entries.forEach((p) => {
          studentPointsMap.set(p.studentId, (studentPointsMap.get(p.studentId) || 0) + p.points);
        });

        const candidates = Array.from(studentPointsMap.entries())
          .filter(([_, netPts]) => netPts > 0)
          .map(([stId, netPts]) => {
            const st = studentsMap.get(stId);
            if (!st) return null;
            const rInfo = classRanks.get(stId);
            const lvl = rInfo ? rInfo.currentLevel : 1;
            const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
            const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
            const pts = rInfo ? rInfo.effectivePoints : 0;
            return {
              student: st,
              metricValue: netPts,
              metricLabel: `+${netPts} điểm`,
              reason: `Tăng trưởng bứt phá +${netPts} điểm thi đua tích cực`,
              rankLevel: lvl,
              rankName: rName,
              badgeKey: badge,
              points: pts,
            };
          })
          .filter(Boolean) as CandidateProposal[];

        candidates.sort((a, b) => b.metricValue - a.metricValue);
        proposals = candidates;
        break;
      }

      // 4. NGÔI SAO CHUYÊN CẦN (ATTENDANCE)
      case 'attendance': {
        const sessions = await db.attendanceSessions
          .where('classId')
          .equals(classId)
          .filter((s) => !s.deletedAt && s.sessionDate >= startDate && s.sessionDate <= endDate)
          .toArray();

        const totalSessions = sessions.length;
        if (totalSessions > 0) {
          const sessionIds = sessions.map((s) => s.id);
          const records = await db.attendanceRecords
            .filter((r) => !r.deletedAt && sessionIds.includes(r.sessionId))
            .toArray();

          const studentPresentMap = new Map<string, { present: number; late: number }>();
          records.forEach((r) => {
            const cur = studentPresentMap.get(r.studentId) || { present: 0, late: 0 };
            if (r.status === 'Present') cur.present++;
            else if (r.status === 'Late' || r.status === 'EarlyLeave') {
              cur.present++;
              cur.late++;
            }
            studentPresentMap.set(r.studentId, cur);
          });

          const candidates = studentList
            .map((st) => {
              const att = studentPresentMap.get(st.id) || { present: 0, late: 0 };
              const rate = Math.round((att.present / totalSessions) * 100);
              const rInfo = classRanks.get(st.id);
              const lvl = rInfo ? rInfo.currentLevel : 1;
              const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
              const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
              const pts = rInfo ? rInfo.effectivePoints : 0;
              return {
                student: st,
                metricValue: rate,
                metricLabel: `${rate}% có mặt`,
                reason: `Chuyên cần ${rate}% (${att.present}/${totalSessions} buổi học đúng giờ)`,
                rankLevel: lvl,
                rankName: rName,
                badgeKey: badge,
                points: pts,
                lateCount: att.late,
              };
            })
            .filter((c) => c.metricValue >= 85);

          candidates.sort((a, b) => {
            if (b.metricValue !== a.metricValue) return b.metricValue - a.metricValue;
            return a.lateCount - b.lateCount;
          });

          proposals = candidates;
        }
        break;
      }

      // 5. TÍCH CỰC PHÁT BIỂU (PARTICIPATION)
      case 'participation': {
        const liveEvents = await db.liveClassEvents
          .filter((e) => e.studentId !== null && e.studentId !== undefined)
          .toArray();

        const studentInteractionMap = new Map<string, number>();
        liveEvents.forEach((e) => {
          if (e.studentId) {
            studentInteractionMap.set(e.studentId, (studentInteractionMap.get(e.studentId) || 0) + 1);
          }
        });

        const candidates = Array.from(studentInteractionMap.entries())
          .map(([stId, count]) => {
            const st = studentsMap.get(stId);
            if (!st) return null;
            const rInfo = classRanks.get(stId);
            const lvl = rInfo ? rInfo.currentLevel : 1;
            const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
            const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
            const pts = rInfo ? rInfo.effectivePoints : 0;
            return {
              student: st,
              metricValue: count,
              metricLabel: `${count} lượt`,
              reason: `Tích cực tham gia tương tác & phát biểu ${count} lượt`,
              rankLevel: lvl,
              rankName: rName,
              badgeKey: badge,
              points: pts,
            };
          })
          .filter(Boolean) as CandidateProposal[];

        candidates.sort((a, b) => b.metricValue - a.metricValue);
        proposals = candidates;
        break;
      }

      // 6. GƯƠNG MẶT TIẾN BỘ (SELF PROGRESS)
      case 'self_progress': {
        // Tính độ dài giai đoạn xét (days)
        const dStart = new Date(startDate);
        const dEnd = new Date(endDate);
        const durationDays = Math.max(1, Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24)));

        const prevEnd = new Date(dStart);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - durationDays);

        const prevStartStr = prevStart.toISOString().split('T')[0]!;
        const prevEndStr = prevEnd.toISOString().split('T')[0]!;

        const curEntries = await db.pointEntries
          .where('classId')
          .equals(classId)
          .filter((p) => !p.deletedAt && p.occurredAt >= startDate && p.occurredAt <= endDate)
          .toArray();

        const prevEntries = await db.pointEntries
          .where('classId')
          .equals(classId)
          .filter((p) => !p.deletedAt && p.occurredAt >= prevStartStr && p.occurredAt <= prevEndStr)
          .toArray();

        const curMap = new Map<string, number>();
        curEntries.forEach((p) => curMap.set(p.studentId, (curMap.get(p.studentId) || 0) + p.points));

        const prevMap = new Map<string, number>();
        prevEntries.forEach((p) => prevMap.set(p.studentId, (prevMap.get(p.studentId) || 0) + p.points));

        const candidates = studentList
          .map((st) => {
            const curPts = curMap.get(st.id) || 0;
            const prevPts = prevMap.get(st.id) || 0;
            const delta = curPts - prevPts;
            if (delta <= 0 || curPts <= 0) return null;

            const rInfo = classRanks.get(st.id);
            const lvl = rInfo ? rInfo.currentLevel : 1;
            const rName = rInfo ? rInfo.currentRank.name : 'Binh nhì';
            const badge = rInfo ? rInfo.currentRank.badgeKey : 'insignia_level_1';
            const pts = rInfo ? rInfo.effectivePoints : 0;
            return {
              student: st,
              metricValue: delta,
              metricLabel: `+${delta} đ so với kỳ trước`,
              reason: `Tiến bộ vượt bậc: đạt ${curPts} điểm (tăng +${delta} điểm so với kỳ trước)`,
              rankLevel: lvl,
              rankName: rName,
              badgeKey: badge,
              points: pts,
            };
          })
          .filter(Boolean) as CandidateProposal[];

        candidates.sort((a, b) => b.metricValue - a.metricValue);
        proposals = candidates;
        break;
      }

      // 7. MANUAL NOMINATIONS
      case 'manual':
      default: {
        proposals = [];
        break;
      }
    }

    // XỬ LÝ ĐỒNG HẠNG (TIE-HANDLING)
    const maxRecipients = title.maxRecipients || 3;
    const selected = proposals.slice(0, maxRecipients);

    let hasTie = false;
    let tiedCandidates: CandidateProposal[] = [];

    if (proposals.length > maxRecipients) {
      const lastScore = proposals[maxRecipients - 1]?.metricValue;
      const nextScore = proposals[maxRecipients]?.metricValue;

      if (lastScore !== undefined && lastScore === nextScore && lastScore > 0) {
        hasTie = true;
        tiedCandidates = proposals.filter((p) => p.metricValue === lastScore);
      }
    }

    return {
      title,
      candidates: selected,
      hasTie,
      tiedCandidates,
    };
  }
}

export const honorRuleEngineService = new HonorRuleEngineService();

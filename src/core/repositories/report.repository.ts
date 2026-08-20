import { db } from '../database/db';
import type {
  Student,
  ClassEnrollment,
  AttendanceSession,
  AttendanceRecord,
  PointEntry,
  StudentRankHistory,
  LiveClassEvent,
  HonorBoard,
  HonorRecipient,
} from '../database/types';

export class ReportRepository {
  /**
   * Lấy danh sách ghi danh đang hoạt động trong lớp
   */
  async getActiveEnrollments(classId: string): Promise<ClassEnrollment[]> {
    return db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();
  }

  /**
   * Tải map thông tin học sinh theo danh sách ID (Single-batch)
   */
  async getStudentsMap(studentIds: string[]): Promise<Map<string, Student>> {
    const map = new Map<string, Student>();
    if (studentIds.length === 0) return map;

    const students = await db.students
      .where('id')
      .anyOf(studentIds)
      .filter((s) => !s.deletedAt)
      .toArray();

    students.forEach((st) => map.set(st.id, st));
    return map;
  }

  /**
   * Tải toàn bộ phiên điểm danh và bản ghi trong khoảng ngày
   */
  async getAttendanceData(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{ sessions: AttendanceSession[]; records: AttendanceRecord[] }> {
    const sessions = await db.attendanceSessions
      .where('classId')
      .equals(classId)
      .filter((s) => !s.deletedAt && s.sessionDate >= startDate && s.sessionDate <= endDate)
      .toArray();

    sessions.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

    if (sessions.length === 0) {
      return { sessions: [], records: [] };
    }

    const sessionIds = sessions.map((s) => s.id);
    const records = await db.attendanceRecords
      .where('sessionId')
      .anyOf(sessionIds)
      .filter((r) => !r.deletedAt)
      .toArray();

    return { sessions, records };
  }

  /**
   * Tải các giao dịch điểm thi đua trong khoảng ngày
   */
  async getPointEntries(
    classId: string,
    startDate: string,
    endDate: string,
    studentId?: string
  ): Promise<PointEntry[]> {
    let collection = db.pointEntries
      .where('classId')
      .equals(classId)
      .filter((p) => !p.deletedAt && p.occurredAt >= startDate && p.occurredAt <= endDate);

    if (studentId) {
      collection = collection.filter((p) => p.studentId === studentId);
    }

    const entries = await collection.toArray();
    entries.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    return entries;
  }

  /**
   * Tải lịch sử thăng cấp trong khoảng ngày
   */
  async getRankHistories(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<StudentRankHistory[]> {
    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    const histories = await db.studentRankHistory
      .where('classId')
      .equals(classId)
      .filter((h) => h.createdAt >= startISO && h.createdAt <= endISO)
      .toArray();

    histories.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return histories;
  }

  /**
   * Tải sự kiện lớp học trực tuyến
   */
  async getLiveClassEvents(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<LiveClassEvent[]> {
    // 1. Tìm các session thuộc lớp trong khoảng ngày
    const sessions = await db.liveClassSessions
      .where('classId')
      .equals(classId)
      .filter((s) => s.sessionDate >= startDate && s.sessionDate <= endDate)
      .toArray();

    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);
    const events = await db.liveClassEvents
      .where('sessionId')
      .anyOf(sessionIds)
      .toArray();

    return events;
  }

  /**
   * Tải các bảng vàng đã công bố và danh hiệu được trao
   */
  async getPublishedHonors(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{ boards: HonorBoard[]; recipients: HonorRecipient[] }> {
    const boards = await db.honorBoards
      .where('classId')
      .equals(classId)
      .filter(
        (b) =>
          !b.deletedAt &&
          b.status === 'published' &&
          ((b.startDate >= startDate && b.startDate <= endDate) ||
            (b.endDate >= startDate && b.endDate <= endDate))
      )
      .toArray();

    if (boards.length === 0) return { boards: [], recipients: [] };

    const boardIds = boards.map((b) => b.id);
    const recipients = await db.honorRecipients
      .where('boardId')
      .anyOf(boardIds)
      .filter((r) => r.isApproved)
      .toArray();

    return { boards, recipients };
  }
}

export const reportRepository = new ReportRepository();

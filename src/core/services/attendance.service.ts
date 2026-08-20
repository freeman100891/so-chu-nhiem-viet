import { db } from '../database/db';
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordStatus,
} from '../database/types';
import { attendanceSessionRepository } from '../repositories/attendance.repository';
import { generateUUID } from '../../shared/utilities/uuid';

export interface AttendanceRecordItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  rollNumber?: number;
  avatar?: string;
  status: AttendanceRecordStatus;
  reason?: string;
}

export interface AttendanceSessionData {
  session: AttendanceSession | null; // null if draft/unsaved
  records: AttendanceRecordItem[];
  metrics: AttendanceMetrics;
  isExisting: boolean;
}

export interface AttendanceMetrics {
  total: number;
  present: number;
  excused: number;
  unexcused: number;
  late: number;
  earlyLeave: number;
  ratePercent: number;
}

export class AttendanceService {
  /**
   * Tính toán chỉ số thống kê chuyên cần từ danh sách bản ghi
   */
  calculateMetrics(records: AttendanceRecordItem[]): AttendanceMetrics {
    const total = records.length;
    if (total === 0) {
      return { total: 0, present: 0, excused: 0, unexcused: 0, late: 0, earlyLeave: 0, ratePercent: 100 };
    }

    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;
    let earlyLeave = 0;

    records.forEach((r) => {
      switch (r.status) {
        case 'Present':
          present++;
          break;
        case 'ExcusedAbsence':
          excused++;
          break;
        case 'UnexcusedAbsence':
          unexcused++;
          break;
        case 'Late':
          late++;
          break;
        case 'EarlyLeave':
          earlyLeave++;
          break;
      }
    });

    const attended = present + late + earlyLeave;
    const ratePercent = Math.round((attended / total) * 100);

    return { total, present, excused, unexcused, late, earlyLeave, ratePercent };
  }

  /**
   * Đọc phiên điểm danh hiện có hoặc Khởi tạo phiên nháp. KHÔNG ghi vào DB ở bước này!
   */
  async getOrInitializeSession(classId: string, sessionDate: string): Promise<AttendanceSessionData> {
    // 1. Check if session exists in DB
    const existingSession = await attendanceSessionRepository.findByClassAndDate(classId, sessionDate);

    if (existingSession) {
      const records = await db.attendanceRecords
        .where('sessionId')
        .equals(existingSession.id)
        .filter((r) => !r.deletedAt)
        .toArray();

      const items: AttendanceRecordItem[] = [];
      const recordedStudentIds = new Set<string>();

      for (const r of records) {
        const st = await db.students.get(r.studentId);
        if (st && !st.deletedAt) {
          recordedStudentIds.add(st.id);
          items.push({
            studentId: st.id,
            studentCode: st.studentCode,
            fullName: st.fullName,
            rollNumber: r.rollNumber,
            avatar: st.avatar,
            status: r.status,
            reason: r.reason,
          });
        }
      }

      // If existing session is draft/unlocked, synchronize any newly enrolled active students!
      if (!existingSession.isLocked) {
        const activeEnrollments = await db.classEnrollments
          .where('classId')
          .equals(classId)
          .filter((e) => !e.deletedAt && (e.status === 'Active' || !e.status))
          .toArray();

        for (const enr of activeEnrollments) {
          if (!recordedStudentIds.has(enr.studentId)) {
            const st = await db.students.get(enr.studentId);
            if (st && !st.deletedAt) {
              recordedStudentIds.add(st.id);
              items.push({
                studentId: st.id,
                studentCode: st.studentCode,
                fullName: st.fullName,
                rollNumber: enr.rollNumber,
                avatar: st.avatar,
                status: 'Present',
              });
            }
          }
        }
      }

      // Sort by rollNumber
      items.sort((a, b) => (a.rollNumber || 999) - (b.rollNumber || 999));

      return {
        session: existingSession,
        records: items,
        metrics: this.calculateMetrics(items),
        isExisting: true,
      };
    }

    // 2. Draft Session: Fetch active enrollments for this class
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => {
        if (e.deletedAt) return false;
        // If Active, ensure student hasn't left before sessionDate
        if (e.status === 'Active' || !e.status) {
          if (e.leftAt) {
            const left = e.leftAt.substring(0, 10);
            if (left < sessionDate) return false;
          }
          return true;
        }
        // If Transferred or Inactive, check if within active range
        const joined = e.joinedAt ? e.joinedAt.substring(0, 10) : '';
        const left = e.leftAt ? e.leftAt.substring(0, 10) : '';
        if (joined && joined > sessionDate) return false;
        if (left && left < sessionDate) return false;
        return true;
      })
      .toArray();

    const items: AttendanceRecordItem[] = [];
    for (const enr of enrollments) {
      const st = await db.students.get(enr.studentId);
      if (st && !st.deletedAt) {
        items.push({
          studentId: st.id,
          studentCode: st.studentCode,
          fullName: st.fullName,
          rollNumber: enr.rollNumber,
          avatar: st.avatar,
          status: 'Present', // Default 100% Present
        });
      }
    }

    items.sort((a, b) => (a.rollNumber || 999) - (b.rollNumber || 999));

    return {
      session: null,
      records: items,
      metrics: this.calculateMetrics(items),
      isExisting: false,
    };
  }

  /**
   * Lưu hoặc Cập nhật phiên điểm danh và toàn bộ bản ghi chi tiết trong Dexie Transaction
   */
  async saveSession(
    classId: string,
    sessionDate: string,
    records: AttendanceRecordItem[],
    note?: string,
    isLocked = false
  ): Promise<AttendanceSession> {
    const nowISO = new Date().toISOString();
    const session = await attendanceSessionRepository.findByClassAndDate(classId, sessionDate);
    const sessionId = session ? session.id : generateUUID();

    if (session && session.isLocked) {
      throw new Error('Phiên điểm danh này đã bị khóa. Vui lòng mở lại phiên trước khi chỉnh sửa.');
    }

    const { present, excused, unexcused, late } = this.calculateMetrics(records);

    const updatedSession: AttendanceSession = {
      id: sessionId,
      classId,
      sessionDate,
      note,
      isLocked,
      totalPresent: present,
      totalExcused: excused,
      totalUnexcused: unexcused,
      totalLate: late,
      createdAt: session ? session.createdAt : nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.runTransaction('rw', [db.attendanceSessions, db.attendanceRecords, db.auditLogs], async () => {
      // 1. Put Session
      await db.attendanceSessions.put(updatedSession);

      // 2. Clear old records for session
      const oldRecords = await db.attendanceRecords.where('sessionId').equals(sessionId).toArray();
      for (const r of oldRecords) {
        await db.attendanceRecords.delete(r.id);
      }

      // 3. Bulk insert new records
      const newRecords: AttendanceRecord[] = records.map((r) => ({
        id: generateUUID(),
        sessionId,
        studentId: r.studentId,
        rollNumber: r.rollNumber,
        status: r.status,
        reason: r.reason,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      }));

      await db.attendanceRecords.bulkAdd(newRecords);

      // Audit log
      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'AttendanceSession',
        recordId: sessionId,
        action: session ? 'UPDATE' : 'CREATE',
        timestamp: nowISO,
        details: `Lưu điểm danh lớp (${classId}) ngày ${sessionDate} (${records.length} học sinh, ${isLocked ? 'Khóa phiên' : 'Bản nháp'})`,
      });
    });

    return updatedSession;
  }

  /**
   * Mở khóa phiên điểm danh đã khóa
   */
  async unlockSession(sessionId: string): Promise<void> {
    const session = await db.attendanceSessions.get(sessionId);
    if (!session) throw new Error('Không tìm thấy phiên điểm danh.');

    await db.attendanceSessions.update(sessionId, {
      isLocked: false,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const attendanceService = new AttendanceService();

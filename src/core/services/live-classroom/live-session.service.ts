import { db } from '../../database/db';
import type { LiveClassSession, MeetingPlatform, LiveAttendanceStatus } from '../../database/types';
import { LiveClassSessionSchema } from '../../validation/schemas';
import { getTodayDateString } from '../../../shared/utilities/date';
import { liveClassEventService } from './live-event.service';

export interface CreateSessionInput {
  classId: string;
  termId?: string;
  title: string;
  subject: string;
  sessionDate?: string;
  meetingPlatform?: MeetingPlatform;
  meetingUrl?: string;
  presentationTheme?: string;
}

export class LiveClassSessionService {
  /**
   * Tạo bản nháp phiên học trực tuyến (Draft)
   */
  async createDraft(input: CreateSessionInput): Promise<LiveClassSession> {
    const sessionDate = input.sessionDate || getTodayDateString();
    LiveClassSessionSchema.parse({
      ...input,
      sessionDate,
    });

    const nowISO = new Date().toISOString();
    const session: LiveClassSession = {
      id: crypto.randomUUID(),
      classId: input.classId,
      termId: input.termId || null,
      title: input.title.trim(),
      subject: input.subject.trim(),
      sessionDate,
      meetingPlatform: input.meetingPlatform || 'meet',
      meetingUrl: input.meetingUrl?.trim() || null,
      status: 'draft',
      startedAt: null,
      pausedAt: null,
      totalPausedMilliseconds: 0,
      endedAt: null,
      presentationTheme: input.presentationTheme || 'default',
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    await db.liveClassSessions.add(session);
    return session;
  }

  /**
   * Bắt đầu phiên học: Tạo Snapshot danh sách học sinh active từ classEnrollments
   */
  async startSession(sessionId: string): Promise<LiveClassSession> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) {
      throw new Error('Không tìm thấy phiên học trực tuyến.');
    }

    if (session.status === 'completed') {
      throw new Error('Phiên học này đã hoàn thành.');
    }

    // Business Rule 1: Không cho bắt đầu phiên nếu lớp không có học sinh active
    const activeEnrollments = await db.classEnrollments
      .where('classId')
      .equals(session.classId)
      .filter((e) => e.status === 'Active' && !e.deletedAt)
      .toArray();

    if (activeEnrollments.length === 0) {
      throw new Error('Không thể bắt đầu phiên: Lớp học không có học sinh đang hoạt động (Active).');
    }

    // Business Rule 2: Một lớp chỉ có tối đa một phiên active hoặc paused
    const existingActive = await db.liveClassSessions
      .where('classId')
      .equals(session.classId)
      .filter((s) => (s.status === 'active' || s.status === 'paused') && s.id !== sessionId)
      .first();

    if (existingActive) {
      throw new Error(`Lớp học này đang có một phiên học trực tuyến đang chạy ("${existingActive.title}").`);
    }

    const nowISO = new Date().toISOString();
    const targetDate = session.sessionDate || getTodayDateString();
    const mainSession = await db.attendanceSessions
      .where('classId')
      .equals(session.classId)
      .filter((s) => s.sessionDate === targetDate && !s.deletedAt)
      .first();

    let mainRecordMap = new Map<string, string>();
    if (mainSession) {
      const records = await db.attendanceRecords
        .where('sessionId')
        .equals(mainSession.id)
        .filter((r) => !r.deletedAt)
        .toArray();
      mainRecordMap = new Map(records.map((r) => [r.studentId, r.status]));
    }

    // Snapshot danh sách học sinh vào liveClassParticipants trong Dexie Transaction
    await db.runTransaction('rw', [db.liveClassSessions, db.liveClassParticipants, db.auditLogs], async () => {
      // Create participant snapshots if not exist
      for (const enrollment of activeEnrollments) {
        const existingParticipant = await db.liveClassParticipants
          .where('[sessionId+studentId]')
          .equals([sessionId, enrollment.studentId])
          .first();

        if (!existingParticipant) {
          const mainStatus = mainRecordMap.get(enrollment.studentId);
          let initialStatus: LiveAttendanceStatus = 'unchecked';
          if (mainStatus === 'Present') initialStatus = 'present';
          else if (mainStatus === 'Late') initialStatus = 'late';
          else if (mainStatus === 'ExcusedAbsence') initialStatus = 'left';
          else if (mainStatus === 'UnexcusedAbsence') initialStatus = 'absent';

          await db.liveClassParticipants.add({
            id: crypto.randomUUID(),
            sessionId,
            studentId: enrollment.studentId,
            attendanceStatus: initialStatus,
            participationCount: 0,
            randomSelectionCount: 0,
            handRaised: false,
            handRaisedAt: null,
            quickNote: null,
            joinedAt: initialStatus !== 'unchecked' ? nowISO : null,
            leftAt: null,
            createdAt: nowISO,
            updatedAt: nowISO,
          });
        }
      }

      await db.liveClassSessions.update(sessionId, {
        status: 'active',
        startedAt: session.startedAt || nowISO,
        pausedAt: null,
        updatedAt: nowISO,
      });

      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'LiveClassSession',
        recordId: sessionId,
        action: 'CREATE',
        timestamp: nowISO,
        details: `Bắt đầu phiên học trực tuyến: ${session.title} (Lớp ${session.classId})`,
      });
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'session_started',
      value: session.title,
    });

    return (await db.liveClassSessions.get(sessionId))!;
  }

  /**
   * Tạm dừng phiên học
   */
  async pauseSession(sessionId: string): Promise<LiveClassSession> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Phiên học phải đang ở trạng thái Hoạt động để tạm dừng.');
    }

    const nowISO = new Date().toISOString();
    await db.liveClassSessions.update(sessionId, {
      status: 'paused',
      pausedAt: nowISO,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'session_paused',
    });

    return (await db.liveClassSessions.get(sessionId))!;
  }

  /**
   * Tiếp tục phiên học từ trạng thái tạm dừng
   */
  async resumeSession(sessionId: string): Promise<LiveClassSession> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session || session.status !== 'paused') {
      throw new Error('Phiên học phải đang ở trạng thái Tạm dừng để tiếp tục.');
    }

    const nowISO = new Date().toISOString();
    let additionalPausedMs = 0;
    if (session.pausedAt) {
      additionalPausedMs = Date.now() - new Date(session.pausedAt).getTime();
    }

    await db.liveClassSessions.update(sessionId, {
      status: 'active',
      pausedAt: null,
      totalPausedMilliseconds: (session.totalPausedMilliseconds || 0) + additionalPausedMs,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'session_resumed',
    });

    return (await db.liveClassSessions.get(sessionId))!;
  }

  /**
   * Hoàn thành phiên học (Complete Session)
   */
  async completeSession(sessionId: string): Promise<LiveClassSession> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) {
      throw new Error('Không tìm thấy phiên học trực tuyến.');
    }

    const nowISO = new Date().toISOString();
    let additionalPausedMs = 0;
    if (session.status === 'paused' && session.pausedAt) {
      additionalPausedMs = Date.now() - new Date(session.pausedAt).getTime();
    }

    await db.liveClassSessions.update(sessionId, {
      status: 'completed',
      pausedAt: null,
      totalPausedMilliseconds: (session.totalPausedMilliseconds || 0) + additionalPausedMs,
      endedAt: nowISO,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'session_completed',
    });

    return (await db.liveClassSessions.get(sessionId))!;
  }

  /**
   * Mở lại phiên học đã hoàn thành (Reopen Session)
   */
  async reopenSession(sessionId: string): Promise<LiveClassSession> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) {
      throw new Error('Không tìm thấy phiên học trực tuyến.');
    }

    // Check if another session in same class is active/paused
    const existingActive = await db.liveClassSessions
      .where('classId')
      .equals(session.classId)
      .filter((s) => (s.status === 'active' || s.status === 'paused') && s.id !== sessionId)
      .first();

    if (existingActive) {
      throw new Error(`Không thể mở lại phiên: Lớp học đang có một phiên trực tuyến khác đang chạy ("${existingActive.title}").`);
    }

    const nowISO = new Date().toISOString();
    await db.liveClassSessions.update(sessionId, {
      status: 'active',
      endedAt: null,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'session_resumed',
      metadata: { action: 'reopen' },
    });

    return (await db.liveClassSessions.get(sessionId))!;
  }

  async getSessionById(sessionId: string): Promise<LiveClassSession | undefined> {
    return await db.liveClassSessions.get(sessionId);
  }

  async getActiveSessionByClass(classId: string): Promise<LiveClassSession | undefined> {
    return await db.liveClassSessions
      .where('classId')
      .equals(classId)
      .filter((s) => s.status === 'active' || s.status === 'paused')
      .first();
  }

  async getAllSessions(classId?: string): Promise<LiveClassSession[]> {
    if (classId) {
      return await db.liveClassSessions
        .where('classId')
        .equals(classId)
        .reverse()
        .sortBy('createdAt');
    }
    return await db.liveClassSessions.reverse().sortBy('createdAt');
  }

  /**
   * Tính toán tổng số giây đã thực sự diễn ra (không tính thời gian tạm dừng)
   */
  calculateElapsedSeconds(session: LiveClassSession): number {
    if (!session.startedAt) return 0;

    const startTime = new Date(session.startedAt).getTime();
    let endTime = Date.now();

    if (session.status === 'completed' && session.endedAt) {
      endTime = new Date(session.endedAt).getTime();
    } else if (session.status === 'paused' && session.pausedAt) {
      endTime = new Date(session.pausedAt).getTime();
    }

    const totalPaused = session.totalPausedMilliseconds || 0;
    const elapsedMs = Math.max(0, endTime - startTime - totalPaused);
    return Math.floor(elapsedMs / 1000);
  }

  /**
   * Đồng bộ sổ điểm danh: Ghi kết quả điểm danh phiên trực tuyến vào sổ điểm danh chính (attendanceSessions / attendanceRecords)
   */
  async syncAttendanceToMainBook(
    sessionId: string,
    overwriteExistingNotes: boolean = false
  ): Promise<{ attendanceSessionId: string; created: boolean }> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) {
      throw new Error('Không tìm thấy phiên học trực tuyến.');
    }

    const participants = await db.liveClassParticipants
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    if (participants.length === 0) {
      throw new Error('Chưa có danh sách học sinh tham gia phiên.');
    }

    const targetDate = session.sessionDate || getTodayDateString();
    const nowISO = new Date().toISOString();

    // Check existing attendanceSession in main book for this class & date
    const existingSession = await db.attendanceSessions
      .where('classId')
      .equals(session.classId)
      .filter((s) => s.sessionDate === targetDate && !s.deletedAt)
      .first();

    let created = false;
    let attendanceSessionId = '';

    await db.runTransaction('rw', [db.attendanceSessions, db.attendanceRecords, db.auditLogs], async () => {
      if (!existingSession) {
        // Create new attendance session in main book
        attendanceSessionId = crypto.randomUUID();
        await db.attendanceSessions.add({
          id: attendanceSessionId,
          classId: session.classId,
          termId: session.termId || undefined,
          sessionDate: targetDate,
          status: 'Completed',
          note: 'Đồng bộ từ Lớp học trực tuyến',
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        });
        created = true;
      } else {
        attendanceSessionId = existingSession.id;
      }

      // Upsert attendance records
      for (const p of participants) {
        // Map live status to main attendance status
        let mappedStatus: 'Present' | 'Late' | 'ExcusedAbsence' | 'UnexcusedAbsence' = 'Present';
        if (p.attendanceStatus === 'late') mappedStatus = 'Late';
        else if (p.attendanceStatus === 'absent') mappedStatus = 'UnexcusedAbsence';
        else if (p.attendanceStatus === 'left') mappedStatus = 'ExcusedAbsence';
        else if (p.attendanceStatus === 'present') mappedStatus = 'Present';
        else mappedStatus = 'Present'; // Default fallback

        const existingRecord = await db.attendanceRecords
          .where('sessionId')
          .equals(attendanceSessionId)
          .filter((r) => r.studentId === p.studentId && !r.deletedAt)
          .first();

        const noteText = p.quickNote || (p.participationCount > 0 ? `Phát biểu: ${p.participationCount} lần` : undefined);

        if (existingRecord) {
          await db.attendanceRecords.update(existingRecord.id, {
            status: mappedStatus,
            note: overwriteExistingNotes ? noteText || existingRecord.note : existingRecord.note || noteText,
            updatedAt: nowISO,
          });
        } else {
          await db.attendanceRecords.add({
            id: crypto.randomUUID(),
            sessionId: attendanceSessionId,
            studentId: p.studentId,
            status: mappedStatus,
            note: noteText,
            createdAt: nowISO,
            updatedAt: nowISO,
            deletedAt: null,
          });
        }
      }

      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'AttendanceSession',
        recordId: attendanceSessionId,
        action: created ? 'CREATE' : 'UPDATE',
        timestamp: nowISO,
        details: `Đồng bộ điểm danh từ phiên trực tuyến "${session.title}" (Ngày ${targetDate})`,
      });
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'attendance_synced_to_main_book',
      metadata: { attendanceSessionId, created, targetDate },
    });

    return { attendanceSessionId, created };
  }
  /**
   * Nạp dữ liệu điểm danh đã khóa từ Sổ điểm danh chính vào Lớp học trực tuyến
   */
  async importAttendanceFromMainBook(sessionId: string): Promise<number> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) throw new Error('Không tìm thấy phiên học.');

    const targetDate = session.sessionDate || getTodayDateString();
    const mainSession = await db.attendanceSessions
      .where('classId')
      .equals(session.classId)
      .filter((s) => s.sessionDate === targetDate && !s.deletedAt)
      .first();

    if (!mainSession) {
      throw new Error(`Chưa có phiên điểm danh nào trong Sổ điểm danh chính cho ngày ${targetDate}.`);
    }

    const records = await db.attendanceRecords
      .where('sessionId')
      .equals(mainSession.id)
      .filter((r) => !r.deletedAt)
      .toArray();

    const recordMap = new Map(records.map((r) => [r.studentId, r.status]));
    const participants = await db.liveClassParticipants.where('sessionId').equals(sessionId).toArray();

    const nowISO = new Date().toISOString();
    let updatedCount = 0;

    await db.runTransaction('rw', [db.liveClassParticipants], async () => {
      for (const p of participants) {
        const mainStatus = recordMap.get(p.studentId);
        if (mainStatus) {
          let mapped: LiveAttendanceStatus = 'present';
          if (mainStatus === 'Late') mapped = 'late';
          else if (mainStatus === 'ExcusedAbsence') mapped = 'left';
          else if (mainStatus === 'UnexcusedAbsence') mapped = 'absent';
          else if (mainStatus === 'Present') mapped = 'present';

          await db.liveClassParticipants.update(p.id, {
            attendanceStatus: mapped,
            updatedAt: nowISO,
          });
          updatedCount++;
        }
      }
    });

    return updatedCount;
  }
}

export const liveClassSessionService = new LiveClassSessionService();

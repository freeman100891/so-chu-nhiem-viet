import { db } from '../../database/db';
import type { LiveAttendanceStatus, LiveClassParticipant, PointEntry } from '../../database/types';
import { getTodayDateString } from '../../../shared/utilities/date';
import { liveClassEventService } from './live-event.service';
import { rankIntegrationService } from '../rank-integration.service';
import { levelUpCelebrationService } from '../level-up-celebration/level-up-celebration.service';

import type { DirectLevelChangeNotification } from '../../types/avatar-theme.types';

export class LiveClassParticipantService {
  async getParticipants(sessionId: string): Promise<LiveClassParticipant[]> {
    return await db.liveClassParticipants
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  }

  async updateAttendance(
    sessionId: string,
    studentId: string,
    attendanceStatus: LiveAttendanceStatus
  ): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong danh sách phiên học này.');
    }

    const nowISO = new Date().toISOString();
    const joinedAt =
      (attendanceStatus === 'present' || attendanceStatus === 'late') && !participant.joinedAt
        ? nowISO
        : participant.joinedAt;
    const leftAt = attendanceStatus === 'left' ? nowISO : participant.leftAt;

    await db.liveClassParticipants.update(participant.id, {
      attendanceStatus,
      joinedAt,
      leftAt,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'attendance_changed',
      value: attendanceStatus,
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  async toggleHandRaised(
    sessionId: string,
    studentId: string,
    handRaisedState?: boolean
  ): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong phiên học.');
    }

    const nextState = handRaisedState !== undefined ? handRaisedState : !participant.handRaised;
    const nowISO = new Date().toISOString();

    await db.liveClassParticipants.update(participant.id, {
      handRaised: nextState,
      handRaisedAt: nextState ? nowISO : null,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: nextState ? 'hand_raised' : 'hand_lowered',
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  async incrementParticipation(sessionId: string, studentId: string): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong phiên học.');
    }

    const nowISO = new Date().toISOString();
    const nextCount = participant.participationCount + 1;

    await db.liveClassParticipants.update(participant.id, {
      participationCount: nextCount,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'participation_added',
      value: nextCount,
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  async incrementRandomSelection(sessionId: string, studentId: string): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong phiên học.');
    }

    const nowISO = new Date().toISOString();
    const nextCount = participant.randomSelectionCount + 1;

    await db.liveClassParticipants.update(participant.id, {
      randomSelectionCount: nextCount,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'student_selected',
      value: nextCount,
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  async updateQuickNote(sessionId: string, studentId: string, note: string): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong phiên học.');
    }

    const nowISO = new Date().toISOString();
    await db.liveClassParticipants.update(participant.id, {
      quickNote: note,
      updatedAt: nowISO,
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  /**
   * Cộng/Trừ điểm cá nhân trực tiếp vào PointEntries thông qua PointService
   */
  async awardIndividualPoint(
    sessionId: string,
    studentId: string,
    classId: string,
    categoryId: string,
    points: number,
    reason: string
  ): Promise<PointEntry & { notifications: DirectLevelChangeNotification[] }> {
    const session = await db.liveClassSessions.get(sessionId);
    if (session && session.status === 'completed') {
      throw new Error('Phiên học đã kết thúc. Không thể thêm điểm mới.');
    }

    const nowISO = new Date().toISOString();
    const today = getTodayDateString();

    const entry: PointEntry = {
      id: crypto.randomUUID(),
      classId,
      studentId,
      categoryId,
      points,
      reason,
      occurredAt: today,
      recordedBy: 'Phiên lớp học trực tuyến',
      source: 'live_classroom',
      sourceId: sessionId,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.runTransaction('rw', [db.pointEntries, db.auditLogs], async () => {
      await db.pointEntries.add(entry);
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'PointEntry',
        recordId: entry.id,
        action: 'CREATE',
        timestamp: nowISO,
        details: `Ghi điểm trực tuyến (${points > 0 ? '+' : ''}${points}) cho học sinh (${studentId})`,
      });
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'individual_point',
      value: points,
      metadata: { categoryId, points, reason, pointEntryId: entry.id },
    });

    const notifications: DirectLevelChangeNotification[] = [];

    try {
      const allEntries = await db.pointEntries
        .where('studentId')
        .equals(studentId)
        .filter((e) => !e.deletedAt)
        .toArray();
      const currentScore = allEntries.reduce((sum, e) => sum + e.points, 0);
      const previousScore = currentScore - points;

      const transResult = await levelUpCelebrationService.processPointEntryTransition({
        classId,
        studentId,
        liveSessionId: sessionId,
        sourcePointTransactionId: entry.id,
        previousScore,
        currentScore,
        reason,
      });

      if ((transResult as any)?.notification) {
        notifications.push((transResult as any).notification);
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra thăng cấp avatar 5 cấp sau khi thưởng điểm trực tuyến:', err);
    }

    try {
      await rankIntegrationService.processPointEntryChange({
        classId,
        studentIds: [studentId],
        sourcePointEntryId: entry.id,
        liveSessionId: sessionId,
        reason,
      });
    } catch (err) {
      console.warn('Lỗi tính lại cấp bậc thi đua sau khi thưởng điểm trực tuyến:', err);
    }

    return Object.assign(entry, { notifications }) as PointEntry & {
      notifications: DirectLevelChangeNotification[];
    };
  }

  /**
   * Hoàn tác điểm cá nhân: tạo pointEntry đảo ngược liên kết reversedEntryId
   */
  async undoIndividualPoint(sessionId: string, pointEntryId: string): Promise<PointEntry & { notifications: DirectLevelChangeNotification[] }> {
    const original = await db.pointEntries.get(pointEntryId);
    if (!original) {
      throw new Error('Không tìm thấy bản ghi điểm ban đầu để hoàn tác.');
    }

    const nowISO = new Date().toISOString();
    const today = getTodayDateString();

    const reversalEntry: PointEntry = {
      id: crypto.randomUUID(),
      classId: original.classId,
      studentId: original.studentId,
      categoryId: original.categoryId,
      points: -original.points,
      reason: `Hoàn tác: ${original.reason}`,
      occurredAt: today,
      recordedBy: 'Hoàn tác phiên trực tuyến',
      source: 'live_classroom',
      sourceId: sessionId,
      reversedEntryId: original.id,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.runTransaction('rw', [db.pointEntries, db.auditLogs], async () => {
      await db.pointEntries.add(reversalEntry);
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'PointEntry',
        recordId: reversalEntry.id,
        action: 'REVERSE',
        timestamp: nowISO,
        details: `Hoàn tác điểm trực tuyến (${-original.points > 0 ? '+' : ''}${-original.points}) cho bản ghi ${original.id}`,
      });
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId: original.studentId,
      eventType: 'individual_point_reversed',
      value: -original.points,
      metadata: { originalId: original.id, reversalId: reversalEntry.id },
    });

    const notifications: DirectLevelChangeNotification[] = [];
    try {
      const allEntries = await db.pointEntries
        .where('studentId')
        .equals(original.studentId)
        .filter((e) => !e.deletedAt)
        .toArray();
      const currentScore = allEntries.reduce((sum, e) => sum + e.points, 0);
      const previousScore = currentScore - (-original.points);

      const transResult = await levelUpCelebrationService.processPointEntryTransition({
        classId: original.classId,
        studentId: original.studentId,
        liveSessionId: sessionId,
        sourcePointTransactionId: reversalEntry.id,
        previousScore,
        currentScore,
        reason: reversalEntry.reason,
      });

      if ((transResult as any)?.notification) {
        notifications.push((transResult as any).notification);
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra chuyển cấp avatar sau khi hoàn tác điểm:', err);
    }

    try {
      await rankIntegrationService.processPointEntryChange({
        classId: original.classId,
        studentIds: [original.studentId],
        sourcePointEntryId: reversalEntry.id,
        reason: reversalEntry.reason,
      });
    } catch (err) {
      console.warn('Lỗi tính lại cấp bậc thi đua sau khi hoàn tác điểm trực tuyến:', err);
    }

    return Object.assign(reversalEntry, { notifications }) as PointEntry & {
      notifications: DirectLevelChangeNotification[];
    };
  }

  /**
   * Hoàn tác lượt phát biểu
   */
  async undoParticipation(sessionId: string, studentId: string): Promise<LiveClassParticipant> {
    const participant = await db.liveClassParticipants
      .where('[sessionId+studentId]')
      .equals([sessionId, studentId])
      .first();

    if (!participant) {
      throw new Error('Học sinh không nằm trong phiên học.');
    }

    const nowISO = new Date().toISOString();
    const nextCount = Math.max(0, participant.participationCount - 1);

    await db.liveClassParticipants.update(participant.id, {
      participationCount: nextCount,
      updatedAt: nowISO,
    });

    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'participation_reversed',
      value: nextCount,
    });

    return (await db.liveClassParticipants.get(participant.id))!;
  }

  /**
   * Cộng/trừ điểm hàng loạt cho danh sách học sinh được chọn (Multi-Select)
   */
  async batchAwardPoints(
    sessionId: string,
    studentIds: string[],
    classId: string,
    categoryId: string,
    points: number,
    reason: string
  ): Promise<PointEntry[] & { notifications: DirectLevelChangeNotification[] }> {
    const nowISO = new Date().toISOString();
    const today = getTodayDateString();
    const entries: PointEntry[] = [];

    await db.runTransaction('rw', [db.pointEntries, db.auditLogs], async () => {
      for (const stId of studentIds) {
        const entry: PointEntry = {
          id: crypto.randomUUID(),
          classId,
          studentId: stId,
          categoryId,
          points,
          reason,
          occurredAt: today,
          recordedBy: 'Cộng điểm nhóm/hàng loạt trực tuyến',
          source: 'live_classroom',
          sourceId: sessionId,
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        };
        await db.pointEntries.add(entry);
        entries.push(entry);

        await db.auditLogs.add({
          id: crypto.randomUUID(),
          entityName: 'PointEntry',
          recordId: entry.id,
          action: 'CREATE',
          timestamp: nowISO,
          details: `Cộng điểm hàng loạt (${points > 0 ? '+' : ''}${points}) cho học sinh (${stId})`,
        });
      }
    });

    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'batch_points_awarded',
      value: points,
      metadata: { count: studentIds.length, points, reason },
    });

    const notifications: DirectLevelChangeNotification[] = [];

    try {
      for (const entry of entries) {
        const allEntries = await db.pointEntries
          .where('studentId')
          .equals(entry.studentId)
          .filter((e) => !e.deletedAt)
          .toArray();
        const currentScore = allEntries.reduce((sum, e) => sum + e.points, 0);
        const previousScore = currentScore - points;

        const transResult = await levelUpCelebrationService.processPointEntryTransition({
          classId,
          studentId: entry.studentId,
          liveSessionId: sessionId,
          sourcePointTransactionId: entry.id,
          previousScore,
          currentScore,
          reason,
        });

        if ((transResult as any)?.notification) {
          notifications.push((transResult as any).notification);
        }
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra thăng cấp avatar 5 cấp sau khi cộng điểm hàng loạt:', err);
    }

    try {
      await rankIntegrationService.processPointEntryChange({
        classId,
        studentIds,
        liveSessionId: sessionId,
        reason,
      });
    } catch (err) {
      console.warn('Lỗi tính lại cấp bậc thi đua sau khi thưởng điểm hàng loạt:', err);
    }

    return Object.assign(entries, { notifications }) as PointEntry[] & {
      notifications: DirectLevelChangeNotification[];
    };
  }
}

export const liveClassParticipantService = new LiveClassParticipantService();

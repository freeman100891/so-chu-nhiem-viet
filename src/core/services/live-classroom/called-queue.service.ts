import { db } from '../../database/db';
import type { LiveClassParticipant, Student } from '../../database/types';
import { liveClassEventService } from './live-event.service';
import { rankCalculationService, type RankProgressResult } from '../rank-calculation.service';
import { rankSeedService } from '../rank-seed.service';

export type CalledInteractionStatus = 'pending' | 'answered' | 'needs_support' | 'skipped';

export interface CalledStudentItem {
  studentId: string;
  student: Student;
  participant: LiveClassParticipant;
  callCount: number;
  firstCalledAt: string;
  lastCalledAt: string;
  sessionPoints: number;
  interactionStatus: CalledInteractionStatus;
  isRemoved: boolean;
  rankInfo?: RankProgressResult;
  justPromoted?: boolean;
}

export type QueueSortOption = 'newest' | 'oldest' | 'pending_first' | 'highest_points';
export type QueueFilterOption = 'all' | 'pending' | 'answered' | 'needs_support' | 'has_points';

class CalledQueueService {
  /**
   * Aggregate called students working queue from liveClassEvents & pointEntries
   */
  async getCalledQueue(
    sessionId: string,
    participants: LiveClassParticipant[],
    studentMap: Map<string, Student>
  ): Promise<CalledStudentItem[]> {
    if (!sessionId) return [];

    // Fetch all events for session
    const events = await db.liveClassEvents.where('sessionId').equals(sessionId).toArray();

    // 1. Find latest queue reset timestamp
    const resetEvents = events
      .filter((e) => e.eventType === 'called_queue_reset')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const lastResetTime = resetEvents.length > 0 ? new Date(resetEvents[0]!.createdAt).getTime() : 0;

    // 2. Filter events after last reset time
    const activeEvents = events.filter((e) => new Date(e.createdAt).getTime() >= lastResetTime);

    // 3. Filter student_selected events
    const selectionEvents = activeEvents
      .filter((e) => e.eventType === 'student_selected' && e.studentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (selectionEvents.length === 0) return [];

    // 4. Batch query point entries for session to compute sessionPoints per student
    const pointEntries = await db.pointEntries
      .filter((e) => e.sourceId === sessionId && !e.deletedAt)
      .toArray();

    const studentPointsMap = new Map<string, number>();
    pointEntries.forEach((entry) => {
      const current = studentPointsMap.get(entry.studentId) || 0;
      studentPointsMap.set(entry.studentId, current + entry.points);
    });

    // 5. Group by studentId
    const studentEventsMap = new Map<string, typeof selectionEvents>();
    selectionEvents.forEach((evt) => {
      const stId = evt.studentId!;
      const list = studentEventsMap.get(stId) || [];
      list.push(evt);
      studentEventsMap.set(stId, list);
    });

    // 6. Batch calculate ranks & recent promotions for the session's class
    const session = await db.liveClassSessions.get(sessionId);
    const studentRanksMap = new Map<string, RankProgressResult>();
    const justPromotedMap = new Map<string, boolean>();

    if (session) {
      const cls = await db.classes.get(session.classId);
      if (cls) {
        try {
          const { system } = await rankSeedService.seedDefaultRankSystem(cls.academicYearId);
          const classRanks = await rankCalculationService.recalculateClassRanks(cls.id, system.id);
          classRanks.forEach((val, key) => studentRanksMap.set(key, val));

          const sessionStart = session.startedAt || session.createdAt;
          const sessionPromotions = await db.studentRankHistory
            .where('classId')
            .equals(cls.id)
            .filter((h) => h.changeType === 'promotion' && h.createdAt >= sessionStart)
            .toArray();

          sessionPromotions.forEach((h) => justPromotedMap.set(h.studentId, true));
        } catch (rErr) {
          console.error('Error calculating ranks in called queue:', rErr);
        }
      }
    }

    const queueItems: CalledStudentItem[] = [];

    studentEventsMap.forEach((studentSelections, studentId) => {
      const st = studentMap.get(studentId);
      const part = participants.find((p) => p.studentId === studentId);
      if (!st || !part) return;

      const callCount = studentSelections.length;
      const firstCalledAt = studentSelections[0]!.createdAt;
      const lastCalledAt = studentSelections[studentSelections.length - 1]!.createdAt;

      // Find events for this student after lastCalledAt to determine interactionStatus & isRemoved
      const studentSubsequentEvents = activeEvents.filter(
        (e) => e.studentId === studentId && new Date(e.createdAt).getTime() >= new Date(firstCalledAt).getTime()
      );

      let interactionStatus: CalledInteractionStatus = 'pending';
      let isRemoved = false;

      // Evaluate status events in chronological order
      studentSubsequentEvents.forEach((e) => {
        if (e.eventType === 'called_student_answered') {
          interactionStatus = 'answered';
        } else if (e.eventType === 'called_student_needs_support') {
          interactionStatus = 'needs_support';
        } else if (e.eventType === 'called_student_skipped') {
          interactionStatus = 'skipped';
        } else if (e.eventType === 'called_student_reopened') {
          interactionStatus = 'pending';
        } else if (e.eventType === 'called_student_removed_from_queue') {
          isRemoved = true;
        }
      });

      const sessionPoints = studentPointsMap.get(studentId) || 0;

      queueItems.push({
        studentId,
        student: st,
        participant: part,
        callCount,
        firstCalledAt,
        lastCalledAt,
        sessionPoints,
        interactionStatus,
        isRemoved,
        rankInfo: studentRanksMap.get(studentId),
        justPromoted: justPromotedMap.get(studentId) || false,
      });
    });

    return queueItems;
  }

  /**
   * Sort queue items based on selected sort criteria
   */
  sortQueue(items: CalledStudentItem[], sortBy: QueueSortOption): CalledStudentItem[] {
    const list = [...items];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.lastCalledAt).getTime() - new Date(a.lastCalledAt).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.firstCalledAt).getTime() - new Date(b.firstCalledAt).getTime());
      case 'pending_first':
        return list.sort((a, b) => {
          if (a.interactionStatus === 'pending' && b.interactionStatus !== 'pending') return -1;
          if (a.interactionStatus !== 'pending' && b.interactionStatus === 'pending') return 1;
          return new Date(b.lastCalledAt).getTime() - new Date(a.lastCalledAt).getTime();
        });
      case 'highest_points':
        return list.sort((a, b) => b.sessionPoints - a.sessionPoints);
      default:
        return list;
    }
  }

  /**
   * Filter queue items based on selected filter tab
   */
  filterQueue(items: CalledStudentItem[], filterBy: QueueFilterOption): CalledStudentItem[] {
    return items.filter((item) => {
      if (item.isRemoved) return false;
      switch (filterBy) {
        case 'pending':
          return item.interactionStatus === 'pending';
        case 'answered':
          return item.interactionStatus === 'answered';
        case 'needs_support':
          return item.interactionStatus === 'needs_support';
        case 'has_points':
          return item.sessionPoints !== 0;
        case 'all':
        default:
          return true;
      }
    });
  }

  // --- ACTION METHODS ---

  async markAnswered(sessionId: string, studentId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'called_student_answered',
    });
  }

  async markNeedsSupport(sessionId: string, studentId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'called_student_needs_support',
    });
  }

  async markSkipped(sessionId: string, studentId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'called_student_skipped',
    });
  }

  async reopenStudent(sessionId: string, studentId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'called_student_reopened',
    });
  }

  async removeFromQueue(sessionId: string, studentId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      studentId,
      eventType: 'called_student_removed_from_queue',
    });
  }

  async resetQueue(sessionId: string): Promise<void> {
    await liveClassEventService.logEvent({
      sessionId,
      eventType: 'called_queue_reset',
    });
  }
}

export const calledQueueService = new CalledQueueService();

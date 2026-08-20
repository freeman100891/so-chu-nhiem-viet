import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../database/db';
import { liveClassSessionService } from './live-session.service';
import { liveClassParticipantService } from './live-participant.service';
import { liveClassGroupService } from './live-group.service';
import { liveClassEventService } from './live-event.service';
import { calledQueueService } from './called-queue.service';
import { getTodayDateString } from '../../../shared/utilities/date';

describe('Live Classroom Module Integration Tests', () => {
  const mockClassId = 'class-live-101';
  const mockStudent1 = 'student-live-1';
  const mockStudent2 = 'student-live-2';
  const mockCategoryId = 'cat-live-1';

  beforeEach(async () => {
    // Clear all live classroom tables before each test
    await db.liveClassSessions.clear();
    await db.liveClassParticipants.clear();
    await db.liveClassGroups.clear();
    await db.liveClassGroupMembers.clear();
    await db.liveClassEvents.clear();
    await db.classEnrollments.clear();
    await db.students.clear();
    await db.pointEntries.clear();
    await db.pointCategories.clear();

    // Seed mock data
    const nowISO = new Date().toISOString();

    await db.students.bulkAdd([
      {
        id: mockStudent1,
        studentCode: 'HS2026001',
        fullName: 'Nguyễn Văn An',
        normalizedName: 'nguyen van an',
        gender: 'Nam',
        dateOfBirth: '2008-01-01',
        createdAt: nowISO,
        updatedAt: nowISO,
      },
      {
        id: mockStudent2,
        studentCode: 'HS2026002',
        fullName: 'Trần Thị Thu',
        normalizedName: 'tran thi thu',
        gender: 'Nữ',
        dateOfBirth: '2008-05-05',
        createdAt: nowISO,
        updatedAt: nowISO,
      },
    ]);

    await db.pointCategories.add({
      id: mockCategoryId,
      name: 'Phát biểu hay',
      type: 'Merit',
      defaultPoints: 10,
      createdAt: nowISO,
      updatedAt: nowISO,
    });
  });

  it('1. Business Rule: Cannot start session if class has no active students', async () => {
    // Draft session for a class with 0 enrollments
    const draft = await liveClassSessionService.createDraft({
      classId: mockClassId,
      title: 'Tiết 1: Toán',
      subject: 'Toán học',
    });

    await expect(liveClassSessionService.startSession(draft.id)).rejects.toThrow(
      'Không thể bắt đầu phiên: Lớp học không có học sinh đang hoạt động (Active).'
    );
  });

  it('2. Start session successfully and snapshot active enrollments', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.bulkAdd([
      {
        id: 'enroll-1',
        classId: mockClassId,
        studentId: mockStudent1,
        joinedAt: today,
        status: 'Active',
        createdAt: nowISO,
        updatedAt: nowISO,
      },
      {
        id: 'enroll-2',
        classId: mockClassId,
        studentId: mockStudent2,
        joinedAt: today,
        status: 'Active',
        createdAt: nowISO,
        updatedAt: nowISO,
      },
    ]);

    const draft = await liveClassSessionService.createDraft({
      classId: mockClassId,
      title: 'Tiết 1: Ôn tập Đại số',
      subject: 'Toán học',
      meetingPlatform: 'meet',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    });

    const activeSession = await liveClassSessionService.startSession(draft.id);
    expect(activeSession.status).toBe('active');
    expect(activeSession.startedAt).toBeTruthy();

    const participants = await liveClassParticipantService.getParticipants(activeSession.id);
    expect(participants.length).toBe(2);
    expect(participants[0]?.attendanceStatus).toBe('unchecked');

    const events = await liveClassEventService.getEvents(activeSession.id);
    expect(events.some((e) => e.eventType === 'session_started')).toBe(true);
  });

  it('3. Business Rule: Only 1 active/paused session per class at a time', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.add({
      id: 'enroll-1',
      classId: mockClassId,
      studentId: mockStudent1,
      joinedAt: today,
      status: 'Active',
      createdAt: nowISO,
      updatedAt: nowISO,
    });

    const session1 = await liveClassSessionService.createDraft({
      classId: mockClassId,
      title: 'Phiên 1',
      subject: 'Văn',
    });
    await liveClassSessionService.startSession(session1.id);

    const session2 = await liveClassSessionService.createDraft({
      classId: mockClassId,
      title: 'Phiên 2',
      subject: 'Anh',
    });

    await expect(liveClassSessionService.startSession(session2.id)).rejects.toThrow(
      'đang có một phiên học trực tuyến đang chạy'
    );
  });

  it('4. Pause, Resume, and Elapsed time calculation', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.add({
      id: 'enroll-1',
      classId: mockClassId,
      studentId: mockStudent1,
      joinedAt: today,
      status: 'Active',
      createdAt: nowISO,
      updatedAt: nowISO,
    });

    const draft = await liveClassSessionService.createDraft({
      classId: mockClassId,
      title: 'Tiết Lý',
      subject: 'Vật Lý',
    });

    let session = await liveClassSessionService.startSession(draft.id);
    expect(session.status).toBe('active');

    session = await liveClassSessionService.pauseSession(session.id);
    expect(session.status).toBe('paused');
    expect(session.pausedAt).toBeTruthy();

    session = await liveClassSessionService.resumeSession(session.id);
    expect(session.status).toBe('active');
    expect(session.pausedAt).toBeNull();

    session = await liveClassSessionService.completeSession(session.id);
    expect(session.status).toBe('completed');
    expect(session.endedAt).toBeTruthy();
  });

  it('5. Individual & Group points integration with pointEntries', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.bulkAdd([
      { id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
      { id: 'e2', classId: mockClassId, studentId: mockStudent2, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
    ]);

    const session = await liveClassSessionService.startSession(
      (await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Thảo luận nhóm', subject: 'Sinh học' })).id
    );

    // Award individual point
    const pointEntry = await liveClassParticipantService.awardIndividualPoint(
      session.id,
      mockStudent1,
      mockClassId,
      mockCategoryId,
      10,
      'Phát biểu đúng câu hỏi khó'
    );
    expect(pointEntry.source).toBe('live_classroom');
    expect(pointEntry.sourceId).toBe(session.id);

    // Auto assign groups & award group point
    const groups = await liveClassGroupService.autoAssignGroups(session.id, 2);
    expect(groups.length).toBe(2);

    const groupEntries = await liveClassGroupService.awardGroupPoint(
      session.id,
      groups[0]!.id,
      mockClassId,
      mockCategoryId,
      5,
      'Nhóm hoàn thành bài thuyết trình sắc bén'
    );
    expect(groupEntries.length).toBe(1);
    expect(groupEntries[0]?.source).toBe('live_classroom');
  });

  it('6. Undo individual point creates reversal pointEntry with reversedEntryId', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.add({ id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO });
    const session = await liveClassSessionService.startSession(
      (await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Phiên kiểm tra hoàn tác', subject: 'Toán' })).id
    );

    const original = await liveClassParticipantService.awardIndividualPoint(
      session.id,
      mockStudent1,
      mockClassId,
      mockCategoryId,
      5,
      'Cộng nhầm điểm'
    );

    const reversal = await liveClassParticipantService.undoIndividualPoint(session.id, original.id);
    expect(reversal.points).toBe(-5);
    expect(reversal.reversedEntryId).toBe(original.id);
    expect(reversal.source).toBe('live_classroom');

    // Total points in pointEntries should balance out to 0
    const allEntries = await db.pointEntries.where('studentId').equals(mockStudent1).toArray();
    const totalPoints = allEntries.reduce((sum, e) => sum + e.points, 0);
    expect(totalPoints).toBe(0);
  });

  it('7. Sync live attendance to main attendance book without duplicates', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.bulkAdd([
      { id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
      { id: 'e2', classId: mockClassId, studentId: mockStudent2, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
    ]);

    const session = await liveClassSessionService.startSession(
      (await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Tiết Điểm Danh', subject: 'Anh', sessionDate: today })).id
    );

    await liveClassParticipantService.updateAttendance(session.id, mockStudent1, 'present');
    await liveClassParticipantService.updateAttendance(session.id, mockStudent2, 'late');

    // Sync to main book for first time
    const res1 = await liveClassSessionService.syncAttendanceToMainBook(session.id);
    expect(res1.created).toBe(true);

    const sessionCount1 = await db.attendanceSessions.where('classId').equals(mockClassId).count();
    expect(sessionCount1).toBe(1);

    // Sync to main book second time (should NOT create duplicate attendanceSession)
    const res2 = await liveClassSessionService.syncAttendanceToMainBook(session.id);
    expect(res2.created).toBe(false);
    expect(res2.attendanceSessionId).toBe(res1.attendanceSessionId);

    const sessionCount2 = await db.attendanceSessions.where('classId').equals(mockClassId).count();
    expect(sessionCount2).toBe(1);
  });

  it('8. Complete session sets endedAt and prevents new event logging', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.add({ id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO });
    const draft = await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Phiên kết thúc', subject: 'Lịch sử' });
    const active = await liveClassSessionService.startSession(draft.id);

    const completed = await liveClassSessionService.completeSession(active.id);
    expect(completed.status).toBe('completed');
    expect(completed.endedAt).toBeTruthy();

    await expect(
      liveClassParticipantService.awardIndividualPoint(completed.id, mockStudent1, mockClassId, mockCategoryId, 10, 'Test')
    ).rejects.toThrow('Phiên học đã kết thúc');
  });

  it('9. Clone session configuration creates clean new draft without old points/events', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.add({ id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO });
    const draft = await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Phiên gốc', subject: 'Địa lý' });
    const active = await liveClassSessionService.startSession(draft.id);

    await liveClassParticipantService.awardIndividualPoint(active.id, mockStudent1, mockClassId, mockCategoryId, 5, 'Điểm cũ');
    await liveClassSessionService.completeSession(active.id);

    // Clone config to new session
    const newDraft = await liveClassSessionService.createDraft({
      classId: active.classId,
      title: `${active.title} (Bản sao)`,
      subject: active.subject,
      meetingPlatform: active.meetingPlatform,
      meetingUrl: active.meetingUrl || undefined,
    });

    expect(newDraft.title).toBe('Phiên gốc (Bản sao)');
    expect(newDraft.status).toBe('draft');

    // Verify new draft has NO participants or point entries yet
    const newParts = await liveClassParticipantService.getParticipants(newDraft.id);
    expect(newParts.length).toBe(0);
  });

  it('10. CalledStudentsQueueService aggregates events, handles duplicates, status, and reset queue', async () => {
    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    await db.classEnrollments.bulkAdd([
      { id: 'e1', classId: mockClassId, studentId: mockStudent1, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
      { id: 'e2', classId: mockClassId, studentId: mockStudent2, joinedAt: today, status: 'Active', createdAt: nowISO, updatedAt: nowISO },
    ]);

    const session = await liveClassSessionService.startSession(
      (await liveClassSessionService.createDraft({ classId: mockClassId, title: 'Phiên gọi tên', subject: 'Toán' })).id
    );

    const parts = await liveClassParticipantService.getParticipants(session.id);
    const sMap = new Map();
    (await db.students.toArray()).forEach((st) => sMap.set(st.id, st));

    // Call student 1 first time
    await liveClassEventService.logEvent({ sessionId: session.id, studentId: mockStudent1, eventType: 'student_selected' });
    let queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    expect(queue.length).toBe(1);
    expect(queue[0]?.studentId).toBe(mockStudent1);
    expect(queue[0]?.callCount).toBe(1);
    expect(queue[0]?.interactionStatus).toBe('pending');

    // Call student 1 second time (should NOT create duplicate row, but increment callCount to 2)
    await liveClassEventService.logEvent({ sessionId: session.id, studentId: mockStudent1, eventType: 'student_selected' });
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    expect(queue.length).toBe(1);
    expect(queue[0]?.callCount).toBe(2);

    // Call student 2
    await liveClassEventService.logEvent({ sessionId: session.id, studentId: mockStudent2, eventType: 'student_selected' });
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    expect(queue.length).toBe(2);

    // Mark student 1 answered
    await calledQueueService.markAnswered(session.id, mockStudent1);
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    const st1Item = queue.find((i) => i.studentId === mockStudent1);
    expect(st1Item?.interactionStatus).toBe('answered');

    // Mark student 2 needs support
    await calledQueueService.markNeedsSupport(session.id, mockStudent2);
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    const st2Item = queue.find((i) => i.studentId === mockStudent2);
    expect(st2Item?.interactionStatus).toBe('needs_support');

    // Remove student 2 from working queue
    await calledQueueService.removeFromQueue(session.id, mockStudent2);
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    const filteredQueue = calledQueueService.filterQueue(queue, 'all');
    expect(filteredQueue.length).toBe(1);
    expect(filteredQueue[0]?.studentId).toBe(mockStudent1);

    // Reset queue
    await calledQueueService.resetQueue(session.id);
    queue = await calledQueueService.getCalledQueue(session.id, parts, sMap);
    expect(queue.length).toBe(0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LiveClassroomPresentPage } from './LiveClassroomPresentPage';
import { liveBroadcastService } from '../../core/services/live-classroom/live-broadcast';
import { db } from '../../core/database/db';

describe('LiveClassroomPresentPage Broadcast & Presentation (CHANGE-RANK-001)', () => {
  beforeEach(async () => {
    await db.liveClassSessions.clear();
    await db.classes.clear();
    await db.liveClassParticipants.clear();
    await db.liveClassGroups.clear();

    await db.classes.add({
      id: 'class-1',
      academicYearId: 'year-1',
      name: '1A1',
      grade: 1,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.liveClassSessions.add({
      id: 'session-1',
      classId: 'class-1',
      title: 'Tiết 1: Toán',
      subject: 'Toán',
      sessionDate: '2026-08-17',
      meetingPlatform: 'none',
      totalPausedMilliseconds: 0,
      status: 'active',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('1. Renders point award banner when POINT_AWARDED message is received', async () => {
    render(
      <MemoryRouter initialEntries={['/live-classroom/session-1/present']}>
        <Routes>
          <Route path="/live-classroom/:sessionId/present" element={<LiveClassroomPresentPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial state: Title and Class
    expect(await screen.findByText('Tiết 1: Toán')).toBeInTheDocument();
    expect(screen.getByText('Lớp 1A1')).toBeInTheDocument();

    // Trigger POINT_AWARDED message
    act(() => {
      liveBroadcastService.postMessage({
        type: 'POINT_AWARDED',
        payload: {
          studentName: 'Trần Bảo An',
          points: 2,
          reason: 'Phát biểu bài xuất sắc',
        },
      });
    });

    // Expect celebration banner to be visible
    expect(await screen.findByText(/Khen thưởng: Trần Bảo An/i)).toBeInTheDocument();
    expect(screen.getByText('+2 Điểm thi đua • Phát biểu bài xuất sắc')).toBeInTheDocument();
  });

  it('2. Renders student selection callout when STUDENT_SELECTED message is received', async () => {
    render(
      <MemoryRouter initialEntries={['/live-classroom/session-1/present']}>
        <Routes>
          <Route path="/live-classroom/:sessionId/present" element={<LiveClassroomPresentPage />} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      liveBroadcastService.postMessage({
        type: 'STUDENT_SELECTED',
        payload: {
          student: {
            id: 'st-1',
            fullName: 'Lê Hoàng Long',
            normalizedName: 'le hoang long',
            studentCode: 'HS101',
            gender: 'Nam',
            dateOfBirth: '2015-01-01',
            createdAt: '',
            updatedAt: '',
          },
          participant: {
            id: 'p-1',
            sessionId: 'session-1',
            studentId: 'st-1',
            attendanceStatus: 'present',
            participationCount: 0,
            randomSelectionCount: 1,
            handRaised: false,
            joinedAt: '',
            createdAt: '',
            updatedAt: '',
          },
        },
      });
    });

    expect(await screen.findByText('Học sinh được chọn phát biểu')).toBeInTheDocument();
    expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
  });

  it('3. Renders break screen timer when BREAK_SCREEN_STATE is active', async () => {
    render(
      <MemoryRouter initialEntries={['/live-classroom/session-1/present']}>
        <Routes>
          <Route path="/live-classroom/:sessionId/present" element={<LiveClassroomPresentPage />} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      liveBroadcastService.postMessage({
        type: 'BREAK_SCREEN_STATE',
        payload: {
          active: true,
          remainingSeconds: 300,
          message: 'Giải lao giữa giờ 5 phút',
        },
      });
    });

    expect(await screen.findByText('Giải lao giữa giờ 5 phút')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('4. Renders full-screen LevelUpCelebrationModal when LEVEL_UP_SHOW is received', async () => {
    render(
      <MemoryRouter initialEntries={['/live-classroom/session-1/present']}>
        <Routes>
          <Route path="/live-classroom/:sessionId/present" element={<LiveClassroomPresentPage />} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      liveBroadcastService.postMessage({
        type: 'LEVEL_UP_SHOW',
        payload: {
          protocolVersion: 2,
          commandId: 'cmd-test-1',
          eventId: 'evt-test-1',
          classId: 'class-1',
          liveSessionId: 'session-1',
          studentId: 'st-1',
          studentName: 'Vũ Quốc Bảo',
          studentCode: 'HS105',
          fromLevel: {
            levelId: 1,
            levelName: 'Khởi đầu',
            levelShortLabel: 'Cấp 1',
            cardBaseColor: '#64748b',
          },
          toLevel: {
            levelId: 2,
            levelName: 'Tiến bộ',
            levelShortLabel: 'Cấp 2',
            cardBaseColor: '#3b82f6',
          },
          levelsGained: 1,
          currentScore: 115,
          soundEnabled: false,
          confettiEnabled: false,
        },
      });
    });

    expect(await screen.findByText('Vũ Quốc Bảo')).toBeInTheDocument();
    expect(screen.getAllByText(/Tiến bộ/i).length).toBeGreaterThan(0);
    expect(screen.getByText('đã đạt cấp mới')).toBeInTheDocument();
    expect(screen.getByText('Cấp 2')).toBeInTheDocument();
    expect(screen.getAllByText(/Chúc mừng/i).length).toBeGreaterThan(0);
  });
});

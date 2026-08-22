import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassMascot } from './ClassMascot';
import { ClassHero } from './ClassHero';
import { JourneyProgressBar } from './JourneyProgressBar';
import { TodayMissionsPanel } from './TodayMissionsPanel';
import { ClassroomToolkitGrid } from './ClassroomToolkitGrid';
import { StudentSpotlightCarousel, type SpotlightStudent } from './StudentSpotlightCarousel';
import { ClassAchievementsCard } from './ClassAchievementsCard';
import type { LiveClassSession, ClassRoom, Student } from '../../../core/database/types';

describe('Classroom Adventure Hub Component Suite', () => {
  it('1. ClassMascot renders with speech bubble and reacts to state changes', () => {
    const { rerender } = render(
      <ClassMascot state="ready" showSpeechBubble={true} message="Chào mừng các bạn!" />
    );

    expect(screen.getByText('Chào mừng các bạn!')).toBeInTheDocument();

    rerender(<ClassMascot state="point_awarded" showSpeechBubble={true} message="Tuyệt vời quá!" />);
    expect(screen.getByText('Tuyệt vời quá!')).toBeInTheDocument();
  });

  it('2. ClassHero renders empty state when activeSession is null', () => {
    const handleStart = vi.fn();
    render(
      <ClassHero
        activeSession={null}
        activeClass={null}
        onStartNewSession={handleStart}
        onContinueSession={vi.fn()}
        onPresentSession={vi.fn()}
        onCompleteSession={vi.fn()}
      />
    );

    expect(screen.getByText('Sẵn Sàng Cho Tiết Học Mới?')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Tạo Phiên Học Mới/i });
    fireEvent.click(btn);
    expect(handleStart).toHaveBeenCalled();
  });

  it('3. ClassHero renders active session information and CTA', () => {
    const handleContinue = vi.fn();
    const handlePresent = vi.fn();
    const mockSession: LiveClassSession = {
      id: 'sess-100',
      classId: 'cls-1',
      title: 'Bài 11: Khám Phá Thế Giới Toán Học',
      subject: 'Toán học',
      sessionDate: '2026-08-20',
      meetingPlatform: 'meet',
      totalPausedMilliseconds: 0,
      status: 'active',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockClass: ClassRoom = {
      id: 'cls-1',
      academicYearId: 'year-1',
      name: '1A1',
      grade: 1,
      status: 'Active',
      createdAt: '',
      updatedAt: '',
    };

    render(
      <ClassHero
        activeSession={mockSession}
        activeClass={mockClass}
        participantCount={46}
        onStartNewSession={vi.fn()}
        onContinueSession={handleContinue}
        onPresentSession={handlePresent}
        onCompleteSession={vi.fn()}
      />
    );

    expect(screen.getByText('Bài 11: Khám Phá Thế Giới Toán Học')).toBeInTheDocument();
    expect(screen.getByText('Lớp 1A1')).toBeInTheDocument();
    expect(screen.getByText('46 học sinh')).toBeInTheDocument();

    const continueBtn = screen.getByText('VÀO LỚP NGAY');
    fireEvent.click(continueBtn);
    expect(handleContinue).toHaveBeenCalledWith('sess-100');

    const presentBtn = screen.getByText('Màn hình lớp');
    fireEvent.click(presentBtn);
    expect(handlePresent).toHaveBeenCalledWith('sess-100');
  });

  it('4. JourneyProgressBar renders 5 steps with active step', () => {
    const handleStepClick = vi.fn();
    render(<JourneyProgressBar currentStepId="challenge" onStepClick={handleStepClick} />);

    expect(screen.getByText('Khởi Động')).toBeInTheDocument();
    expect(screen.getByText('Điểm Danh')).toBeInTheDocument();
    expect(screen.getByText('Thử Thách')).toBeInTheDocument();
    expect(screen.getByText('Tương Tác')).toBeInTheDocument();
    expect(screen.getByText('Vinh Danh')).toBeInTheDocument();
    expect(screen.getByText('Chặng 3 / 5')).toBeInTheDocument();
  });

  it('5. TodayMissionsPanel allows toggling missions and shows progress', () => {
    render(<TodayMissionsPanel />);

    expect(screen.getByText('Nhiệm Vụ Tiết Học')).toBeInTheDocument();
    expect(screen.getByText('BẤT NGỜ HÔM NAY')).toBeInTheDocument();

    const missionItem = screen.getByText('Thử thách Toán học: Giải bài tập nhóm');
    fireEvent.click(missionItem);

    expect(screen.getAllByText('Xong ✓').length).toBeGreaterThan(0);
  });

  it('6. ClassroomToolkitGrid renders 8 bento tool tiles and triggers clicks', () => {
    const handleToolSelect = vi.fn();
    render(<ClassroomToolkitGrid onSelectTool={handleToolSelect} handRaisedCount={3} />);

    expect(screen.getByText('Bộ Công Cụ Lớp Học (Interactive Toolkit)')).toBeInTheDocument();
    expect(screen.getByText('Gọi Tên Ngẫu Nhiên')).toBeInTheDocument();
    expect(screen.getByText('Bình Chọn Nhanh')).toBeInTheDocument();
    expect(screen.getByText('Giơ Tay Phát Biểu')).toBeInTheDocument();
    expect(screen.getByText('+3 em')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Gọi Tên Ngẫu Nhiên'));
    expect(handleToolSelect).toHaveBeenCalledWith('random_picker');
  });

  it('7. StudentSpotlightCarousel renders standout students and triggers quick points', () => {
    const handleAward = vi.fn();
    const mockStudent: Student = {
      id: 'st-1',
      fullName: 'Dương Thảo Ly',
      normalizedName: 'duong thao ly',
      studentCode: 'HS001',
      gender: 'Nữ',
      dateOfBirth: '2015-05-10',
      createdAt: '',
      updatedAt: '',
    };
    const mockSpotlight: SpotlightStudent[] = [
      {
        student: mockStudent,
        streakDays: 5,
        bonusPoints: 12,
        levelNumber: 3,
      },
    ];

    render(
      <StudentSpotlightCarousel
        students={mockSpotlight}
        onAwardQuickPoint={handleAward}
        onStudentClick={vi.fn()}
      />
    );

    expect(screen.getByText('Lớp Mình Hôm Nay (Student Spotlight)')).toBeInTheDocument();
    expect(screen.getByText('Dương Thảo Ly')).toBeInTheDocument();
    expect(screen.getByText('Chuỗi 5 ngày')).toBeInTheDocument();
    expect(screen.getByText('Lv.3')).toBeInTheDocument();

    const plus2Btn = screen.getByTitle('Cộng 2 điểm');
    fireEvent.click(plus2Btn);
    expect(handleAward).toHaveBeenCalledWith('st-1', 2);
  });

  it('8. ClassAchievementsCard renders team streak and points', () => {
    render(<ClassAchievementsCard streakDays={4} totalPositivePoints={126} honoredCount={3} />);

    expect(screen.getByText('Thành Tích Lớp Mình (Team Glory)')).toBeInTheDocument();
    expect(screen.getByText('4 ngày')).toBeInTheDocument();
    expect(screen.getByText('126')).toBeInTheDocument();
    expect(screen.getByText('3 bạn')).toBeInTheDocument();
  });
});

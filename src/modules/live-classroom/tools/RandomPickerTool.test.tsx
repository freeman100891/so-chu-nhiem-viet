import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RandomPickerTool } from './RandomPickerTool';
import type { LiveClassParticipant, Student } from '../../../core/database/types';

describe('RandomPickerTool (Random Spotlight) Component Tests', () => {
  const sampleStudents: Student[] = [
    {
      id: 'st-1',
      fullName: 'Ngô Bảo Long',
      normalizedName: 'ngo bao long',
      studentCode: 'HS01',
      gender: 'Nam',
      dateOfBirth: '2015-05-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-2',
      fullName: 'Lê Thùy Dung',
      normalizedName: 'le thuy dung',
      studentCode: 'HS02',
      gender: 'Nữ',
      dateOfBirth: '2015-08-12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleParticipants: LiveClassParticipant[] = [
    {
      id: 'part-1',
      sessionId: 'sess-1',
      studentId: 'st-1',
      attendanceStatus: 'present',
      participationCount: 2,
      randomSelectionCount: 0,
      handRaised: false,
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'part-2',
      sessionId: 'sess-1',
      studentId: 'st-2',
      attendanceStatus: 'present',
      participationCount: 1,
      randomSelectionCount: 0,
      handRaised: false,
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const studentMap = new Map<string, Student>();
  sampleStudents.forEach((s) => studentMap.set(s.id, s));

  it('1. Renders idle prompt, speed mode selectors, and spin CTA button', () => {
    render(
      <RandomPickerTool
        isEmbedded={true}
        sessionId="sess-1"
        participants={sampleParticipants}
        studentMap={studentMap}
        onParticipantsUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('AI SẼ LÀ NGƯỜI TIẾP THEO?')).toBeInTheDocument();
    expect(screen.getByText(/học sinh đang sẵn sàng trong vòng gọi/)).toBeInTheDocument();
    expect(screen.getByText('Nhanh')).toBeInTheDocument();
    expect(screen.getByText('Thường')).toBeInTheDocument();
    expect(screen.getByText('Kịch tính')).toBeInTheDocument();

    const spinBtn = screen.getByText(/BẮT ĐẦU QUAY NGẪU NHIÊN/i);
    expect(spinBtn).toBeInTheDocument();
  });

  it('2. Switches speed modes when buttons are clicked', () => {
    render(
      <RandomPickerTool
        isEmbedded={true}
        sessionId="sess-1"
        participants={sampleParticipants}
        studentMap={studentMap}
        onParticipantsUpdated={vi.fn()}
      />
    );

    const quickBtn = screen.getByText('Nhanh');
    fireEvent.click(quickBtn);
    expect(localStorage.getItem('gvcn_random_speed_mode')).toBe('quick');

    const dramaticBtn = screen.getByText('Kịch tính');
    fireEvent.click(dramaticBtn);
    expect(localStorage.getItem('gvcn_random_speed_mode')).toBe('dramatic');
  });

  it('3. Triggers spin animation and reveals student spotlight with action dock', async () => {
    const onAwardPointMock = vi.fn();
    const onIncrementTalkMock = vi.fn();

    render(
      <RandomPickerTool
        isEmbedded={true}
        sessionId="sess-1"
        participants={sampleParticipants}
        studentMap={studentMap}
        onParticipantsUpdated={vi.fn()}
        onAwardPoint={onAwardPointMock}
        onIncrementTalk={onIncrementTalkMock}
      />
    );

    // Switch to quick mode for fast test execution
    fireEvent.click(screen.getByText('Nhanh'));

    const spinBtn = screen.getByText(/BẮT ĐẦU QUAY NGẪU NHIÊN/i);
    fireEvent.click(spinBtn);

    // Wait for reveal & spotlight
    await waitFor(
      () => {
        expect(screen.getByText('HÔM NAY ĐẾN LƯỢT BẠN!')).toBeInTheDocument();
      },
      { timeout: 3500 }
    );

    // Action Dock should be visible
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('GỌI BẠN TIẾP THEO (Phím R)')).toBeInTheDocument();

    // Click +1
    const plus1Btn = screen.getByTitle('Cộng nhanh +1 điểm');
    fireEvent.click(plus1Btn);
    expect(onAwardPointMock).toHaveBeenCalledWith(expect.any(String), 1, expect.any(String));
  });
});

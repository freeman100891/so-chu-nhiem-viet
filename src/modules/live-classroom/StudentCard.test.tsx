import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentCard } from './StudentCard';
import type { LiveClassParticipant, Student } from '../../core/database/types';

describe('StudentCard Component & Neutral Styling (CHANGE-RANK-001)', () => {
  const sampleStudent: Student = {
    id: 'st-card-1',
    fullName: 'Lê Hoàng Long',
    normalizedName: 'le hoang long',
    studentCode: 'HS01',
    gender: 'Nam',
    dateOfBirth: '2015-05-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleParticipant: LiveClassParticipant = {
    id: 'part-1',
    sessionId: 'sess-1',
    studentId: 'st-card-1',
    attendanceStatus: 'present',
    participationCount: 4,
    randomSelectionCount: 1,
    handRaised: false,
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('1. Renders student name, roll number, student code, points and spoke count', () => {
    render(
      <StudentCard
        participant={sampleParticipant}
        student={sampleStudent}
        rollNumber={1}
        points={15}
        globalActiveThemeId="military"
        isSelected={false}
        isChecked={false}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={vi.fn()}
        onQuickAward={vi.fn()}
        onIncrementTalk={vi.fn()}
        onOpenDeduct={vi.fn()}
        onOpenCustomPoint={vi.fn()}
      />
    );

    expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
    expect(screen.getByText(/STT: 1/)).toBeInTheDocument();
    expect(screen.getByText(/HS01/)).toBeInTheDocument();
    expect(screen.getByText('+15 đ')).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();

    const container = screen.getByTestId('student-card-st-card-1');
    expect(container).toBeInTheDocument();
  });

  it('2. Handles multi-select checkbox click and hand raised badge', () => {
    const onToggleCheck = vi.fn();

    render(
      <StudentCard
        participant={{ ...sampleParticipant, handRaised: true }}
        student={sampleStudent}
        isSelected={false}
        isChecked={true}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={onToggleCheck}
        onQuickAward={vi.fn()}
        onIncrementTalk={vi.fn()}
        onOpenDeduct={vi.fn()}
        onOpenCustomPoint={vi.fn()}
      />
    );

    expect(screen.getByText('Giơ tay')).toBeInTheDocument();

    const checkBtn = screen.getByRole('button', { name: /Chọn học sinh Lê Hoàng Long/i });
    fireEvent.click(checkBtn);
    expect(onToggleCheck).toHaveBeenCalledWith('st-card-1');
  });

  it('3. Handles quick point award button clicks (+1, +2, +5, -)', () => {
    const onQuickAward = vi.fn();
    const onIncrementTalk = vi.fn();
    const onOpenDeduct = vi.fn();
    const onOpenCustomPoint = vi.fn();

    render(
      <StudentCard
        participant={sampleParticipant}
        student={sampleStudent}
        isSelected={false}
        isChecked={false}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={vi.fn()}
        onQuickAward={onQuickAward}
        onIncrementTalk={onIncrementTalk}
        onOpenDeduct={onOpenDeduct}
        onOpenCustomPoint={onOpenCustomPoint}
      />
    );

    // Click +1
    const plus1Btn = screen.getByTitle('Thưởng nhanh +1 điểm');
    fireEvent.click(plus1Btn);
    expect(onQuickAward).toHaveBeenCalledWith('st-card-1', 1, expect.any(String));

    // Click +2
    const plus2Btn = screen.getByTitle('Thưởng nhanh +2 điểm');
    fireEvent.click(plus2Btn);
    expect(onQuickAward).toHaveBeenCalledWith('st-card-1', 2, expect.any(String));

    // Click +5
    const plus5Btn = screen.getByTitle('Thưởng nhanh +5 điểm');
    fireEvent.click(plus5Btn);
    expect(onQuickAward).toHaveBeenCalledWith('st-card-1', 5, expect.any(String));

    // Click -
    const deductBtn = screen.getByTitle('Trừ điểm nề nếp (-1 / -2 / -5)');
    fireEvent.click(deductBtn);
    expect(onOpenDeduct).toHaveBeenCalledWith('st-card-1');

    // Click more
    const moreBtn = screen.getByTitle('Tùy chỉnh điểm & lý do khác');
    fireEvent.click(moreBtn);
    expect(onOpenCustomPoint).toHaveBeenCalledWith('st-card-1');
  });

  it('4. Renders floating animation badge overlay when provided', () => {
    render(
      <StudentCard
        participant={sampleParticipant}
        student={sampleStudent}
        floatingBadge={{ text: '+2đ', id: 'badge-1', type: 'point' }}
        isSelected={false}
        isChecked={false}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={vi.fn()}
        onQuickAward={vi.fn()}
        onIncrementTalk={vi.fn()}
        onOpenDeduct={vi.fn()}
        onOpenCustomPoint={vi.fn()}
      />
    );

    expect(screen.getByText('+2đ')).toBeInTheDocument();
  });

  it('5. Renders 5-level presentation with level short label and custom card theme', () => {
    render(
      <StudentCard
        participant={sampleParticipant}
        student={sampleStudent}
        presentation={{
          studentId: 'st-card-1',
          level: 4,
          levelName: 'Xuất sắc',
          levelShortLabel: 'Cấp 4',
          levelDescription: 'Kỷ luật xuất sắc',
          minPoints: 600,
          avatarAsset: {
            assetKey: 'military/military-stage-4',
            assetUrl: '/mock-stage-4.svg',
            altText: 'Avatar Cấp 4',
            isUploaded: false,
            isFallback: false,
          },
          cardTheme: {
            key: 'avatar-level-4',
            baseColor: '#7C3AED',
            surfaceStart: '#F5F3FF',
            surfaceEnd: '#EDE9FE',
            border: '#DDD6FE',
            accent: '#7C3AED',
            textPrimary: '#0F172A',
            textSecondary: '#475569',
            badgeBackground: '#EDE9FE',
            badgeText: '#5B21B6',
            badgeBorder: '#C4B5FD',
            avatarRing: '#8B5CF6',
            focusRing: '#7C3AED',
            shadow: 'rgba(124, 58, 237, 0.08)',
            isDark: false,
            contrastRatio: 14.5,
            contrastPassed: true,
          },
        }}
        isSelected={false}
        isChecked={false}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={vi.fn()}
        onQuickAward={vi.fn()}
        onIncrementTalk={vi.fn()}
        onOpenDeduct={vi.fn()}
        onOpenCustomPoint={vi.fn()}
      />
    );

    expect(screen.getByText('Cấp 4')).toBeInTheDocument();
    const container = screen.getByTestId('student-card-st-card-1');
    expect(container.getAttribute('data-avatar-level')).toBe('4');
  });

  it('6. Renders uploaded custom avatar asset when available in presentation', () => {
    render(
      <StudentCard
        participant={sampleParticipant}
        student={sampleStudent}
        presentation={{
          studentId: 'st-card-1',
          level: 2,
          levelName: 'Tập sự',
          levelShortLabel: 'Cấp 2',
          levelDescription: 'Đang tiến bộ',
          minPoints: 100,
          avatarAsset: {
            assetKey: 'uploaded/custom-asset-123',
            assetUrl: 'blob:http://localhost/custom-avatar.webp',
            altText: 'Custom Avatar Cấp 2',
            isUploaded: true,
            isFallback: false,
          },
          cardTheme: {
            key: 'avatar-level-2',
            baseColor: '#2563EB',
            surfaceStart: '#EFF6FF',
            surfaceEnd: '#DBEAFE',
            border: '#BFDBFE',
            accent: '#2563EB',
            textPrimary: '#0F172A',
            textSecondary: '#475569',
            badgeBackground: '#DBEAFE',
            badgeText: '#1E40AF',
            badgeBorder: '#93C5FD',
            avatarRing: '#3B82F6',
            focusRing: '#2563EB',
            shadow: 'rgba(37, 99, 235, 0.08)',
            isDark: false,
            contrastRatio: 14.5,
            contrastPassed: true,
          },
        }}
        isSelected={false}
        isChecked={false}
        isSubmitting={false}
        onSelectCard={vi.fn()}
        onToggleCheck={vi.fn()}
        onQuickAward={vi.fn()}
        onIncrementTalk={vi.fn()}
        onOpenDeduct={vi.fn()}
        onOpenCustomPoint={vi.fn()}
      />
    );

    expect(screen.getByText('Cấp 2')).toBeInTheDocument();
    const img = screen.getByAltText('Custom Avatar Cấp 2') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('custom-avatar.webp');
  });
});

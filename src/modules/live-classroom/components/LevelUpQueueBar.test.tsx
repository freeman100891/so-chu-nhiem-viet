import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpQueueBar } from './LevelUpQueueBar';
import type { LevelUpCelebrationEvent } from '../../../core/database/types';

describe('LevelUpQueueBar Component Tests', () => {
  const dummyEvent: LevelUpCelebrationEvent = {
    id: 'evt-bar-1',
    dedupeKey: 'tx1_st1_2',
    studentId: 'st-1',
    classId: 'class-1',
    liveSessionId: 'session-1',
    sourcePointTransactionId: 'tx-1',
    previousScore: 90,
    currentScore: 110,
    fromLevelId: 1,
    toLevelId: 2,
    levelsGained: 1,
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
    settingsRevision: 1,
    status: 'PENDING',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
  };

  it('1. Should render null when no pending events', () => {
    const { container } = render(
      <LevelUpQueueBar
        pendingEvents={[]}
        currentEvent={null}
        isBroadcasting={false}
        onShowEvent={vi.fn()}
        onSkipEvent={vi.fn()}
        onSkipAll={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('2. Should render pending count, level names and action buttons', () => {
    const handleShow = vi.fn();
    const handleSkip = vi.fn();

    render(
      <LevelUpQueueBar
        pendingEvents={[dummyEvent]}
        currentEvent={dummyEvent}
        isBroadcasting={false}
        onShowEvent={handleShow}
        onSkipEvent={handleSkip}
        onSkipAll={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText('1 Thăng cấp')).toBeDefined();
    expect(screen.getAllByText(/Tiến bộ/i).length).toBeGreaterThan(0);
    expect(screen.getByText('+1 cấp')).toBeDefined();

    const showBtn = screen.getByRole('button', { name: /Trình chiếu chúc mừng/i });
    fireEvent.click(showBtn);
    expect(handleShow).toHaveBeenCalledWith(dummyEvent);

    const skipBtn = screen.getByRole('button', { name: /Bỏ qua/i });
    fireEvent.click(skipBtn);
    expect(handleSkip).toHaveBeenCalledWith(dummyEvent);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromotionQueueBar } from './PromotionQueueBar';
import type { RankPromotionEvent } from '../../../core/database/types';

describe('PromotionQueueBar Component (FEAT-RANK-001)', () => {
  const sampleEvent: RankPromotionEvent = {
    id: 'evt-1',
    classId: 'class-1',
    studentId: 'st-1',
    fromLevel: 1,
    toLevel: 2,
    fromRankName: 'Binh nhì',
    toRankName: 'Binh nhất',
    levelsGained: 1,
    pointsBefore: 30,
    pointsAfter: 30,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('1. Returns null when pendingEvents is empty', () => {
    const { container } = render(
      <PromotionQueueBar
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

  it('2. Renders pending count, student rank info, and action buttons', () => {
    const onShow = vi.fn();
    const onSkip = vi.fn();
    const onSettings = vi.fn();

    render(
      <PromotionQueueBar
        pendingEvents={[sampleEvent]}
        currentEvent={sampleEvent}
        isBroadcasting={false}
        onShowEvent={onShow}
        onSkipEvent={onSkip}
        onSkipAll={vi.fn()}
        onOpenSettings={onSettings}
      />
    );

    expect(screen.getByText(/1 Thăng hạng/i)).toBeInTheDocument();
    expect(screen.getByText('+1 cấp')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trình chiếu chúc mừng/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bỏ qua/i })).toBeInTheDocument();

    // Click Show
    fireEvent.click(screen.getByRole('button', { name: /Trình chiếu chúc mừng/i }));
    expect(onShow).toHaveBeenCalledWith(sampleEvent);

    // Click Skip
    fireEvent.click(screen.getByRole('button', { name: /Bỏ qua/i }));
    expect(onSkip).toHaveBeenCalledWith(sampleEvent);

    // Click Settings
    fireEvent.click(screen.getByTitle(/Cấu hình chế độ chúc mừng/i));
    expect(onSettings).toHaveBeenCalled();
  });

  it('3. Renders "Bỏ qua tất cả" when 2 or more pending events', () => {
    const onSkipAll = vi.fn();
    render(
      <PromotionQueueBar
        pendingEvents={[sampleEvent, { ...sampleEvent, id: 'evt-2' }]}
        currentEvent={sampleEvent}
        isBroadcasting={false}
        onShowEvent={vi.fn()}
        onSkipEvent={vi.fn()}
        onSkipAll={onSkipAll}
        onOpenSettings={vi.fn()}
      />
    );

    const skipAllBtn = screen.getByText(/Bỏ qua tất cả \(2\)/i);
    expect(skipAllBtn).toBeInTheDocument();
    fireEvent.click(skipAllBtn);
    expect(onSkipAll).toHaveBeenCalled();
  });
});

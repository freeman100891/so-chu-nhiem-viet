import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromotionCelebrationSettingsModal } from './PromotionCelebrationSettingsModal';
import type { PromotionCelebrationSettings } from '../hooks/usePromotionQueue';

describe('PromotionCelebrationSettingsModal Component (FEAT-RANK-001)', () => {
  const initialSettings: PromotionCelebrationSettings = {
    mode: 'MANUAL',
    soundEnabled: false,
    showPoints: false,
    showPreviousRank: true,
    confettiEnabled: true,
    durationMs: 4500,
  };

  it('1. Renders mode options, sound toggle, confetti toggle, and duration', () => {
    render(
      <PromotionCelebrationSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={initialSettings}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/Cấu Hình Chúc Mừng Thăng Hạng/i)).toBeInTheDocument();
    expect(screen.getByText(/Thủ công \(Khuyên dùng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tự động phát/i)).toBeInTheDocument();
    expect(screen.getByText(/Tắt chúc mừng/i)).toBeInTheDocument();
    expect(screen.getByText(/Âm thanh chúc mừng \(Fanfare\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Hiệu ứng pháo giấy \(Confetti\)/i)).toBeInTheDocument();
    expect(screen.getByText(/4.5 giây/i)).toBeInTheDocument();
  });

  it('2. Submits updated settings when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <PromotionCelebrationSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={initialSettings}
        onSave={onSave}
      />
    );

    // Switch to Automatic mode
    fireEvent.click(screen.getByText(/Tự động phát/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'AUTOMATIC',
      })
    );
  });

  it('3. Triggers onPreviewDemo when preview button is clicked', () => {
    const onPreview = vi.fn();
    render(
      <PromotionCelebrationSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={initialSettings}
        onSave={vi.fn()}
        onPreviewDemo={onPreview}
      />
    );

    const previewBtn = screen.getByRole('button', { name: /Xem trước Demo/i });
    expect(previewBtn).toBeInTheDocument();
    fireEvent.click(previewBtn);
    expect(onPreview).toHaveBeenCalled();
  });
});

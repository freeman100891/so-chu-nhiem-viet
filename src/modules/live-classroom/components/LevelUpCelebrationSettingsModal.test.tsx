import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpCelebrationSettingsModal } from './LevelUpCelebrationSettingsModal';
import { DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS } from '../../../core/types/avatar-theme.types';

describe('LevelUpCelebrationSettingsModal Component Tests', () => {
  it('1. Should render settings form and call onSave with updated values', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <LevelUpCelebrationSettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Cấu Hình Thông Báo Thay Đổi Cấp Bậc Avatar 5 Cấp')).toBeDefined();

    // Click intensity button 'Tối giản (Nhẹ máy)'
    const minimalBtn = screen.getByText(/Tối giản \(Nhẹ máy\)/i);
    fireEvent.click(minimalBtn);

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Lưu cấu hình/i });
    fireEvent.submit(saveBtn.closest('form')!);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        intensity: 'MINIMAL',
        enabled: true,
      })
    );
  });
});

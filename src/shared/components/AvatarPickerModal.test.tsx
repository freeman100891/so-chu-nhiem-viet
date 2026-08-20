import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarPickerModal } from './AvatarPickerModal';

describe('AvatarPickerModal Component Tests (FEAT-STUD-005)', () => {
  it('1. Renders Progressive Themes tab by default with theme options and 5-stage timeline', () => {
    render(
      <AvatarPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectAvatar={vi.fn()}
        studentName="Nguyễn Văn An"
        rankLevelOrOrder={6} // Level 2
      />
    );

    expect(screen.getByText(/Chọn avatar cho học sinh/i)).toBeInTheDocument();
    expect(screen.getByText(/Chủ đề Tiến trình \(5 Cấp\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Quân đội Thi đua/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Phát triển của Cây/i)).toBeInTheDocument();
    expect(screen.getByText(/Hành trình Vương triều/i)).toBeInTheDocument();
    expect(screen.getByText(/Cấp bậc Game thủ/i)).toBeInTheDocument();

    // 5-stage timeline
    expect(screen.getByText(/Tiến trình 5 Cấp của/i)).toBeInTheDocument();
    expect(screen.getAllByText('Cấp 2/5')[0]).toBeInTheDocument();
  });

  it('2. Switches between theme cards and updates 5-stage timeline', () => {
    render(
      <AvatarPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectAvatar={vi.fn()}
        studentName="Lê Hoàng Long"
        rankLevelOrOrder={9} // Level 3
      />
    );

    // Click Plant Growth theme card
    const plantThemeCard = screen.getByText('Phát triển của Cây');
    fireEvent.click(plantThemeCard);

    expect(screen.getByText(/Tiến trình 5 Cấp của Phát triển của Cây/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cây nhỏ/i)[0]).toBeInTheDocument();
  });

  it('3. Calls onSelectTheme when user saves chosen progressive theme', async () => {
    const handleSelectTheme = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AvatarPickerModal
        isOpen={true}
        onClose={handleClose}
        onSelectTheme={handleSelectTheme}
        studentName="Nguyễn Văn An"
        rankLevelOrOrder={5} // Level 2
      />
    );

    // Select Gamer Rank theme
    const gamerThemeCard = screen.getByText('Cấp bậc Game thủ');
    fireEvent.click(gamerThemeCard);

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Lưu Avatar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSelectTheme).toHaveBeenCalledWith('gamer_rank', null);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('4. Switches to Legacy Gallery tab and searches 31 static icons', async () => {
    const handleSelectTheme = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AvatarPickerModal
        isOpen={true}
        onClose={handleClose}
        onSelectTheme={handleSelectTheme}
        studentName="Nguyễn Văn An"
      />
    );

    // Switch to Legacy Gallery tab
    const legacyTabBtn = screen.getByText(/Bộ sưu tập Tĩnh/i);
    fireEvent.click(legacyTabBtn);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm icon/i);
    fireEvent.change(searchInput, { target: { value: 'Panda' } });

    // Panda avatar button should appear
    const pandaBtn = screen.getByTitle('Gấu trúc Panda');
    expect(pandaBtn).toBeInTheDocument();
    fireEvent.click(pandaBtn);

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Lưu Avatar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSelectTheme).toHaveBeenCalledWith(null, 'animals/animal-panda');
      expect(handleClose).toHaveBeenCalled();
    });
  });
});

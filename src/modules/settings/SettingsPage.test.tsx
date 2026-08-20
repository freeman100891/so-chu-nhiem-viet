import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import { avatarAssetService } from '../../core/services/avatar-asset.service';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../core/services/avatar-theme-registry';

describe('SettingsPage 5-Level Avatar & Asset Reuse Tests (FEAT-AVATAR-004)', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.teacherProfiles.clear();
    await db.avatarAssets.clear();
    avatarAssetService.clearCache();

    await db.settings.put({
      id: 'default',
      theme: 'traditional',
      activeAcademicYearId: 'year-1',
      activeClassId: 'class-1',
      sidebarCollapsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarSystemSettings: {
        ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
        levels: [
          DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels[0]!,
          {
            ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels[1]!,
            image: { kind: 'UPLOADED', assetId: 'test-custom-asset-1' },
          },
          DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels[2]!,
          DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels[3]!,
          DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels[4]!,
        ],
        savedCustomImagesByLevel: {
          2: { kind: 'UPLOADED', assetId: 'test-custom-asset-1' },
        },
      },
      avatarSettingsRevision: 1,
    });

    await db.avatarAssets.put({
      id: 'test-custom-asset-1',
      blob: new Blob(['fake image data'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 320,
      height: 320,
      sizeBytes: 16500,
      targetLevel: 2,
      originalFileName: 'chien_si_custom.webp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('1. Renders SettingsPage with 5-Level Avatar Editor and Theme Presets', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hệ Thống 5 Cấp Độ Avatar Toàn Trường')).toBeDefined();
    });

    expect(screen.getByText('Quân đội Thi đua')).toBeDefined();
    expect(screen.getByText('Phát triển của Cây')).toBeDefined();
    expect(screen.getByText('Hành trình Vương triều')).toBeDefined();
    expect(screen.getByText('Kho Ảnh Đã Tải Lên')).toBeDefined();
  });

  it('2. Opens SavedAvatarAssetsModal when clicking Kho Ảnh Đã Tải Lên', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Kho Ảnh Đã Tải Lên')).toBeDefined();
    });

    const openModalBtn = screen.getByText('Kho Ảnh Đã Tải Lên');
    fireEvent.click(openModalBtn);

    await waitFor(() => {
      expect(screen.getByText(/Kho Ảnh Đã Tải Lên Cho Cấp 1/)).toBeDefined();
    });
  });

  it('3. Prompts user with options when changing preset theme while having custom avatars', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    // Switch to Level 2 tab and wait for "Ảnh Tự Tải Lên" badge to confirm settings are loaded from DB
    await waitFor(() => {
      const tienBoTabs = screen.getAllByText('Tiến bộ');
      expect(tienBoTabs.length).toBeGreaterThan(0);
    });

    const level2Tab = screen.getAllByText('Tiến bộ')[0]!;
    fireEvent.click(level2Tab);

    await waitFor(() => {
      expect(screen.getByText('Ảnh Tự Tải Lên')).toBeDefined();
    });

    // Click on "Phát triển của Cây" preset card
    const plantPresetCard = screen.getByTestId('preset-theme-plant_growth');
    fireEvent.click(plantPresetCard);

    // Modal with choice should appear
    await waitFor(() => {
      expect(screen.getByText('Tùy Chọn Khi Nạp Chủ Đề Mới')).toBeDefined();
      expect(screen.getByText(/Giữ lại ảnh avatar đã tải lên/)).toBeDefined();
      expect(screen.getByText(/Dùng toàn bộ ảnh mẫu của chủ đề mới/)).toBeDefined();
    });

    // Choose "Giữ lại ảnh avatar đã tải lên"
    const keepOption = screen.getByText(/Giữ lại ảnh avatar đã tải lên/);
    fireEvent.click(keepOption);

    // Verify Level 2 now has new theme name ("Mầm non") but retains UPLOADED custom image
    await waitFor(() => {
      expect(screen.getByText('Mầm non (Cấp 2)')).toBeDefined();
      expect(screen.getByText('Ảnh Tự Tải Lên')).toBeDefined();
    });
  });

  it('4. Renders Teacher Profile Hero Card with avatar controls and opens preset picker', async () => {
    await db.teacherProfiles.put({
      id: 'teacher-1',
      fullName: 'Cô Nguyễn Thị Mai',
      schoolName: 'Trường Tiểu Học Lê Quý Đôn',
      phone: '0912345678',
      email: 'mai.nguyen@edu.vn',
      avatar: 'data:image/jpeg;base64,sample-avatar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hồ Sơ & Thẻ Avatar Giáo Viên Chủ Nhiệm')).toBeDefined();
      expect(screen.getByText('Cô Nguyễn Thị Mai')).toBeDefined();
      expect(screen.getByText('Trường Tiểu Học Lê Quý Đôn')).toBeDefined();
    });

    // Open preset avatar picker modal
    const choosePresetBtn = screen.getByText('Chọn mẫu có sẵn');
    fireEvent.click(choosePresetBtn);

    await waitFor(() => {
      expect(screen.getByText('Chọn Ảnh Đại Diện Giáo Viên Từ Bộ Sưu Tập')).toBeDefined();
    });
  });

  it('5. Saves teacher profile with updated avatar and triggers update', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hồ Sơ & Thẻ Avatar Giáo Viên Chủ Nhiệm')).toBeDefined();
    });

    const nameInput = screen.getByPlaceholderText('Ví dụ: Nguyễn Thị Mai');
    const schoolInput = screen.getByPlaceholderText('Ví dụ: Trường Tiểu Học Lê Quý Đôn');

    fireEvent.change(nameInput, { target: { value: 'Thầy Trần Văn Bảo' } });
    fireEvent.change(schoolInput, { target: { value: 'Trường Tiểu Học Chu Văn An' } });

    const saveBtn = screen.getByText('Lưu Thay Đổi Hồ Sơ');
    fireEvent.click(saveBtn);

    await waitFor(async () => {
      const saved = await db.teacherProfiles.toCollection().first();
      expect(saved?.fullName).toBe('Thầy Trần Văn Bảo');
      expect(saved?.schoolName).toBe('Trường Tiểu Học Chu Văn An');
    });
  });
});

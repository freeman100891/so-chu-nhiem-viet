import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentsPage } from './StudentsPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../core/services/avatar-theme-registry';
import type { Student, ClassRoom, ClassEnrollment, AcademicYear } from '../../core/database/types';

describe('StudentsPage UI & 5-Level Avatar Integration Tests (FEAT-AVATAR-002)', () => {
  const sampleYear: AcademicYear = {
    id: 'year-2025',
    name: 'Năm học 2025 - 2026',
    startDate: '2025-09-01',
    endDate: '2026-05-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleClass: ClassRoom = {
    id: 'cls-10a1',
    name: '10A1',
    academicYearId: 'year-2025',
    grade: 10,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleStudents: Student[] = [
    {
      id: 'st-1',
      fullName: 'Nguyễn Văn An',
      normalizedName: 'nguyen van an',
      studentCode: 'HS001',
      gender: 'Nam',
      dateOfBirth: '2010-01-15',
      ethnicity: 'Kinh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-2',
      fullName: 'Trần Thị Bích',
      normalizedName: 'tran thi bich',
      studentCode: 'HS002',
      gender: 'Nữ',
      dateOfBirth: '2010-03-20',
      ethnicity: 'Tày',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-3',
      fullName: 'Lê Hoàng Long',
      normalizedName: 'le hoang long',
      studentCode: 'HS003',
      gender: 'Nam',
      dateOfBirth: '2010-07-08',
      ethnicity: 'Kinh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleEnrollments: ClassEnrollment[] = [
    {
      id: 'en-1',
      studentId: 'st-1',
      classId: 'cls-10a1',
      rollNumber: 1,
      joinedAt: '2025-09-01',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'en-2',
      studentId: 'st-2',
      classId: 'cls-10a1',
      rollNumber: 2,
      joinedAt: '2025-09-01',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'en-3',
      studentId: 'st-3',
      classId: 'cls-10a1',
      rollNumber: 3,
      joinedAt: '2025-09-01',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <StudentsPage />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  beforeEach(async () => {
    // Clear relevant IndexedDB tables
    await db.academicYears.clear();
    await db.classes.clear();
    await db.students.clear();
    await db.classEnrollments.clear();
    await db.pointEntries.clear();
    await db.settings.clear();
    await db.avatarAssets.clear();

    // Seed test data
    await db.academicYears.add(sampleYear);
    await db.classes.add(sampleClass);
    await db.students.bulkAdd(sampleStudents);
    await db.classEnrollments.bulkAdd(sampleEnrollments);

    // Seed points for different levels:
    // st-1: 50 points -> Level 1 (Khởi đầu / Cấp 1)
    // st-2: 150 points -> Level 2 (Chiến sĩ / Cấp 2)
    // st-3: 400 points -> Level 3 (Bứt phá / Cấp 3)
    await db.pointEntries.bulkAdd([
      {
        id: 'pe-1',
        studentId: 'st-1',
        classId: 'cls-10a1',
        categoryId: 'cat-1',
        points: 50,
        reason: 'Học tốt',
        occurredAt: '2025-10-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pe-2',
        studentId: 'st-2',
        classId: 'cls-10a1',
        categoryId: 'cat-1',
        points: 150,
        reason: 'Phát biểu hăng hái',
        occurredAt: '2025-10-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pe-3',
        studentId: 'st-3',
        classId: 'cls-10a1',
        categoryId: 'cat-1',
        points: 400,
        reason: 'Thành tích xuất sắc',
        occurredAt: '2025-10-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    await settingsRepository.updateSettings({
      activeAcademicYearId: 'year-2025',
      activeClassId: 'cls-10a1',
      avatarSystemSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
      activeAvatarThemeId: 'military',
      avatarProgressionEnabled: true,
    });
  });

  it('1. Renders StudentsPage with student roster, synchronized 5-level avatars and badges', async () => {
    renderComponent();

    // Verify all 3 student rows render in desktop and mobile views
    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();
    expect(screen.getByTestId('student-row-st-2')).toBeInTheDocument();
    expect(screen.getByTestId('student-row-st-3')).toBeInTheDocument();

    const anElements = await screen.findAllByText('Nguyễn Văn An');
    expect(anElements.length).toBeGreaterThan(0);

    const bichElements = screen.getAllByText('Trần Thị Bích');
    expect(bichElements.length).toBeGreaterThan(0);

    const longElements = screen.getAllByText('Lê Hoàng Long');
    expect(longElements.length).toBeGreaterThan(0);

    // Verify column header 'Điểm cấp bậc'
    expect(screen.getByText('Điểm cấp bậc')).toBeInTheDocument();

    // Verify synchronized level score badges (only showing points)
    expect(screen.getAllByText('50đ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('150đ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('400đ').length).toBeGreaterThan(0);

    // Verify settings navigation shortcut
    expect(screen.getByText('Cấu hình Avatar & Cấp độ')).toBeInTheDocument();
  });

  it('2. Filters students by accent-insensitive search query', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên hoặc mã HS/);
    fireEvent.change(searchInput, { target: { value: 'tran thi' } });

    expect(screen.getAllByText('Trần Thị Bích').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    expect(screen.queryByText('Lê Hoàng Long')).not.toBeInTheDocument();
  });

  it('3. Filters students by derived 5-Level Avatar selector', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();

    // Filter Level 3 only
    const selects = screen.getAllByRole('combobox');
    const levelSelect = selects[1]!; // Class is 0, Level is 1, Sort is 2
    fireEvent.change(levelSelect, { target: { value: '3' } });

    await waitFor(() => {
      expect(screen.getAllByText('Lê Hoàng Long').length).toBeGreaterThan(0);
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
      expect(screen.queryByText('Trần Thị Bích')).not.toBeInTheDocument();
    });
  });

  it('4. Reactively updates student level and presentation when points are added in Dexie', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();
    expect(screen.getAllByText('50đ').length).toBeGreaterThan(0);

    // Add +600 points to st-1 (total 650đ -> Level 4)
    await db.pointEntries.add({
      id: 'pe-add-test',
      studentId: 'st-1',
      classId: 'cls-10a1',
      categoryId: 'cat-1',
      points: 600,
      reason: 'Giải nhất Olympic Toán',
      occurredAt: '2025-10-02',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify event
    window.dispatchEvent(new Event('point_entries_changed'));

    // Reactive update without reload
    await waitFor(() => {
      expect(screen.getAllByText('650đ').length).toBeGreaterThan(0);
    });
  });

  it('5. Opens Add Student Modal and creates new student without per-student theme selector', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Thêm Học Sinh/ });
    fireEvent.click(addBtn);

    expect(screen.getByText('Thêm Học sinh Mới')).toBeInTheDocument();
    expect(screen.queryByText('Chọn quân hàm')).not.toBeInTheDocument();
    expect(screen.queryByText('Chọn theme')).not.toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An');
    fireEvent.change(nameInput, { target: { value: 'Hoàng Minh Quân' } });

    const submitBtn = screen.getByTestId('submit-student-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Hoàng Minh Quân').length).toBeGreaterThan(0);
      // Default 0 points
      expect(screen.getAllByText('0đ').length).toBeGreaterThan(0);
    });
  });

  it('6. Shows floating bulk action bar when students are selected', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();

    // Select row 1 and row 2
    const checkboxes = screen.getAllByRole('checkbox');
    // checkbox[0] is select all header, checkbox[1] is st-1, checkbox[2] is st-2
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    await waitFor(() => {
      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
      expect(screen.getByText('Xóa 2 học sinh')).toBeInTheDocument();
    });
  });

  it('7. Opens bulk delete modal and soft deletes selected students', async () => {
    renderComponent();

    expect(await screen.findByTestId('student-row-st-1')).toBeInTheDocument();

    // Select all using header checkbox
    const headerCheckbox = screen.getAllByRole('checkbox')[0]!;
    fireEvent.click(headerCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
      expect(screen.getByText('Xóa 3 học sinh')).toBeInTheDocument();
    });

    // Click bulk delete button
    const bulkDeleteBtn = screen.getByTestId('bulk-delete-btn');
    fireEvent.click(bulkDeleteBtn);

    // Confirm modal should appear
    await waitFor(() => {
      expect(screen.getByText('Chuyển 3 học sinh vào Thùng rác?')).toBeInTheDocument();
    });

    // Confirm bulk deletion
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận chuyển vào Thùng rác' });
    fireEvent.click(confirmBtn);

    // Verify all 3 students are soft deleted and empty state appears
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy học sinh')).toBeInTheDocument();
    });

    const dbStudents = await db.students.filter((s) => !s.deletedAt).toArray();
    expect(dbStudents.length).toBe(0);
  });
});

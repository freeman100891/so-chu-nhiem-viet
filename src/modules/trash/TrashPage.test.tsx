import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrashPage } from './TrashPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import type { Student, ClassRoom } from '../../core/database/types';

describe('TrashPage UI & Bulk Operations Tests', () => {
  const sampleClass: ClassRoom = {
    id: 'cls-deleted-1',
    name: '10A9',
    academicYearId: 'year-2025',
    grade: 10,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: new Date().toISOString(),
  };

  const sampleStudent1: Student = {
    id: 'st-deleted-1',
    fullName: 'Lê Văn An',
    normalizedName: 'le van an',
    studentCode: 'HS001',
    gender: 'Nam',
    dateOfBirth: '2010-01-15',
    ethnicity: 'Kinh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: new Date().toISOString(),
  };

  const sampleStudent2: Student = {
    id: 'st-deleted-2',
    fullName: 'Hoàng Thị Mai',
    normalizedName: 'hoang thi mai',
    studentCode: 'HS002',
    gender: 'Nữ',
    dateOfBirth: '2010-05-20',
    ethnicity: 'Kinh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: new Date().toISOString(),
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <TrashPage />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  beforeEach(async () => {
    await db.classes.clear();
    await db.students.clear();
    await db.studentNotes.clear();
    await db.auditLogs.clear();

    await db.classes.add(sampleClass);
    await db.students.bulkAdd([sampleStudent1, sampleStudent2]);
  });

  it('1. Renders TrashPage with list of soft-deleted items', async () => {
    renderComponent();

    expect(await screen.findByText('Lớp 10A9')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn An')).toBeInTheDocument();
    expect(screen.getByText('Hoàng Thị Mai')).toBeInTheDocument();
  });

  it('2. Shows floating bulk action bar when items are selected', async () => {
    renderComponent();

    expect(await screen.findByText('Lớp 10A9')).toBeInTheDocument();
    expect(screen.queryByTestId('trash-bulk-action-bar')).not.toBeInTheDocument();

    // Click select-all checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]!); // Header checkbox

    await waitFor(() => {
      expect(screen.getByTestId('trash-bulk-action-bar')).toBeInTheDocument();
      expect(screen.getByText('Khôi phục 3 mục')).toBeInTheDocument();
      expect(screen.getByText('Xóa vĩnh viễn 3 mục')).toBeInTheDocument();
    });
  });

  it('3. Bulk restores selected items', async () => {
    renderComponent();

    expect(await screen.findByText('Lớp 10A9')).toBeInTheDocument();

    // Select all items
    const headerCheckbox = screen.getAllByRole('checkbox')[0]!;
    fireEvent.click(headerCheckbox);

    const restoreBtn = await screen.findByTestId('bulk-restore-btn');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Thùng rác trống')).toBeInTheDocument();
    });

    const activeStudents = await db.students.filter((s) => !s.deletedAt).toArray();
    expect(activeStudents.length).toBe(2);
  });

  it('4. Bulk hard deletes selected items with 2-step confirmation', async () => {
    renderComponent();

    expect(await screen.findByText('Lớp 10A9')).toBeInTheDocument();

    // Select all items
    const headerCheckbox = screen.getAllByRole('checkbox')[0]!;
    fireEvent.click(headerCheckbox);

    const hardDeleteBtn = await screen.findByTestId('bulk-hard-delete-btn');
    fireEvent.click(hardDeleteBtn);

    // Modal appears
    expect(await screen.findByText('Cảnh Báo Xóa Vĩnh Viễn 3 Mục Đã Chọn')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-bulk-hard-delete-btn');
    expect(confirmBtn).toBeDisabled();

    // Type wrong confirmation
    const input = screen.getByTestId('bulk-delete-confirm-input');
    fireEvent.change(input, { target: { value: 'XOA' } });
    expect(confirmBtn).toBeDisabled();

    // Type correct confirmation
    fireEvent.change(input, { target: { value: 'XÓA VĨNH VIỄN' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Thùng rác trống')).toBeInTheDocument();
    });

    expect(await db.students.count()).toBe(0);
    expect(await db.classes.count()).toBe(0);
  });
});

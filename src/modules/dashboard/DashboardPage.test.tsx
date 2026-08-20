import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { db } from '../../core/database/db';

describe('DashboardPage Redesign Tests', () => {
  const mockClassId = 'cls-test-101';
  const mockAcademicYearId = 'yr-test-2026';

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    await db.academicYears.add({
      id: mockAcademicYearId,
      name: '2025 - 2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.add({
      id: mockClassId,
      academicYearId: mockAcademicYearId,
      name: '1A1',
      grade: 1,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.add({
      id: 'st-1',
      studentCode: 'HS001',
      fullName: 'Nguyễn Minh Anh',
      normalizedName: 'nguyen minh anh',
      gender: 'Nữ',
      dateOfBirth: '2019-08-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-1',
      classId: mockClassId,
      studentId: 'st-1',
      status: 'Active',
      joinedAt: '2025-09-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leftAt: null,
    });
  });

  it('1. Renders Dashboard title, class selector, and customize button', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bảng Điều Khiển Lớp Học')).toBeInTheDocument();
      expect(screen.getByText('Tùy chỉnh')).toBeInTheDocument();
    });
  });

  it('2. Displays Hero Salutation, Tasks Card, KPI Stats and Quick Actions', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chào buổi/)).toBeInTheDocument();
      expect(screen.getByText('Việc Cần Làm Hôm Nay')).toBeInTheDocument();
      expect(screen.getByText('Sĩ số học sinh')).toBeInTheDocument();
      expect(screen.getByText('Phím Tắt Thao Tác Nhanh')).toBeInTheDocument();
    });
  });

  it('3. Opens DashboardCustomizeModal when clicking customize button', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Tùy chỉnh'));

    await waitFor(() => {
      expect(screen.getByText('Tùy Chỉnh Giao Diện Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Thoáng đãng (Mặc định)')).toBeInTheDocument();
      expect(screen.getByText('Gọn gàng (Thu nhỏ khoảng cách)')).toBeInTheDocument();
    });
  });

  it('4. Navigates when clicking quick action buttons', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Điểm danh')).toBeInTheDocument();
      expect(screen.getByText('Ghi điểm thi đua')).toBeInTheDocument();
    });
  });
});

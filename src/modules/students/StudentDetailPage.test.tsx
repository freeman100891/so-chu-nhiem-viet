import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StudentDetailPage } from './StudentDetailPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../core/services/avatar-theme-registry';

describe('StudentDetailPage 5-Level Avatar Synchronization Tests (FEAT-AVATAR-003)', () => {
  const mockClassId = 'test-class-detail-1';
  const mockStudentId = 'test-student-detail-1';

  beforeEach(async () => {
    await db.students.clear();
    await db.classes.clear();
    await db.classEnrollments.clear();
    await db.pointEntries.clear();
    await db.settings.clear();

    await db.settings.put({
      id: 'default',
      theme: 'traditional',
      activeAcademicYearId: 'year-1',
      activeClassId: mockClassId,
      sidebarCollapsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarSystemSettings: DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
      avatarSettingsRevision: 1,
    });

    await db.classes.put({
      id: mockClassId,
      name: '5A',
      grade: 5,
      status: 'Active',
      academicYearId: 'year-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.put({
      id: mockStudentId,
      fullName: 'Trần Văn Hoàng',
      normalizedName: 'tran van hoang',
      studentCode: 'HS-005',
      gender: 'Nam',
      dateOfBirth: '2014-03-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.put({
      id: 'enr-1',
      studentId: mockStudentId,
      classId: mockClassId,
      rollNumber: 5,
      status: 'Active',
      joinedAt: '2023-09-05',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    // 150 points -> Level 2: Tiến bộ (100 base + 150 = 250đ)
    await db.pointEntries.put({
      id: 'pt-1',
      studentId: mockStudentId,
      classId: mockClassId,
      categoryId: 'cat-1',
      points: 150,
      reason: 'Phát biểu xuất sắc',
      occurredAt: '2026-08-18',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  it('renders student profile hero card with synchronized 5-level avatar and level badge', async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={[`/students/${mockStudentId}`]}>
          <Routes>
            <Route path="/students/:studentId" element={<StudentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Trần Văn Hoàng')).toBeDefined();
    });

    // Verify student info
    expect(screen.getByText('Mã HS: HS-005 • Ngày sinh: 15/03/2014')).toBeDefined();

    // Verify 5-level presentation badges (Level 2: Tiến bộ, Cấp 2, 250đ)
    await waitFor(() => {
      const badgeElements = screen.getAllByText(/Cấp 2 • 250đ/);
      expect(badgeElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Tiến bộ ·/)).toBeDefined();
    expect(screen.getAllByText(/Cấp 2\/5/).length).toBeGreaterThan(0);
    expect(screen.getByText(/250 điểm thi đua/)).toBeDefined();
  });
});

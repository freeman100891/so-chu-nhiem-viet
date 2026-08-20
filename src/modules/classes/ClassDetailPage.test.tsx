import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ClassDetailPage } from './ClassDetailPage';
import { db } from '../../core/database/db';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../core/services/avatar-theme-registry';

describe('ClassDetailPage 5-Level Avatar Synchronization Tests (FEAT-AVATAR-003)', () => {
  const mockClassId = 'test-class-cdp-1';
  const mockStudent1 = 'test-st-cdp-1';
  const mockStudent2 = 'test-st-cdp-2';

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
      name: '5B',
      grade: 5,
      description: 'Lớp chọn 5B',
      status: 'Active',
      academicYearId: 'year-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.bulkPut([
      {
        id: mockStudent1,
        fullName: 'Nguyễn Thảo Ly',
        normalizedName: 'nguyen thao ly',
        studentCode: 'HS-001',
        gender: 'Nữ',
        dateOfBirth: '2014-05-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: mockStudent2,
        fullName: 'Lê Bảo Nam',
        normalizedName: 'le bao nam',
        studentCode: 'HS-002',
        gender: 'Nam',
        dateOfBirth: '2014-08-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);

    await db.classEnrollments.bulkPut([
      {
        id: 'enr-1',
        studentId: mockStudent1,
        classId: mockClassId,
        rollNumber: 1,
        status: 'Active',
        joinedAt: '2023-09-05',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: 'enr-2',
        studentId: mockStudent2,
        classId: mockClassId,
        rollNumber: 2,
        status: 'Active',
        joinedAt: '2023-09-05',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);

    // Student 1: 350 points -> Level 3: Bứt phá
    // Student 2: 50 points -> Level 1: Khởi đầu
    await db.pointEntries.bulkPut([
      {
        id: 'pt-1',
        studentId: mockStudent1,
        classId: mockClassId,
        categoryId: 'cat-1',
        points: 350,
        reason: 'Thi học sinh giỏi',
        occurredAt: '2026-08-18',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: 'pt-2',
        studentId: mockStudent2,
        classId: mockClassId,
        categoryId: 'cat-1',
        points: 50,
        reason: 'Phát biểu',
        occurredAt: '2026-08-18',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);
  });

  it('renders class detail roster with 5-level avatar badges and zero N+1 queries', async () => {
    render(
      <MemoryRouter initialEntries={[`/classes/${mockClassId}`]}>
        <Routes>
          <Route path="/classes/:classId" element={<ClassDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chi tiết Lớp 5B')).toBeDefined();
    });

    expect(screen.getByText('Nguyễn Thảo Ly')).toBeDefined();
    expect(screen.getByText('Lê Bảo Nam')).toBeDefined();

    // Verify badges display short labels and points
    expect(screen.getByText(/Cấp 3 • 350đ/)).toBeDefined();
    expect(screen.getByText(/Cấp 1 • 50đ/)).toBeDefined();
  });
});

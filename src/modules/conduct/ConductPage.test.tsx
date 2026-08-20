import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConductPage } from './ConductPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import { DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../core/services/avatar-theme-registry';

describe('ConductPage 5-Level Avatar Synchronization Tests (FEAT-AVATAR-003)', () => {
  const mockClassId = 'test-class-conduct-1';
  const mockStudent1 = 'test-st-conduct-1';

  beforeEach(async () => {
    await db.students.clear();
    await db.classes.clear();
    await db.classEnrollments.clear();
    await db.pointEntries.clear();
    await db.pointCategories.clear();
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
      name: '5C',
      grade: 5,
      status: 'Active',
      academicYearId: 'year-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.put({
      id: mockStudent1,
      fullName: 'Phạm Minh Đức',
      normalizedName: 'pham minh duc',
      studentCode: 'HS-003',
      gender: 'Nam',
      dateOfBirth: '2014-07-12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.put({
      id: 'enr-1',
      studentId: mockStudent1,
      classId: mockClassId,
      rollNumber: 3,
      status: 'Active',
      joinedAt: '2023-09-05',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.pointEntries.put({
      id: 'pt-1',
      studentId: mockStudent1,
      classId: mockClassId,
      categoryId: 'cat-1',
      points: 620,
      reason: 'Đạt giải Nhất Robocon',
      occurredAt: '2026-08-18',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  });

  it('renders Leaderboard tab with 5-Level Avatar System definitions and student presentation cards', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <ConductPage initialTab="leaderboard" />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hệ Thống 5 Cấp Độ Avatar/)).toBeDefined();
    });

    // Check that 5 global avatar levels are rendered
    expect(screen.getByText('Khởi đầu')).toBeDefined();
    expect(screen.getByText('Tiến bộ')).toBeDefined();
    expect(screen.getByText('Bứt phá')).toBeDefined();
    expect(screen.getByText('Xuất sắc')).toBeDefined();
    expect(screen.getByText('Vinh quang')).toBeDefined();

    // Check student in leaderboard (620 points -> Level 4: Xuất sắc)
    await waitFor(() => {
      expect(screen.getByText('Phạm Minh Đức')).toBeDefined();
      expect(screen.getByText(/Xuất sắc \(Cấp 4\)/)).toBeDefined();
    });
  });
});

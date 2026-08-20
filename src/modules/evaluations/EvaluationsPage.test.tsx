import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { db } from '../../core/database/db';
import { EvaluationsPage } from './EvaluationsPage';
import { ToastProvider } from '../../shared/components/ToastContext';

describe('EvaluationsPage UI & Integration Tests', () => {
  const academicYearId = 'year-ui-1';
  const classId = 'class-ui-4a';
  const student1Id = 'student-ui-1';

  beforeEach(async () => {
    await db.academicYears.clear();
    await db.classes.clear();
    await db.students.clear();
    await db.classEnrollments.clear();
    await db.evaluations.clear();
    await db.evaluationItems.clear();
    await db.evaluationCommentTemplates.clear();
    await db.settings.clear();

    await db.academicYears.add({
      id: academicYearId,
      name: '2024-2025',
      startDate: '2024-09-05',
      endDate: '2025-05-30',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classes.add({
      id: classId,
      academicYearId,
      name: '4A',
      grade: 4,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.students.add({
      id: student1Id,
      studentCode: 'HS401',
      fullName: 'Trần Văn Hoàng',
      normalizedName: 'tran van hoang',
      gender: 'Nam',
      dateOfBirth: '2015-02-14',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.classEnrollments.add({
      id: 'enr-ui-1',
      classId,
      studentId: student1Id,
      rollNumber: 1,
      joinedAt: '2024-09-05',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.settings.add({
      id: 'default',
      activeAcademicYearId: academicYearId,
      activeClassId: classId,
      theme: 'traditional',
      sidebarCollapsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('1. Should render EvaluationsPage with class summary and student roster', async () => {
    render(
      <ToastProvider>
        <EvaluationsPage />
      </ToastProvider>
    );

    expect(await screen.findByText('Sổ Nhận Xét & Đánh Giá Học Sinh', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText('Thông tư 27/2020/TT-BGDĐT — Cấp Tiểu học', {}, { timeout: 4000 })).toBeInTheDocument();
    const studentNames = await screen.findAllByText('Trần Văn Hoàng', {}, { timeout: 4000 });
    expect(studentNames.length).toBeGreaterThanOrEqual(1);
  });

  it('2. Should render TT27 evaluation tabs: Môn học, Phẩm chất, Năng lực, Tổng hợp', async () => {
    render(
      <ToastProvider>
        <EvaluationsPage />
      </ToastProvider>
    );

    expect(await screen.findByText(/1\. Môn học & HĐGD/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText(/2\. Phẩm chất chủ yếu/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText(/3\. Năng lực chung & Đặc thù/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText(/4\. Tổng hợp/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

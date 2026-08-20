import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GiftsPage } from './GiftsPage';
import { ToastProvider } from '../../shared/components/ToastContext';
import { db } from '../../core/database/db';
import { generateUUID } from '../../shared/utilities/uuid';

describe('GiftsPage UI & Integration Tests', () => {
  const classId = 'cls-test-101';
  const studentId = 'st-test-101';
  const academicYearId = 'yr-test-101';

  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }

    const now = new Date().toISOString();

    await db.academicYears.add({
      id: academicYearId,
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.classes.add({
      id: classId,
      academicYearId,
      name: '5A1',
      grade: 5,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.students.add({
      id: studentId,
      studentCode: 'HS5001',
      fullName: 'Lê Hoàng Long',
      normalizedName: 'le hoang long',
      gender: 'Nam',
      dateOfBirth: '2014-05-15',
      avatarKey: 'boy_cute_cap_1',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: generateUUID(),
      classId,
      studentId,
      status: 'Active',
      joinedAt: '2025-09-05',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.settings.add({
      id: 'default',
      activeAcademicYearId: academicYearId,
      activeClassId: classId,
      theme: 'traditional',
      sidebarCollapsed: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('1. Should render GiftsPage with Header, 3 Tabs and Seeded Catalog Gifts', async () => {
    render(
      <MemoryRouter initialEntries={['/gifts']}>
        <ToastProvider>
          <GiftsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Thư Viện Quà Tặng & Đổi Điểm Tích Lũy', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Thư viện Quà tặng/i }, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Đổi quà Học sinh/i }, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Lịch sử Giao dịch/i }, { timeout: 4000 })).toBeInTheDocument();

    // Verify default seeded gifts show up in catalog
    expect((await screen.findAllByText('Bút chì 2B & Tẩy gôm hình thú', {}, { timeout: 4000 })).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText('Gói sticker dán sổ khen thưởng', {}, { timeout: 4000 })).length).toBeGreaterThanOrEqual(1);
  });

  it('2. Should switch to Đổi quà tab and render class selector and student options', async () => {
    render(
      <MemoryRouter initialEntries={['/gifts']}>
        <ToastProvider>
          <GiftsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    const redeemTabBtn = await screen.findByRole('button', { name: /Đổi quà Học sinh/i }, { timeout: 4000 });
    fireEvent.click(redeemTabBtn);

    expect(await screen.findByText('Lớp chủ nhiệm *', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText('Học sinh đổi quà *', {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('3. Should flip only one card at a time in the catalog grid (FEAT-GIFT-002)', async () => {
    render(
      <MemoryRouter initialEntries={['/gifts']}>
        <ToastProvider>
          <GiftsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    const card1Titles = await screen.findAllByText('Gói sticker dán sổ khen thưởng', {}, { timeout: 4000 });
    const card2Titles = await screen.findAllByText('Bút chì 2B & Tẩy gôm hình thú', {}, { timeout: 4000 });

    const card1Article = card1Titles[0]?.closest('article');
    const card2Article = card2Titles[0]?.closest('article');

    expect(card1Article).toHaveAttribute('data-flipped', 'false');
    expect(card2Article).toHaveAttribute('data-flipped', 'false');

    const card1Trigger = await screen.findByRole('button', { name: /Xem hình ảnh lớn món quà Gói sticker/i }, { timeout: 4000 });
    const card2Trigger = await screen.findByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i }, { timeout: 4000 });

    // Flip card 1
    fireEvent.click(card1Trigger);
    expect(card1Article).toHaveAttribute('data-flipped', 'true');
    expect(card2Article).toHaveAttribute('data-flipped', 'false');

    // Flip card 2: Card 1 should auto flip back, and card 2 becomes flipped
    fireEvent.click(card2Trigger);
    expect(card1Article).toHaveAttribute('data-flipped', 'false');
    expect(card2Article).toHaveAttribute('data-flipped', 'true');
  });
});

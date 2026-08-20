import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../../core/database/db';
import { backupService } from '../../core/backup/backup.service';
import { computeSHA256 } from '../../core/backup/crypto';
import { OnboardingWizard } from './OnboardingWizard';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('F-083: Onboarding Restore From Backup Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    for (const table of db.tables) {
      await table.clear();
    }
  });

  it('1. Step 1 of Onboarding displays both New Setup and Restore from Backup options', () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>
    );

    expect(screen.getByText('Chào mừng Thầy/Cô Giáo Chủ Nhiệm')).toBeDefined();
    expect(screen.getByText('Thiết lập mới từ đầu')).toBeDefined();
    expect(screen.getByText('Khôi phục từ bản sao lưu')).toBeDefined();
    expect(screen.getByText('Tạo hồ sơ mới')).toBeDefined();
    expect(screen.getByText('Chọn file sao lưu')).toBeDefined();
  });

  it('2. Clicking "Tạo hồ sơ mới" proceeds to Step 2 (Teacher Profile Form)', async () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>
    );

    const newSetupBtn = screen.getByText('Tạo hồ sơ mới');
    fireEvent.click(newSetupBtn);

    await waitFor(() => {
      expect(screen.getByText('Bước 2/7: Thông tin Giáo viên Chủ nhiệm')).toBeDefined();
      expect(screen.getByText('Họ và tên Giáo viên')).toBeDefined();
    });
  });

  it('3. Clicking "Chọn file sao lưu" opens the Onboarding Restore Modal', async () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>
    );

    const restoreChoice = screen.getByText('Khôi phục từ bản sao lưu');
    fireEvent.click(restoreChoice);

    await waitFor(() => {
      expect(screen.getByText('Khôi Phục Dữ Liệu Từ Bản Sao Lưu')).toBeDefined();
      expect(screen.getByText('Bấm để chọn file bản sao lưu')).toBeDefined();
    });
  });

  it('4. Parsing valid backup file extracts teacher metadata and displays preview in modal', async () => {
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: db.verno,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: ['teacherProfiles', 'academicYears', 'classes', 'students'],
      counts: { teacherProfiles: 1, academicYears: 1, classes: 2, students: 45 },
      teacherName: 'Cô Trần Thị Mai',
      academicYearName: '2026 - 2027',
      classCount: 2,
      studentCount: 45,
    };

    const data = {
      teacherProfiles: [{ id: 'tp-1', fullName: 'Cô Trần Thị Mai', schoolName: 'THPT Chu Văn An', phone: '0987654321' }],
      academicYears: [{ id: 'ay-1', name: '2026 - 2027', startDate: '2026-09-05', endDate: '2027-05-31', isActive: true }],
      classes: [
        { id: 'c-1', name: '10A1', grade: 10, academicYearId: 'ay-1', status: 'Active' },
        { id: 'c-2', name: '10A2', grade: 10, academicYearId: 'ay-1', status: 'Active' },
      ],
      students: [
        { id: 's-1', fullName: 'Nguyễn An', studentCode: 'HS01' },
      ],
    };

    const payloadStr = JSON.stringify({ manifest, data });
    const checksum = await computeSHA256(payloadStr);
    const backupContent = JSON.stringify({ manifest, data, checksum });

    const preview = await backupService.parseAndValidateBackupFile(backupContent);

    expect(preview.teacherName).toBe('Cô Trần Thị Mai');
    expect(preview.academicYearName).toBe('2026 - 2027');
    expect(preview.classCount).toBe(2);
    expect(preview.isCompatible).toBe(true);
  });

  it('5. Restoring database automatically configures settings with isOnboardingCompleted = true', async () => {
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: db.verno,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: ['teacherProfiles', 'academicYears', 'classes'],
      counts: { teacherProfiles: 1, academicYears: 1, classes: 1 },
      teacherName: 'Thầy Lê Hoàng Nam',
      academicYearName: '2026 - 2027',
    };

    const data = {
      teacherProfiles: [{ id: 'tp-1', fullName: 'Thầy Lê Hoàng Nam', schoolName: 'THCS Nguyễn Du', phone: '0912345678' }],
      academicYears: [{ id: 'ay-1', name: '2026 - 2027', startDate: '2026-09-05', endDate: '2027-05-31', isActive: true }],
      classes: [{ id: 'c-1', name: '6A', grade: 6, academicYearId: 'ay-1', status: 'Active' }],
    };

    const payloadStr = JSON.stringify({ manifest, data });
    const checksum = await computeSHA256(payloadStr);

    const preview = await backupService.parseAndValidateBackupFile(
      JSON.stringify({ manifest, data, checksum })
    );

    await backupService.executeRestore(preview);

    const settings = await db.settings.get('default-settings');
    expect(settings).toBeDefined();
    expect(settings?.isOnboardingCompleted).toBe(true);
    expect(settings?.activeAcademicYearId).toBe('ay-1');
    expect(settings?.activeClassId).toBe('c-1');

    const teacher = await db.teacherProfiles.get('tp-1');
    expect(teacher?.fullName).toBe('Thầy Lê Hoàng Nam');

    const allLogs = await db.auditLogs.toArray();
    const auditLog = allLogs.find((l) => l.action === 'SYSTEM_RESTORE');
    expect(auditLog).toBeDefined();
  });

  it('6. Rejects backup created by higher schema version with clear notification', async () => {
    const higherSchemaVersion = db.verno + 10;
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '2.0.0',
      schemaVersion: higherSchemaVersion,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: [],
      counts: {},
    };

    const data = {};
    const payloadStr = JSON.stringify({ manifest, data });
    const checksum = await computeSHA256(payloadStr);

    const preview = await backupService.parseAndValidateBackupFile(
      JSON.stringify({ manifest, data, checksum })
    );

    expect(preview.isCompatible).toBe(false);
    expect(preview.warning).toContain(`Phiên bản schema file sao lưu (v${higherSchemaVersion}) cao hơn`);
  });
});

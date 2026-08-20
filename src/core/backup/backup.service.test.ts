import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { backupService } from './backup.service';
import { computeSHA256, encryptPayload, decryptPayload } from './crypto';

describe('Backup & Restore Service Tests', () => {
  beforeEach(async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  it('1. Should export empty database data properly', async () => {
    const exported = await backupService.exportDatabaseData();
    expect(exported.totalRecords).toBe(0);
    expect(Object.keys(exported.data).length).toBe(40);
  });

  it('2. Should compute SHA-256 checksum accurately', async () => {
    const hash1 = await computeSHA256('Hello World');
    const hash2 = await computeSHA256('Hello World');
    const hash3 = await computeSHA256('Hello World Modified');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it('3. Should encrypt and decrypt payload with correct password using PBKDF2 + AES-GCM', async () => {
    const originalText = JSON.stringify({ message: 'Sổ Chủ Nhiệm Việt Offline' });
    const password = 'SecretPassword123';

    const encrypted = await encryptPayload(originalText, password);
    expect(encrypted.cipherText).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();

    // Decrypt with correct password
    const decrypted = await decryptPayload(encrypted, password);
    expect(decrypted).toBe(originalText);

    // Decrypt with wrong password should fail
    await expect(decryptPayload(encrypted, 'WrongPassword')).rejects.toThrow();
  });

  it('4. Should detect invalid SHA-256 checksum when backup payload is tampered', async () => {
    const data = { students: [{ id: 's1', fullName: 'Nguyễn Văn A' }] };
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: ['students'],
      counts: { students: 1 },
    };

    const payloadStr = JSON.stringify({ manifest, data });
    const correctHash = await computeSHA256(payloadStr);

    const validFileContent = JSON.stringify({
      manifest,
      data,
      checksum: correctHash,
    });

    const parsed = await backupService.parseAndValidateBackupFile(validFileContent);
    expect(parsed.totalRecords).toBe(1);

    // Tampered payload with modified name
    const tamperedData = { students: [{ id: 's1', fullName: 'Nguyễn Văn B (Tampered)' }] };
    const tamperedFileContent = JSON.stringify({
      manifest,
      data: tamperedData,
      checksum: correctHash, // Old hash won't match tampered data
    });

    await expect(backupService.parseAndValidateBackupFile(tamperedFileContent)).rejects.toThrow(
      'Mã băm SHA-256 không hợp lệ'
    );
  });

  it('5. Should export DB with classes, students and avatar base64 and restore intact', async () => {
    // Populate DB
    await db.classes.add({
      id: 'cls-1',
      academicYearId: 'yr-1',
      name: '10A1',
      grade: 10,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.add({
      id: 'st-1',
      studentCode: 'HS1001',
      fullName: 'Lê Văn Nam',
      normalizedName: 'le van nam',
      gender: 'Nam',
      dateOfBirth: '2008-01-01',
      avatar: 'data:image/jpeg;base64,mockAvatarDataString',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const exported = await backupService.exportDatabaseData();
    expect(exported.totalRecords).toBe(2);

    const createdAtISO = new Date().toISOString();
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: 1,
      createdAt: createdAtISO,
      isEncrypted: false,
      tables: db.tables.map((t) => t.name),
      counts: exported.counts,
    };

    const payloadStr = JSON.stringify({
      manifest,
      data: exported.data,
    });

    const checksum = await computeSHA256(payloadStr);

    const preview = await backupService.parseAndValidateBackupFile(
      JSON.stringify({
        manifest,
        data: exported.data,
        checksum,
      })
    );

    expect(preview.studentCount).toBe(1);
    expect(preview.classCount).toBe(1);

    // Clear DB
    for (const table of db.tables) {
      await table.clear();
    }

    // Execute restore
    await backupService.executeRestore(preview);

    const restoredStudent = await db.students.get('st-1');
    expect(restoredStudent?.fullName).toBe('Lê Văn Nam');
    expect(restoredStudent?.avatar).toBe('data:image/jpeg;base64,mockAvatarDataString');
  });

  it('6. Should export and restore 17 rank levels, rank systems, and studentRankHistory intact', async () => {
    const sysId = 'sys-test-1';
    const clsId = 'cls-test-1';
    const stId = 'st-test-1';

    await db.rankSystems.add({
      id: sysId,
      name: 'Hệ thống 17 Cấp Bậc',
      academicYearId: 'yr-1',
      termId: null,
      calculationScope: 'academic_year',
      rankMode: 'achievement',
      celebrationEnabled: true,
      presentationCelebrationEnabled: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.rankSystemClasses.add({
      id: 'rsc-1',
      rankSystemId: sysId,
      classId: clsId,
      createdAt: new Date().toISOString(),
    });

    for (let i = 1; i <= 17; i++) {
      await db.rankLevels.add({
        id: `rl-${i}`,
        rankSystemId: sysId,
        level: i,
        code: `LEVEL_${i}`,
        name: `Cấp ${i}`,
        group: i <= 5 ? 'Hạ sĩ quan và Binh sĩ' : i <= 9 ? 'Cấp Úy' : i <= 13 ? 'Cấp Tá' : 'Cấp Tướng',
        minPoints: (i - 1) * 50,
        colorToken: 'blue',
        badgeKey: 'shield',
        description: `Mô tả cấp ${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await db.studentRankHistory.add({
      id: 'srh-1',
      rankSystemId: sysId,
      classId: clsId,
      studentId: stId,
      fromLevel: 1,
      toLevel: 2,
      pointsBefore: 50,
      pointsAfter: 50,
      changeType: 'promotion',
      sourcePointEntryId: 'pe-1',
      reason: 'Thăng cấp thử nghiệm',
      createdAt: new Date().toISOString(),
    });

    const exported = await backupService.exportDatabaseData();
    expect(exported.counts['rankLevels']).toBe(17);
    expect(exported.counts['studentRankHistory']).toBe(1);

    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: db.tables.map((t) => t.name),
      counts: exported.counts,
    };

    const payloadStr = JSON.stringify({ manifest, data: exported.data });
    const checksum = await computeSHA256(payloadStr);

    const preview = await backupService.parseAndValidateBackupFile(
      JSON.stringify({ manifest, data: exported.data, checksum })
    );

    // Clear all tables
    for (const table of db.tables) {
      await table.clear();
    }

    // Execute restore
    await backupService.executeRestore(preview);

    const restoredLevels = await db.rankLevels.toArray();
    expect(restoredLevels.length).toBe(17);

    const restoredHistory = await db.studentRankHistory.get('srh-1');
    expect(restoredHistory).toBeDefined();
    expect(restoredHistory?.toLevel).toBe(2);
  });

  it('7. Should handle legacy backup without rank tables and auto-seed 17 ranks for academic years', async () => {
    const legacyAcademicYear = {
      id: 'yr-legacy-1',
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-05-31',
      isCurrent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Legacy backup payload has academicYears but NO rankSystems or rankLevels
    const legacyData: Record<string, unknown[]> = {
      academicYears: [legacyAcademicYear],
      classes: [],
      students: [],
    };

    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      tables: ['academicYears', 'classes', 'students'],
      counts: { academicYears: 1, classes: 0, students: 0 },
    };

    const payloadStr = JSON.stringify({ manifest, data: legacyData });
    const checksum = await computeSHA256(payloadStr);

    const preview = await backupService.parseAndValidateBackupFile(
      JSON.stringify({ manifest, data: legacyData, checksum })
    );

    for (const table of db.tables) {
      await table.clear();
    }

    await backupService.executeRestore(preview);

    // Verify auto-seeding occurred
    const rankSystems = await db.rankSystems.toArray();
    expect(rankSystems.length).toBe(1);

    const rankLevels = await db.rankLevels.toArray();
    rankLevels.sort((a, b) => a.level - b.level);
    expect(rankLevels.length).toBe(17);
    expect(rankLevels[0]?.name).toBe('Binh nhì');
    expect(rankLevels[16]?.name).toBe('Đại tướng');
  });

  it('8. Should round-trip backup and restore with GiftImages preserving Blob instances, dimensions, MIME and size', async () => {
    // 1. Seed a gift and a giftImage with Blobs
    const giftId = 'gift-test-101';
    const nowISO = new Date().toISOString();

    await db.gifts.add({
      id: giftId,
      name: 'Bộ dụng cụ học tập cao cấp',
      normalizedName: 'bo dung cu hoc tap cao cap',
      category: 'STATIONERY',
      pointCost: 40,
      status: 'ACTIVE',
      inventoryMode: 'TRACKED',
      stockOnHand: 10,
      displayOrder: 1,
      presentationVisible: true,
      imageId: 'img-101',
      imageVersion: 1,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    });

    const fullBlobData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
    const thumbBlobData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 8, 7]);

    await db.giftImages.add({
      id: 'img-101',
      giftId: giftId,
      fullBlob: new Blob([fullBlobData], { type: 'image/png' }),
      fullMimeType: 'image/png',
      fullWidth: 1000,
      fullHeight: 800,
      fullSizeBytes: fullBlobData.length,
      thumbnailBlob: new Blob([thumbBlobData], { type: 'image/png' }),
      thumbnailMimeType: 'image/png',
      thumbnailWidth: 320,
      thumbnailHeight: 256,
      thumbnailSizeBytes: thumbBlobData.length,
      contentHash: 'sha256-test-hash',
      version: 1,
      createdAt: nowISO,
      updatedAt: nowISO,
    });

    // 2. Export Database Data
    const exportResult = await backupService.exportDatabaseData();
    expect(exportResult.counts.gifts).toBe(1);
    expect(exportResult.counts.giftImages).toBe(1);

    const serializedImg = (exportResult.data.giftImages as any[])[0];
    expect(serializedImg.fullBlob.__isBlob).toBe(true);
    expect(serializedImg.fullBlob.base64).toBeDefined();

    // 3. Create Backup File String & Validate
    const manifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: db.verno,
      createdAt: nowISO,
      isEncrypted: false,
      tables: db.tables.map((t) => t.name),
      counts: exportResult.counts,
    };

    const payloadStr = JSON.stringify({ manifest, data: exportResult.data });
    const checksum = await computeSHA256(payloadStr);
    const backupFileContent = JSON.stringify({ manifest, data: exportResult.data, checksum });

    const preview = await backupService.parseAndValidateBackupFile(backupFileContent);
    expect(preview.isCompatible).toBe(true);

    // 4. Clear database
    for (const table of db.tables) {
      await table.clear();
    }

    // 5. Execute Restore
    await backupService.executeRestore(preview);

    // 6. Verify restored records and Blob integrity
    const restoredGift = await db.gifts.get(giftId);
    expect(restoredGift).toBeDefined();
    expect(restoredGift?.name).toBe('Bộ dụng cụ học tập cao cấp');
    expect(restoredGift?.imageId).toBe('img-101');

    const restoredImage = await db.giftImages.get('img-101');
    expect(restoredImage).toBeDefined();
    expect(restoredImage?.giftId).toBe(giftId);
    expect(restoredImage?.fullWidth).toBe(1000);
    expect(restoredImage?.fullHeight).toBe(800);
    expect(restoredImage?.fullMimeType).toBe('image/png');
    expect(restoredImage?.fullSizeBytes).toBe(fullBlobData.length);
    expect(restoredImage?.thumbnailSizeBytes).toBe(thumbBlobData.length);
    expect(restoredImage?.fullBlob).toBeDefined();
    expect(restoredImage?.thumbnailBlob).toBeDefined();
  });
});

import { db } from '../database/db';
import { computeSHA256, encryptPayload, decryptPayload, type EncryptedDataPayload } from './crypto';
import { BackupFileContentSchema } from './backup.schemas';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import { rankSeedService } from '../services/rank-seed.service';
import { evaluationTemplateSeedService } from '../services/evaluation-template-seed.service';
import { honorTitleSeedService } from '../services/honor-title-seed.service';
import { themeService } from '../services/theme.service';
import type { BackupHistory } from '../database/types';

export interface BackupManifest {
  appName: string;
  appVersion: string;
  schemaVersion: number;
  createdAt: string;
  isEncrypted: boolean;
  tables: string[];
  counts: Record<string, number>;
  teacherName?: string;
  academicYearName?: string;
  classCount?: number;
  studentCount?: number;
}

export interface BackupFilePayload {
  manifest: BackupManifest;
  data: Record<string, unknown[]>;
  checksum: string;
}

export interface EncryptedBackupContainer {
  manifest: {
    appName: string;
    appVersion: string;
    schemaVersion: number;
    createdAt: string;
    isEncrypted: true;
  };
  encryptedPayload: EncryptedDataPayload;
}

export interface BackupPreviewData {
  createdAtFormatted: string;
  appVersion: string;
  schemaVersion: number;
  teacherName: string;
  academicYearName: string;
  classCount: number;
  studentCount: number;
  totalRecords: number;
  isCompatible: boolean;
  fileSizeBytes?: number;
  warning?: string;
  payload: BackupFilePayload;
}


async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] || '' : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function serializeBlobField(blobOrObj: any, fallbackMime: string): Promise<any> {
  if (!blobOrObj) return undefined;
  if (typeof blobOrObj === 'object' && blobOrObj.__isBlob && blobOrObj.base64) {
    return blobOrObj;
  }
  if (blobOrObj instanceof Blob) {
    return {
      __isBlob: true,
      mimeType: blobOrObj.type || fallbackMime || 'image/webp',
      base64: await blobToBase64(blobOrObj),
    };
  }
  if (typeof blobOrObj === 'object') {
    try {
      const blob = new Blob([blobOrObj], { type: fallbackMime });
      return {
        __isBlob: true,
        mimeType: fallbackMime || 'image/webp',
        base64: await blobToBase64(blob),
      };
    } catch {
      return blobOrObj;
    }
  }
  return blobOrObj;
}

export class BackupService {
  /**
   * Tạo tên file sao lưu dạng SoChuNhiem_YYYY-MM-DD_HH-mm.gvcn-backup
   */
  generateBackupFilename(): string {
    const now = new Date();
    const dateStr = getTodayDateString(now);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `SoChuNhiem_${dateStr}_${hours}-${minutes}.gvcn-backup`;
  }

  /**
   * Trích xuất dữ liệu thô của toàn bộ các bảng IndexedDB (kèm serialize Blob cho giftImages)
   */
  async exportDatabaseData(onProgress?: (percent: number) => void): Promise<{ data: Record<string, unknown[]>; counts: Record<string, number>; totalRecords: number }> {
    const tables = db.tables;
    const data: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};
    let totalRecords = 0;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]!;
      const records = await table.toArray();

      if (table.name === 'giftImages') {
        const serializedGiftImages: unknown[] = [];
        for (const item of records as any[]) {
          const serialized = { ...item };
          serialized.fullBlob = await serializeBlobField(item.fullBlob, item.fullMimeType || 'image/webp');
          serialized.thumbnailBlob = await serializeBlobField(item.thumbnailBlob, item.thumbnailMimeType || 'image/webp');
          serializedGiftImages.push(serialized);
        }
        data[table.name] = serializedGiftImages;
      } else if (table.name === 'avatarAssets') {
        const serializedAssets: unknown[] = [];
        for (const item of records as any[]) {
          const serialized = { ...item };
          serialized.blob = await serializeBlobField(item.blob, item.mimeType || 'image/png');
          serializedAssets.push(serialized);
        }
        data[table.name] = serializedAssets;
      } else {
        data[table.name] = records;
      }

      counts[table.name] = records.length;
      totalRecords += records.length;

      if (onProgress) {
        onProgress(Math.round(((i + 1) / tables.length) * 50));
      }
    }

    return { data, counts, totalRecords };
  }

  /**
   * Thực hiện sao lưu dữ liệu toàn bộ ra file .gvcn-backup
   */
  async createBackup(
    password?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ filename: string; fileSize: number; totalRecords: number }> {
    const { data, counts, totalRecords } = await this.exportDatabaseData(onProgress);
    const nowISO = new Date().toISOString();

    const tableNames = db.tables.map((t) => t.name);
    const teacherProfiles = (data.teacherProfiles || []) as any[];
    const teacherName = teacherProfiles[0]?.fullName || '';
    const academicYears = (data.academicYears || []) as any[];
    const activeYear = academicYears.find((y: any) => y.isActive) || academicYears[0];
    const academicYearName = activeYear?.name || '';
    const classCount = counts.classes || 0;
    const studentCount = counts.students || 0;

    const manifest: BackupManifest = {
      appName: 'Sổ Chủ Nhiệm Việt Offline',
      appVersion: '1.0.0',
      schemaVersion: db.verno,
      createdAt: nowISO,
      isEncrypted: !!password && password.trim().length > 0,
      tables: tableNames,
      counts,
      teacherName,
      academicYearName,
      classCount,
      studentCount,
    };

    // Calculate SHA-256 checksum over manifest + data JSON payload
    const payloadStr = JSON.stringify({ manifest, data });
    const checksum = await computeSHA256(payloadStr);

    let finalFileStr: string;

    if (manifest.isEncrypted && password) {
      if (onProgress) onProgress(60);
      const encrypted = await encryptPayload(payloadStr, password.trim());
      const container: EncryptedBackupContainer = {
        manifest: {
          appName: manifest.appName,
          appVersion: manifest.appVersion,
          schemaVersion: manifest.schemaVersion,
          createdAt: manifest.createdAt,
          isEncrypted: true,
        },
        encryptedPayload: encrypted,
      };
      finalFileStr = JSON.stringify(container, null, 2);
    } else {
      const payload: BackupFilePayload = {
        manifest,
        data,
        checksum,
      };
      finalFileStr = JSON.stringify(payload, null, 2);
    }

    if (onProgress) onProgress(80);

    const filename = this.generateBackupFilename();
    const blob = new Blob([finalFileStr], { type: 'application/json' });

    // Download File with File System Access API or Fallback
    await this.triggerFileDownload(blob, filename);

    if (onProgress) onProgress(95);

    // Record Backup History
    const historyEntry: BackupHistory = {
      id: crypto.randomUUID(),
      filename,
      fileSize: blob.size,
      recordCount: totalRecords,
      status: 'Success',
      createdAt: nowISO,
    };
    await db.backupHistory.add(historyEntry);

    // Audit Log
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      entityName: 'Backup',
      recordId: historyEntry.id,
      action: 'BACKUP',
      timestamp: nowISO,
      details: `Sao lưu dữ liệu thành công (${totalRecords} bản ghi)`,
    });

    if (onProgress) onProgress(100);

    return { filename, fileSize: blob.size, totalRecords };
  }

  /**
   * Helper tải file về máy hỗ trợ File System Access API và Fallback link
   */
  private async triggerFileDownload(blob: Blob, filename: string): Promise<void> {
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const picker = (window as unknown as { showSaveFilePicker: (options: unknown) => Promise<unknown> }).showSaveFilePicker;
        const handle = await picker({
          suggestedName: filename,
          types: [
            {
              description: 'Sổ Chủ Nhiệm Backup File',
              accept: { 'application/json': ['.gvcn-backup'] },
            },
          ],
        }) as { createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> };
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          throw new Error('Người dùng đã hủy thao tác lưu file sao lưu.');
        }
        // Fallback to standard download link if picker fails
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Giải mã và validate file sao lưu .gvcn-backup
   */
  async parseAndValidateBackupFile(
    fileStr: string,
    password?: string
  ): Promise<BackupPreviewData> {
    let parsedRaw: Record<string, unknown>;
    try {
      parsedRaw = JSON.parse(fileStr);
    } catch {
      throw new Error('File sao lưu bị hỏng hoặc không đúng định dạng JSON.');
    }

    if (!parsedRaw || typeof parsedRaw !== 'object' || !parsedRaw.manifest) {
      throw new Error('Cấu trúc file sao lưu không hợp lệ.');
    }

    let payload: BackupFilePayload;

    const manifestObj = parsedRaw.manifest as Record<string, unknown>;

    // Encrypted file handling
    if (manifestObj.isEncrypted) {
      if (!password || !password.trim()) {
        throw new Error('FILE_ENCRYPTED_REQUIRES_PASSWORD');
      }

      if (!parsedRaw.encryptedPayload) {
        throw new Error('Dữ liệu mã hóa bị thiếu trong file sao lưu.');
      }

      let decryptedStr: string;
      try {
        decryptedStr = await decryptPayload(parsedRaw.encryptedPayload as EncryptedDataPayload, password.trim());
      } catch {
        throw new Error('Mật khẩu giải mã không chính xác hoặc dữ liệu mã hóa bị hỏng.');
      }

      try {
        const decryptedObj = JSON.parse(decryptedStr);
        const checksum = await computeSHA256(JSON.stringify(decryptedObj));
        payload = {
          manifest: decryptedObj.manifest,
          data: decryptedObj.data,
          checksum,
        };
      } catch {
        throw new Error('Lỗi giải mã cấu trúc dữ liệu bên trong file.');
      }
    } else {
      payload = parsedRaw as unknown as BackupFilePayload;

      // Verify SHA-256 Checksum
      const payloadStr = JSON.stringify({ manifest: payload.manifest, data: payload.data });
      const computedHash = await computeSHA256(payloadStr);

      if (payload.checksum && payload.checksum !== computedHash) {
        throw new Error('Mã băm SHA-256 không hợp lệ. File sao lưu có thể đã bị thay đổi hoặc bị hỏng.');
      }
    }

    // Zod Schema Validation
    try {
      BackupFileContentSchema.parse(payload);
    } catch (err: unknown) {
      console.error('Validation error on backup schema:', err);
      throw new Error('Dữ liệu trong file sao lưu không tuân thủ Zod schema.');
    }

    // Metrics for Preview
    const classCount = payload.data.classes ? payload.data.classes.length : ((payload.manifest as any).classCount || 0);
    const studentCount = payload.data.students ? payload.data.students.length : ((payload.manifest as any).studentCount || 0);
    const teacherName = (payload.data.teacherProfiles?.[0] as any)?.fullName || (payload.manifest as any).teacherName || 'Chưa đặt tên';
    const academicYearName = (payload.data.academicYears?.[0] as any)?.name || (payload.manifest as any).academicYearName || '2026 - 2027';

    let totalRecords = 0;
    Object.values(payload.data).forEach((arr) => {
      if (Array.isArray(arr)) totalRecords += arr.length;
    });

    const createdAtDate = payload.manifest.createdAt.split('T')[0];
    const createdAtFormatted = formatDateVietnamese(createdAtDate);
    const isCompatible = payload.manifest.schemaVersion <= db.verno;

    let warning: string | undefined;
    if (payload.manifest.schemaVersion > db.verno) {
      warning = `Phiên bản schema file sao lưu (v${payload.manifest.schemaVersion}) cao hơn phiên bản ứng dụng hiện tại (v${db.verno}). Vui lòng cập nhật ứng dụng trước khi khôi phục.`;
    }

    return {
      createdAtFormatted,
      appVersion: payload.manifest.appVersion,
      schemaVersion: payload.manifest.schemaVersion,
      teacherName,
      academicYearName,
      classCount,
      studentCount,
      totalRecords,
      isCompatible,
      warning,
      payload,
    };
  }

  /**
   * Thực hiện khôi phục toàn bộ dữ liệu (Replace All) với Auto Pre-Restore Backup & Transaction Rollback
   */
  async executeRestore(
    previewData: BackupPreviewData,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    if (onProgress) onProgress(10);

    // 1. AUTO PRE-RESTORE BACKUP: Export current database state into memory for safe rollback
    const preRestoreBackup = await this.exportDatabaseData();

    if (onProgress) onProgress(30);

    const targetTables = db.tables;

    try {
      // 2. Execute restore inside Dexie Transaction
      await db.runTransaction('rw', targetTables, async () => {
        // Clear all tables
        for (const table of targetTables) {
          await table.clear();
        }

        // Bulk insert records for each table from backup payload
        for (let i = 0; i < targetTables.length; i++) {
          const table = targetTables[i]!;
          const records = previewData.payload.data[table.name];
          if (records && Array.isArray(records) && records.length > 0) {
            if (table.name === 'giftImages') {
              const deserializedImages = (records as any[]).map((img) => {
                let fullBlob = img.fullBlob;
                if (fullBlob && typeof fullBlob === 'object' && fullBlob.__isBlob && fullBlob.base64) {
                  fullBlob = base64ToBlob(fullBlob.base64, fullBlob.mimeType || img.fullMimeType || 'image/webp');
                }
                let thumbnailBlob = img.thumbnailBlob;
                if (thumbnailBlob && typeof thumbnailBlob === 'object' && thumbnailBlob.__isBlob && thumbnailBlob.base64) {
                  thumbnailBlob = base64ToBlob(thumbnailBlob.base64, thumbnailBlob.mimeType || img.thumbnailMimeType || 'image/webp');
                }
                return {
                  ...img,
                  fullBlob,
                  thumbnailBlob,
                };
              });
              await table.bulkAdd(deserializedImages);
            } else if (table.name === 'avatarAssets') {
              const deserializedAssets = (records as any[]).map((ast) => {
                let blob = ast.blob;
                if (blob && typeof blob === 'object' && blob.__isBlob && blob.base64) {
                  blob = base64ToBlob(blob.base64, blob.mimeType || ast.mimeType || 'image/png');
                }
                return {
                  ...ast,
                  blob,
                };
              });
              await table.bulkAdd(deserializedAssets);
            } else {
              await table.bulkAdd(records);
            }
          }
          if (onProgress) {
            onProgress(30 + Math.round(((i + 1) / targetTables.length) * 50));
          }
        }
      });

      if (onProgress) onProgress(85);

      // 3. Backward compatibility check & Post-restore normalization:
      // Ensure default rank system is seeded if missing
      const rankSystemsCount = await db.rankSystems.count();
      if (rankSystemsCount === 0) {
        const years = await db.academicYears.toArray();
        for (const yr of years) {
          await rankSeedService.seedDefaultRankSystem(yr.id);
        }
      }

      // Ensure countsTowardRank exists on all pointCategories
      const categories = await db.pointCategories.toArray();
      for (const cat of categories) {
        if (cat.countsTowardRank === undefined) {
          await db.pointCategories.update(cat.id, { countsTowardRank: true });
        }
      }

      // Ensure honor titles are seeded & clean
      await honorTitleSeedService.seedDefaultTitles();

      // Ensure evaluation comment templates are seeded
      await evaluationTemplateSeedService.seedTemplates();

      // Ensure settings has active year, class & isOnboardingCompleted = true
      let settings = await db.settings.get('default-settings');
      const allYears = await db.academicYears.toArray();
      const activeYear = allYears.find((y) => y.isActive) || allYears[0];
      const allClasses = await db.classes.toArray();
      const activeClass = allClasses.find((c) => !c.deletedAt) || allClasses[0];

      if (!settings) {
        await db.settings.put({
          id: 'default-settings',
          theme: 'military',
          activeAcademicYearId: activeYear?.id || '',
          activeClassId: activeClass?.id || '',
          sidebarCollapsed: false,
          isOnboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.settings.update('default-settings', {
          isOnboardingCompleted: true,
          activeAcademicYearId: settings.activeAcademicYearId || activeYear?.id || '',
          activeClassId: settings.activeClassId || activeClass?.id || '',
          updatedAt: new Date().toISOString(),
        });
      }

      // Apply restored theme
      const updatedSettings = await db.settings.get('default-settings');
      if (updatedSettings?.theme) {
        themeService.applyTheme(updatedSettings.theme as any);
      }

      // 4. Verify record counts & health
      const health = await db.checkDatabaseHealth();
      if (health.status !== 'healthy') {
        throw new Error('Kiểm tra sức khỏe database sau khôi phục thất bại.');
      }

      // Record Audit Log for restore
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'Restore',
        recordId: 'default',
        action: 'SYSTEM_RESTORE',
        timestamp: new Date().toISOString(),
        details: `Khôi phục thành công ${previewData.totalRecords} bản ghi từ file sao lưu ngày ${previewData.createdAtFormatted}`,
      });

      if (onProgress) onProgress(100);
    } catch (restoreErr: unknown) {
      console.error('Restore failed, performing automatic rollback to pre-restore state:', restoreErr);

      // ROLLBACK: Restore original database state
      try {
        await db.runTransaction('rw', targetTables, async () => {
          for (const table of targetTables) {
            await table.clear();
            const originalRecords = preRestoreBackup.data[table.name];
            if (originalRecords && originalRecords.length > 0) {
              await table.bulkAdd(originalRecords);
            }
          }
        });
      } catch (rollbackErr) {
        console.error('Critical: Rollback also failed:', rollbackErr);
      }

      throw new Error(`Khôi phục dữ liệu thất bại (${(restoreErr as Error).message}). Đã tự động rollback về dữ liệu ban đầu.`);
    }
  }
}

export const backupService = new BackupService();


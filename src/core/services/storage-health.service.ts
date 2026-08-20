import { db, type DatabaseHealthStatus } from '../database/db';

export interface StorageEstimateInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
}

export class StorageHealthService {
  /**
   * Chạy Database Health Check mà KHÔNG sửa đổi bất kỳ dữ liệu nào
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    return await db.checkDatabaseHealth();
  }

  /**
   * Kiểm tra quyền Lưu Trữ Bền Vững (Persistent Storage)
   */
  async checkPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  }

  /**
   * Yêu cầu trình duyệt cấp quyền Lưu Trữ Bền Vững (Persistent Storage)
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  }

  /**
   * Ước tính dung lượng bộ nhớ đã dùng / tổng dung lượng cho phép
   */
  async getStorageEstimate(): Promise<StorageEstimateInfo> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const usageMB = Number(((est.usage || 0) / (1024 * 1024)).toFixed(2));
      const quotaMB = Number(((est.quota || 0) / (1024 * 1024)).toFixed(2));
      const percentUsed = quotaMB > 0 ? Number(((usageMB / quotaMB) * 100).toFixed(1)) : 0;
      return { usageMB, quotaMB, percentUsed };
    }
    return { usageMB: 0, quotaMB: 0, percentUsed: 0 };
  }

  /**
   * Kiểm tra xem có cần nhắc nhở sao lưu (khi đã quá 7 ngày kể từ lần sao lưu gần nhất)
   */
  async checkBackupReminder(): Promise<{ shouldRemind: boolean; daysSince: number | null }> {
    const history = await db.backupHistory.reverse().sortBy('createdAt');
    if (history.length === 0) {
      return { shouldRemind: true, daysSince: null };
    }

    const lastDate = new Date(history[0]!.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      shouldRemind: daysSince >= 7,
      daysSince,
    };
  }
}

export const storageHealthService = new StorageHealthService();

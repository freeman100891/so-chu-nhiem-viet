import { db } from '../database/db';
import type { AuditAction, AuditLog } from '../database/types';

export class AuditService {
  async log(entityName: string, recordId: string, action: AuditAction, details?: string): Promise<AuditLog> {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      entityName,
      recordId,
      action,
      timestamp: new Date().toISOString(),
      details,
    };
    await db.auditLogs.add(entry);
    return entry;
  }

  async getLogsForEntity(entityName: string, recordId?: string): Promise<AuditLog[]> {
    if (recordId) {
      return await db.auditLogs
        .filter((l) => l.entityName === entityName && l.recordId === recordId)
        .reverse()
        .sortBy('timestamp');
    }
    return await db.auditLogs
      .filter((l) => l.entityName === entityName)
      .reverse()
      .sortBy('timestamp');
  }

  async getAllLogs(limit = 100): Promise<AuditLog[]> {
    return await db.auditLogs
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }
}

export const auditService = new AuditService();

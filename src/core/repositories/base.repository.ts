import { Table } from 'dexie';
import { db } from '../database/db';
import type { SoftDeleteEntity, AuditAction } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export abstract class BaseRepository<T extends SoftDeleteEntity> {
  protected table: Table<T, string>;
  protected entityName: string;

  constructor(table: Table<T, string>, entityName: string) {
    this.table = table;
    this.entityName = entityName;
  }

  protected async logChange(recordId: string, action: AuditAction, details?: string): Promise<void> {
    await db.auditLogs.add({
      id: generateUUID(),
      entityName: this.entityName,
      recordId,
      action,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  async findById(id: string): Promise<T | undefined> {
    return await this.table.get(id);
  }

  async findAll(includeDeleted = false): Promise<T[]> {
    if (includeDeleted) {
      return await this.table.toArray();
    }
    return await this.table.filter((item) => !item.deletedAt).toArray();
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as unknown as T;

    await db.transaction('rw', [this.table as Table<SoftDeleteEntity, string>, db.auditLogs], async () => {
      await this.table.add(newItem);
      await this.logChange(newItem.id, 'CREATE');
    });

    return newItem;
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const updatedItem = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    await db.transaction('rw', [this.table as Table<SoftDeleteEntity, string>, db.auditLogs], async () => {
      await this.table.put(updatedItem);
      await this.logChange(id, 'UPDATE');
    });

    return updatedItem;
  }

  async softDelete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing || existing.deletedAt) return false;

    const now = new Date().toISOString();
    await db.transaction('rw', [this.table as Table<SoftDeleteEntity, string>, db.auditLogs], async () => {
      await this.table.update(id, {
        deletedAt: now,
        updatedAt: now,
      } as unknown as Parameters<typeof this.table.update>[1]);
      await this.logChange(id, 'DELETE');
    });

    return true;
  }

  async restore(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing || !existing.deletedAt) return false;

    const now = new Date().toISOString();
    await db.transaction('rw', [this.table as Table<SoftDeleteEntity, string>, db.auditLogs], async () => {
      await this.table.update(id, {
        deletedAt: null,
        updatedAt: now,
      } as unknown as Parameters<typeof this.table.update>[1]);
      await this.logChange(id, 'RESTORE');
    });

    return true;
  }

  async findTrash(): Promise<T[]> {
    return await this.table.filter((item) => !!item.deletedAt).toArray();
  }
}

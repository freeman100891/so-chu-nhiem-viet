import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { AcademicYear } from '../database/types';

export class AcademicYearRepository extends BaseRepository<AcademicYear> {
  constructor() {
    super(db.academicYears, 'AcademicYear');
  }

  async getCurrentYear(): Promise<AcademicYear | undefined> {
    return await this.table.filter((y) => !y.deletedAt && y.isActive).first();
  }

  async setCurrentYear(id: string): Promise<void> {
    await db.transaction('rw', [db.academicYears, db.auditLogs], async () => {
      const all = await this.table.toArray();
      for (const y of all) {
        if (y.id === id && !y.isActive) {
          await this.table.update(y.id, { isActive: true, updatedAt: new Date().toISOString() });
          await this.logChange(y.id, 'UPDATE', 'Đặt làm năm học hiện tại');
        } else if (y.id !== id && y.isActive) {
          await this.table.update(y.id, { isActive: false, updatedAt: new Date().toISOString() });
        }
      }
    });
  }
}

export const academicYearRepository = new AcademicYearRepository();

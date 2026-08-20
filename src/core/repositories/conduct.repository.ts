import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { PointEntry } from '../database/types';

export class ConductRepository extends BaseRepository<PointEntry> {
  constructor() {
    super(db.pointEntries, 'PointEntry');
  }

  async findByStudentId(studentId: string): Promise<PointEntry[]> {
    return await this.table
      .filter((c) => !c.deletedAt && c.studentId === studentId)
      .reverse()
      .sortBy('occurredAt');
  }

  async findByClassId(classId: string): Promise<PointEntry[]> {
    return await this.table
      .filter((c) => !c.deletedAt && c.classId === classId)
      .reverse()
      .sortBy('occurredAt');
  }
}

export const conductRepository = new ConductRepository();

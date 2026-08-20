import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { ClassRoom } from '../database/types';

export class ClassRepository extends BaseRepository<ClassRoom> {
  constructor() {
    super(db.classes, 'ClassRoom');
  }

  async findByAcademicYear(academicYearId: string, includeDeleted = false): Promise<ClassRoom[]> {
    if (!academicYearId) return [];
    const all = await this.table.where('academicYearId').equals(academicYearId).toArray();
    if (includeDeleted) return all;
    return all.filter((c) => !c.deletedAt);
  }
}

export const classRepository = new ClassRepository();

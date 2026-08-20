import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { ClassEnrollment } from '../database/types';

export class EnrollmentRepository extends BaseRepository<ClassEnrollment> {
  constructor() {
    super(db.classEnrollments, 'ClassEnrollment');
  }

  async findByClassId(classId: string): Promise<ClassEnrollment[]> {
    return await this.table
      .where('classId')
      .equals(classId)
      .filter((e) => e.status === 'Active')
      .toArray();
  }

  async findEnrollment(classId: string, studentId: string): Promise<ClassEnrollment | undefined> {
    return await this.table
      .where('[classId+studentId]')
      .equals([classId, studentId])
      .filter((e) => e.status === 'Active' && !e.deletedAt)
      .first();
  }
}

export const enrollmentRepository = new EnrollmentRepository();

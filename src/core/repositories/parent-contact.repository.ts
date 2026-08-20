import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { ParentContact } from '../database/types';

export class ParentContactRepository extends BaseRepository<ParentContact> {
  constructor() {
    super(db.parentContacts, 'ParentContact');
  }

  async findByStudentId(studentId: string): Promise<ParentContact[]> {
    return await this.table
      .filter((p) => !p.deletedAt && p.studentId === studentId)
      .toArray();
  }
}

export const parentContactRepository = new ParentContactRepository();

import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { Student } from '../database/types';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(db.students, 'Student');
  }

  override async create(item: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'normalizedName'>): Promise<Student> {
    const normalizedName = normalizeVietnameseText(item.fullName);
    return super.create({
      ...item,
      normalizedName,
    });
  }

  override async update(id: string, updates: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Student | undefined> {
    if (updates.fullName) {
      updates.normalizedName = normalizeVietnameseText(updates.fullName);
    }
    return super.update(id, updates);
  }

  async findByStudentCode(studentCode: string): Promise<Student | undefined> {
    return await this.table
      .filter((s) => !s.deletedAt && s.studentCode.trim().toLowerCase() === studentCode.trim().toLowerCase())
      .first();
  }

  async searchByName(keyword: string): Promise<Student[]> {
    const normKeyword = normalizeVietnameseText(keyword);
    if (!normKeyword) return this.findAll();

    return await this.table
      .filter((s) => !s.deletedAt && s.normalizedName.includes(normKeyword))
      .toArray();
  }
}

export const studentRepository = new StudentRepository();

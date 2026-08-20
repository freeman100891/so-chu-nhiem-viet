import { db } from '../database/db';
import type { ClassRoom, ClassStatus } from '../database/types';
import { classRepository } from '../repositories/class.repository';
import { ClassRoomSchema } from '../validation/schemas';

export interface CreateClassInput {
  academicYearId: string;
  name: string;
  grade: number;
  description?: string;
  status?: ClassStatus;
}

export class ClassService {
  async createClass(input: CreateClassInput): Promise<ClassRoom> {
    ClassRoomSchema.parse(input);

    // Check duplicate class name in same academic year
    const existing = await db.classes
      .where('academicYearId')
      .equals(input.academicYearId)
      .filter((c) => !c.deletedAt && c.name.trim().toLowerCase() === input.name.trim().toLowerCase())
      .first();

    if (existing) {
      throw new Error(`Lớp "${input.name}" đã tồn tại trong năm học này.`);
    }

    return await classRepository.create({
      academicYearId: input.academicYearId,
      name: input.name,
      grade: input.grade,
      description: input.description,
      status: input.status ?? 'Active',
    });
  }

  async updateClass(id: string, updates: Partial<CreateClassInput>): Promise<ClassRoom | undefined> {
    return await classRepository.update(id, updates);
  }

  async softDeleteClass(id: string): Promise<boolean> {
    // Check active student headcount
    const enrollmentsCount = await db.classEnrollments
      .where('classId')
      .equals(id)
      .filter((e) => e.status === 'Active')
      .count();

    if (enrollmentsCount > 0) {
      throw new Error(`Không thể xóa lớp đang có ${enrollmentsCount} học sinh. Vui lòng chuyển học sinh trước khi xóa lớp.`);
    }

    return await classRepository.softDelete(id);
  }
}

export const classService = new ClassService();

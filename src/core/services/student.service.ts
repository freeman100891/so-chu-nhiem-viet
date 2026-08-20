import { db } from '../database/db';
import type { Student, ClassEnrollment, Gender, EnrollmentStatus } from '../database/types';
import { studentRepository } from '../repositories/student.repository';
import { enrollmentRepository } from '../repositories/enrollment.repository';
import { StudentSchema } from '../validation/schemas';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import { getTodayDateString } from '../../shared/utilities/date';
import { generateUUID } from '../../shared/utilities/uuid';

export interface CreateStudentInput {
  studentCode?: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  ethnicity?: string;
  address?: string;
  avatar?: string;
  avatarKey?: string | null;
  avatarThemeId?: string | null;
  medicalNote?: string;
  classId: string;
  rollNumber?: number;
}

export class StudentService {
  /**
   * Tự động sinh mã học sinh dạng HSYYYYXXXX (VD: HS20260001) nếu người dùng không nhập
   */
  async generateStudentCode(): Promise<string> {
    const yearPrefix = new Date().getFullYear();
    const prefix = `HS${yearPrefix}`;

    const count = await db.students.count();
    let nextNum = count + 1;

    while (true) {
      const code = `${prefix}${String(nextNum).padStart(4, '0')}`;
      const existing = await studentRepository.findByStudentCode(code);
      if (!existing) {
        return code;
      }
      nextNum++;
    }
  }

  /**
   * Tạo học sinh mới đồng thời phân lớp (Enrollment) trong Dexie Transaction
   */
  async createStudent(input: CreateStudentInput): Promise<{ student: Student; enrollment: ClassEnrollment }> {
    let studentCode = input.studentCode?.trim();
    if (!studentCode) {
      studentCode = await this.generateStudentCode();
    } else {
      // Check code uniqueness
      const existing = await studentRepository.findByStudentCode(studentCode);
      if (existing) {
        throw new Error(`Mã học sinh "${studentCode}" đã tồn tại trong hệ thống.`);
      }
    }

    // Validate Zod
    StudentSchema.parse({
      studentCode,
      fullName: input.fullName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      ethnicity: input.ethnicity,
      address: input.address,
      avatar: input.avatar,
      medicalNote: input.medicalNote,
    });

    const nowISO = new Date().toISOString();
    const today = getTodayDateString();

    const normalizedName = normalizeVietnameseText(input.fullName);
    const studentId = generateUUID();
    const enrollmentId = generateUUID();

    const newStudent: Student = {
      id: studentId,
      studentCode,
      fullName: input.fullName,
      normalizedName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      ethnicity: input.ethnicity,
      address: input.address,
      avatar: input.avatar,
      avatarKey: input.avatarKey ?? null,
      avatarThemeId: input.avatarThemeId ?? null,
      medicalNote: input.medicalNote,
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    const newEnrollment: ClassEnrollment = {
      id: enrollmentId,
      classId: input.classId,
      studentId,
      rollNumber: input.rollNumber,
      joinedAt: today,
      leftAt: null,
      status: 'Active',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.runTransaction('rw', [db.students, db.classEnrollments, db.auditLogs], async () => {
      await db.students.add(newStudent);
      await db.classEnrollments.add(newEnrollment);

      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'Student',
        recordId: studentId,
        action: 'CREATE',
        timestamp: nowISO,
        details: `Tạo học sinh: ${newStudent.fullName} (${newStudent.studentCode})`,
      });
    });

    return { student: newStudent, enrollment: newEnrollment };
  }

  /**
   * Cập nhật thông tin học sinh
   */
  async updateStudent(id: string, updates: Partial<CreateStudentInput>): Promise<Student | undefined> {
    const existing = await studentRepository.findById(id);
    if (!existing) return undefined;

    if (updates.studentCode && updates.studentCode !== existing.studentCode) {
      const codeExists = await studentRepository.findByStudentCode(updates.studentCode);
      if (codeExists) {
        throw new Error(`Mã học sinh "${updates.studentCode}" đã tồn tại.`);
      }
    }

    const updated = await studentRepository.update(id, {
      studentCode: updates.studentCode ?? existing.studentCode,
      fullName: updates.fullName ?? existing.fullName,
      gender: updates.gender ?? existing.gender,
      dateOfBirth: updates.dateOfBirth ?? existing.dateOfBirth,
      ethnicity: updates.ethnicity ?? existing.ethnicity,
      address: updates.address ?? existing.address,
      avatar: updates.avatar !== undefined ? updates.avatar : existing.avatar,
      avatarKey: updates.avatarKey !== undefined ? updates.avatarKey : existing.avatarKey,
      avatarThemeId: updates.avatarThemeId !== undefined ? updates.avatarThemeId : existing.avatarThemeId,
      medicalNote: updates.medicalNote ?? existing.medicalNote,
    });

    // Update roll number in active enrollment if provided
    if (updates.rollNumber !== undefined && updates.classId) {
      const activeEnrollment = await enrollmentRepository.findEnrollment(updates.classId, id);
      if (activeEnrollment) {
        await enrollmentRepository.update(activeEnrollment.id, { rollNumber: updates.rollNumber });
      }
    }

    return updated;
  }

  /**
   * Cập nhật chủ đề avatar hoặc avatar tùy chỉnh cho học sinh
   */
  async updateStudentAvatar(
    studentId: string,
    options: {
      avatarThemeId?: string | null;
      avatarKey?: string | null;
      avatar?: string | null;
    }
  ): Promise<Student | undefined> {
    const existing = await studentRepository.findById(studentId);
    if (!existing) return undefined;

    const updates: Partial<Student> = {};
    if (options.avatarThemeId !== undefined) updates.avatarThemeId = options.avatarThemeId;
    if (options.avatarKey !== undefined) updates.avatarKey = options.avatarKey;
    if (options.avatar !== undefined) updates.avatar = options.avatar || '';

    return await studentRepository.update(studentId, updates);
  }

  /**
   * Chuyển lớp cho học sinh: đóng enrollment cũ (status: 'Transferred') và mở enrollment mới (status: 'Active')
   */
  async transferStudent(
    studentId: string,
    fromClassId: string,
    toClassId: string,
    newRollNumber?: number
  ): Promise<ClassEnrollment> {
    if (fromClassId === toClassId) {
      throw new Error('Lớp chuyển đến phải khác lớp hiện tại.');
    }

    const today = getTodayDateString();
    const nowISO = new Date().toISOString();

    const newEnrollmentId = generateUUID();
    const newEnrollment: ClassEnrollment = {
      id: newEnrollmentId,
      classId: toClassId,
      studentId,
      rollNumber: newRollNumber,
      joinedAt: today,
      leftAt: null,
      status: 'Active',
      createdAt: nowISO,
      updatedAt: nowISO,
      deletedAt: null,
    };

    await db.runTransaction('rw', [db.classEnrollments, db.auditLogs], async () => {
      // 1. Close old active enrollment
      const oldEnrollment = await enrollmentRepository.findEnrollment(fromClassId, studentId);
      if (oldEnrollment) {
        await db.classEnrollments.update(oldEnrollment.id, {
          status: 'Transferred' as EnrollmentStatus,
          leftAt: today,
          updatedAt: nowISO,
        });
      }

      // 2. Add new enrollment
      await db.classEnrollments.add(newEnrollment);

      // Audit Log
      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'ClassEnrollment',
        recordId: newEnrollmentId,
        action: 'UPDATE',
        timestamp: nowISO,
        details: `Chuyển học sinh (${studentId}) sang lớp mới`,
      });
    });

    return newEnrollment;
  }

  /**
   * Soft delete học sinh (chuyển vào Thùng rác, giữ nguyên lịch sử điểm danh)
   */
  async softDeleteStudent(studentId: string): Promise<boolean> {
    return await studentRepository.softDelete(studentId);
  }

  /**
   * Xóa nhiều học sinh cùng lúc (Soft delete vào Thùng rác)
   */
  async softDeleteStudents(studentIds: string[]): Promise<{ successCount: number; failedCount: number }> {
    if (!studentIds.length) return { successCount: 0, failedCount: 0 };
    let successCount = 0;
    let failedCount = 0;

    const now = new Date().toISOString();
    await db.runTransaction('rw', [db.students, db.classEnrollments, db.auditLogs], async () => {
      for (const id of studentIds) {
        const existing = await db.students.get(id);
        if (existing && !existing.deletedAt) {
          await db.students.update(id, { deletedAt: now, updatedAt: now });
          await db.classEnrollments
            .where('studentId')
            .equals(id)
            .modify({ deletedAt: now, updatedAt: now });

          await db.auditLogs.add({
            id: generateUUID(),
            entityName: 'Student',
            recordId: id,
            action: 'DELETE',
            timestamp: now,
            details: `Xóa học sinh (hàng loạt): ${existing.fullName} (${existing.studentCode})`,
          });
          successCount++;
        } else {
          failedCount++;
        }
      }
    });

    return { successCount, failedCount };
  }

  /**
   * Khôi phục học sinh từ Thùng rác
   */
  async restoreStudent(studentId: string): Promise<boolean> {
    return await studentRepository.restore(studentId);
  }
}

export const studentService = new StudentService();

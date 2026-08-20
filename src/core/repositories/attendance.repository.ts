import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { AttendanceSession } from '../database/types';

export class AttendanceSessionRepository extends BaseRepository<AttendanceSession> {
  constructor() {
    super(db.attendanceSessions, 'AttendanceSession');
  }

  async findByClassAndDate(classId: string, sessionDate: string): Promise<AttendanceSession | undefined> {
    return await this.table
      .where('[classId+sessionDate]')
      .equals([classId, sessionDate])
      .filter((s) => !s.deletedAt)
      .first();
  }

  async findByClassId(classId: string): Promise<AttendanceSession[]> {
    return await this.table
      .filter((s) => !s.deletedAt && s.classId === classId)
      .reverse()
      .sortBy('sessionDate');
  }
}

export const attendanceSessionRepository = new AttendanceSessionRepository();

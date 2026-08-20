import { db } from '../database/db';
import type { TeacherProfile } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export class TeacherProfileRepository {
  async getProfile(): Promise<TeacherProfile | undefined> {
    const list = await db.teacherProfiles.toArray();
    return list[0];
  }

  async saveProfile(profile: Omit<TeacherProfile, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<TeacherProfile> {
    const existing = await this.getProfile();
    const now = new Date().toISOString();

    if (existing) {
      const updated: TeacherProfile = {
        ...existing,
        ...profile,
        updatedAt: now,
      };
      await db.teacherProfiles.put(updated);
      return updated;
    } else {
      const created: TeacherProfile = {
        ...profile,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.teacherProfiles.add(created);
      return created;
    }
  }
}

export const teacherProfileRepository = new TeacherProfileRepository();

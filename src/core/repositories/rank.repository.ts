import { db } from '../database/db';
import type { RankSystem, RankLevel, RankSystemClass } from '../database/types';

export class RankRepository {
  async findById(id: string): Promise<RankSystem | undefined> {
    const system = await db.rankSystems.get(id);
    if (!system || system.deletedAt) return undefined;
    return system;
  }

  async findActiveByAcademicYear(academicYearId: string): Promise<RankSystem | undefined> {
    return await db.rankSystems
      .filter((s) => s.academicYearId === academicYearId && s.isActive && !s.deletedAt)
      .first();
  }

  async findRankLevels(rankSystemId: string): Promise<RankLevel[]> {
    const levels = await db.rankLevels.where('rankSystemId').equals(rankSystemId).toArray();
    return levels
      .filter((l) => !l.deletedAt)
      .sort((a, b) => a.level - b.level);
  }

  async findRankSystemForClass(classId: string): Promise<RankSystem | undefined> {
    const relation = await db.rankSystemClasses.where('classId').equals(classId).first();
    if (relation) {
      const system = await this.findById(relation.rankSystemId);
      if (system) return system;
    }

    // Fallback: search active system for class's academic year
    const classRoom = await db.classes.get(classId);
    if (classRoom?.academicYearId) {
      return await this.findActiveByAcademicYear(classRoom.academicYearId);
    }

    return undefined;
  }

  async assignClassToRankSystem(rankSystemId: string, classId: string): Promise<RankSystemClass> {
    const existing = await db.rankSystemClasses
      .where('[rankSystemId+classId]')
      .equals([rankSystemId, classId])
      .first();

    if (existing) return existing;

    const record: RankSystemClass = {
      id: crypto.randomUUID(),
      rankSystemId,
      classId,
      createdAt: new Date().toISOString(),
    };

    await db.rankSystemClasses.add(record);
    return record;
  }
}

export const rankRepository = new RankRepository();

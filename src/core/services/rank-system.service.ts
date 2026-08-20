import { db } from '../database/db';
import type { RankSystem, RankLevel, RankCalculationScope, RankMode } from '../database/types';
import { rankRepository } from '../repositories/rank.repository';
import { rankSeedService } from './rank-seed.service';

export interface UpdateRankSystemConfigInput {
  name?: string;
  calculationScope?: RankCalculationScope;
  rankMode?: RankMode;
  celebrationEnabled?: boolean;
  presentationCelebrationEnabled?: boolean;
  isActive?: boolean;
}

export class RankSystemService {
  /**
   * Lấy hệ thống cấp bậc đang áp dụng cho lớp học
   */
  async getSystemForClass(classId: string): Promise<{ system: RankSystem; levels: RankLevel[] } | undefined> {
    const system = await rankRepository.findRankSystemForClass(classId);
    if (!system) return undefined;

    const levels = await rankRepository.findRankLevels(system.id);
    return { system, levels };
  }

  /**
   * Đảm bảo hệ thống cấp bậc thi đua cho năm học đã được khởi tạo
   */
  async ensureSystemForAcademicYear(academicYearId: string): Promise<{ system: RankSystem; levels: RankLevel[] }> {
    return await rankSeedService.seedDefaultRankSystem(academicYearId);
  }

  /**
   * Cập nhật cấu hình hệ thống cấp bậc thi đua
   */
  async updateSystemConfig(id: string, input: UpdateRankSystemConfigInput): Promise<RankSystem> {
    const existing = await rankRepository.findById(id);
    if (!existing) {
      throw new Error('Không tìm thấy hệ thống cấp bậc thi đua để cập nhật.');
    }

    const nowISO = new Date().toISOString();
    const updated: RankSystem = {
      ...existing,
      ...input,
      updatedAt: nowISO,
    };

    await db.rankSystems.put(updated);
    return updated;
  }

  /**
   * Lấy tất cả cấp bậc thuộc về 1 hệ thống
   */
  async getRankLevels(rankSystemId: string): Promise<RankLevel[]> {
    return await rankRepository.findRankLevels(rankSystemId);
  }
}

export const rankSystemService = new RankSystemService();

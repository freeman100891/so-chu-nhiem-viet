import { db } from '../database/db';
import type { HonorTitle, HonorTitleCalculationType } from '../database/types';

export interface DefaultTitleDef {
  code: string;
  name: string;
  description: string;
  calculationType: HonorTitleCalculationType;
  iconKey: string;
  badgeKey: string;
  colorToken: string;
  maxRecipients: number;
  sortOrder: number;
}

export const DEFAULT_HONOR_TITLES: DefaultTitleDef[] = [
  {
    code: 'top_rank',
    name: 'Dẫn đầu cấp bậc',
    description: 'Học sinh đạt cấp bậc và tổng điểm thi đua cao nhất lớp trong kỳ xét.',
    calculationType: 'top_rank',
    iconKey: 'trophy',
    badgeKey: 'gold_cup',
    colorToken: '#f59e0b',
    maxRecipients: 3,
    sortOrder: 1,
  },
  {
    code: 'rank_progress',
    name: 'Thăng cấp ấn tượng',
    description: 'Học sinh thăng nhiều cấp bậc thi đua nhất trong khoảng thời gian xét.',
    calculationType: 'rank_progress',
    iconKey: 'sparkles',
    badgeKey: 'rocket',
    colorToken: '#8b5cf6',
    maxRecipients: 3,
    sortOrder: 2,
  },
  {
    code: 'point_growth',
    name: 'Ngôi sao bứt phá',
    description: 'Học sinh có số điểm thi đua ròng tăng trưởng nhiều nhất trong kỳ.',
    calculationType: 'point_growth',
    iconKey: 'zap',
    badgeKey: 'shooting_star',
    colorToken: '#10b981',
    maxRecipients: 3,
    sortOrder: 3,
  },
  {
    code: 'attendance',
    name: 'Ngôi sao chuyên cần',
    description: 'Học sinh duy trì tỷ lệ đi học chuyên cần và đúng giờ xuất sắc.',
    calculationType: 'attendance',
    iconKey: 'award',
    badgeKey: 'diamond_shield',
    colorToken: '#3b82f6',
    maxRecipients: 5,
    sortOrder: 4,
  },
  {
    code: 'participation',
    name: 'Tích cực phát biểu',
    description: 'Học sinh có nhiều lượt tham gia phát biểu và tương tác sôi nổi trong lớp.',
    calculationType: 'participation',
    iconKey: 'trending_up',
    badgeKey: 'flame',
    colorToken: '#ec4899',
    maxRecipients: 3,
    sortOrder: 5,
  },
  {
    code: 'manual_teammate',
    name: 'Đồng đội tuyệt vời',
    description: 'Giáo viên đề cử: Tinh thần giúp đỡ bạn bè, tương thân tương ái và đoàn kết tập thể.',
    calculationType: 'manual',
    iconKey: 'heart',
    badgeKey: 'lotus',
    colorToken: '#f97316',
    maxRecipients: 3,
    sortOrder: 6,
  },
  {
    code: 'manual_persistence',
    name: 'Nỗ lực bền bỉ',
    description: 'Giáo viên đề cử: Chăm chỉ, kiên trì khắc phục khó khăn và rèn luyện nề nếp mỗi ngày.',
    calculationType: 'manual',
    iconKey: 'star',
    badgeKey: 'crown',
    colorToken: '#d97706',
    maxRecipients: 3,
    sortOrder: 7,
  },
  {
    code: 'self_progress',
    name: 'Gương mặt tiến bộ',
    description: 'Học sinh có sự tiến bộ vượt bậc so với kết quả của chính mình ở giai đoạn trước.',
    calculationType: 'self_progress',
    iconKey: 'sparkles',
    badgeKey: 'shooting_star',
    colorToken: '#06b6d4',
    maxRecipients: 3,
    sortOrder: 8,
  },
];

export class HonorTitleSeedService {
  private seedPromise: Promise<HonorTitle[]> | null = null;

  /**
   * Khởi tạo và tối ưu hóa 8 danh hiệu mặc định, tự động dọn dẹp các bản ghi trùng lặp
   */
  async seedDefaultTitles(): Promise<HonorTitle[]> {
    if (this.seedPromise) {
      return this.seedPromise;
    }

    this.seedPromise = this._doSeedDefaultTitles().finally(() => {
      this.seedPromise = null;
    });

    return this.seedPromise;
  }

  private async _doSeedDefaultTitles(): Promise<HonorTitle[]> {
    const allRecords = await db.honorTitles.toArray();

    // Group existing non-deleted titles by code (or name if code is missing)
    const byCode = new Map<string, HonorTitle[]>();
    const duplicateIdsToDelete: string[] = [];

    for (const item of allRecords) {
      if (item.deletedAt) continue;
      const code = item.code || item.name;
      const list = byCode.get(code) || [];
      list.push(item);
      byCode.set(code, list);
    }

    // Identify duplicates and keep only 1 canonical record per code
    const keptTitles: HonorTitle[] = [];
    for (const [, items] of byCode.entries()) {
      // Sort to keep the best one (prefer active, earliest created)
      items.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      const canonical = items[0]!;
      keptTitles.push(canonical);

      // Other duplicates are marked for deletion
      for (let i = 1; i < items.length; i++) {
        duplicateIdsToDelete.push(items[i]!.id);
      }
    }

    // If duplicate records were detected in the database, delete them cleanly
    if (duplicateIdsToDelete.length > 0) {
      await db.honorTitles.bulkDelete(duplicateIdsToDelete);
    }

    // Check if any default titles are missing and insert them
    const existingCodes = new Set(keptTitles.map((t) => t.code));
    const now = new Date().toISOString();

    for (const def of DEFAULT_HONOR_TITLES) {
      if (!existingCodes.has(def.code)) {
        const title: HonorTitle = {
          id: crypto.randomUUID(),
          code: def.code,
          name: def.name,
          description: def.description,
          calculationType: def.calculationType,
          iconKey: def.iconKey,
          badgeKey: def.badgeKey,
          colorToken: def.colorToken,
          maxRecipients: def.maxRecipients,
          isActive: true,
          sortOrder: def.sortOrder,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        await db.honorTitles.add(title);
        keptTitles.push(title);
      }
    }

    // Deduplicate and sort by sortOrder
    const finalMap = new Map<string, HonorTitle>();
    for (const t of keptTitles) {
      const key = t.code || t.name;
      if (!finalMap.has(key)) {
        finalMap.set(key, t);
      }
    }

    const result = Array.from(finalMap.values());
    result.sort((a, b) => a.sortOrder - b.sortOrder);
    return result;
  }
}

export const honorTitleSeedService = new HonorTitleSeedService();


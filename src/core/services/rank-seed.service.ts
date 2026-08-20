import { db } from '../database/db';
import type { RankLevel, RankSystem, RankGroup } from '../database/types';

export interface RankLevelDefinition {
  level: number;
  code: string;
  name: string;
  group: RankGroup;
  minPoints: number;
  colorToken: string;
  badgeKey: string;
  description: string;
}

export const DEFAULT_17_RANK_DEFINITIONS: RankLevelDefinition[] = [
  { level: 1, code: 'binh_nhi', name: 'Binh nhì', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 0, colorToken: 'bronze-1', badgeKey: 'stripes_bronze_1', description: 'Tân binh khởi đầu hành trình thi đua' },
  { level: 2, code: 'binh_nhat', name: 'Binh nhất', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 50, colorToken: 'bronze-2', badgeKey: 'stripes_bronze_2', description: 'Bắt đầu tích lũy điểm thi đua chăm chỉ' },
  { level: 3, code: 'ha_si', name: 'Hạ sĩ', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 100, colorToken: 'silver-1', badgeKey: 'stripes_silver_1', description: 'Tích cực học tập và phát biểu trên lớp' },
  { level: 4, code: 'trung_si', name: 'Trung sĩ', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 150, colorToken: 'silver-2', badgeKey: 'stripes_silver_2', description: 'Nề nếp tốt, hỗ trợ bạn bè trong tổ' },
  { level: 5, code: 'thuong_si', name: 'Thượng sĩ', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 200, colorToken: 'silver-3', badgeKey: 'stripes_silver_3', description: 'Gương mẫu trong các hoạt động của lớp' },
  { level: 6, code: 'thieu_uy', name: 'Thiếu úy', group: 'Cấp Úy', minPoints: 250, colorToken: 'blue-1', badgeKey: 'stars_silver_1', description: 'Đạt danh hiệu Cán bộ Thi đua xuất sắc' },
  { level: 7, code: 'trung_uy', name: 'Trung úy', group: 'Cấp Úy', minPoints: 300, colorToken: 'blue-2', badgeKey: 'stars_silver_2', description: 'Thành tích học tập vững vàng, tiến bộ' },
  { level: 8, code: 'thuong_uy', name: 'Thượng úy', group: 'Cấp Úy', minPoints: 350, colorToken: 'blue-3', badgeKey: 'stars_silver_3', description: 'Dẫn đầu phong trào thi đua học tốt' },
  { level: 9, code: 'dai_uy', name: 'Đại úy', group: 'Cấp Úy', minPoints: 400, colorToken: 'indigo-4', badgeKey: 'stars_silver_4', description: 'Chỉ huy thi đua xuất sắc của tập thể' },
  { level: 10, code: 'thieu_ta', name: 'Thiếu tá', group: 'Cấp Tá', minPoints: 450, colorToken: 'amber-1', badgeKey: 'stars_gold_1', description: 'Đạt mốc Vàng thi đua cấp trường' },
  { level: 11, code: 'trung_ta', name: 'Trung tá', group: 'Cấp Tá', minPoints: 500, colorToken: 'amber-2', badgeKey: 'stars_gold_2', description: 'Thành tích thi đua vô cùng rực rỡ' },
  { level: 12, code: 'thuong_ta', name: 'Thượng tá', group: 'Cấp Tá', minPoints: 550, colorToken: 'yellow-3', badgeKey: 'stars_gold_3', description: 'Học sinh tiêu biểu hàng đầu của toàn khối' },
  { level: 13, code: 'dai_ta', name: 'Đại tá', group: 'Cấp Tá', minPoints: 600, colorToken: 'yellow-4', badgeKey: 'stars_gold_4', description: 'Ngôi sao sáng trong phong trào học tập' },
  { level: 14, code: 'thieu_tuong', name: 'Thiếu tướng', group: 'Cấp Tướng', minPoints: 650, colorToken: 'purple-1', badgeKey: 'stars_platinum_1', description: 'Đạt danh hiệu Tướng Lĩnh Thi Đua cao quý' },
  { level: 15, code: 'trung_tuong', name: 'Trung tướng', group: 'Cấp Tướng', minPoints: 700, colorToken: 'purple-2', badgeKey: 'stars_platinum_2', description: 'Bản lĩnh vững vàng, phong độ đỉnh cao' },
  { level: 16, code: 'thuong_tuong', name: 'Thượng tướng', group: 'Cấp Tướng', minPoints: 750, colorToken: 'rose-3', badgeKey: 'stars_platinum_3', description: 'Học sinh xuất sắc kiệt xuất của năm học' },
  { level: 17, code: 'dai_tuong', name: 'Đại tướng', group: 'Cấp Tướng', minPoints: 800, colorToken: 'rainbow-4', badgeKey: 'stars_platinum_4', description: 'Cấp bậc Thi đua Cao nhất - Đại Tướng Học Tập' },
];

export function validateRankLevels(levels: { level: number; code: string; name: string; minPoints: number }[]): { valid: boolean; error?: string } {
  if (levels.length !== 17) {
    return { valid: false, error: `Hệ thống phải có đúng 17 cấp bậc (hiện có ${levels.length})` };
  }

  const sorted = [...levels].sort((a, b) => a.level - b.level);

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]!.level !== i + 1) {
      return { valid: false, error: `Cấp bậc không liên tục từ 1 đến 17 (lỗi tại cấp ${sorted[i]!.level})` };
    }
  }

  if (sorted[0]!.code !== 'binh_nhi' || sorted[0]!.minPoints !== 0) {
    return { valid: false, error: 'Cấp bậc 1 phải là Binh nhì có minPoints = 0' };
  }

  if (sorted[16]!.code !== 'dai_tuong') {
    return { valid: false, error: 'Cấp bậc 17 phải là Đại tướng' };
  }

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.minPoints <= sorted[i - 1]!.minPoints) {
      return { valid: false, error: `Ngưỡng điểm phải tăng nghiêm ngặt (lỗi giữa ${sorted[i - 1]!.name} và ${sorted[i]!.name})` };
    }
  }

  const codes = new Set(levels.map((l) => l.code));
  if (codes.size !== 17) {
    return { valid: false, error: 'Phát hiện mã cấp bậc (code) bị trùng lặp' };
  }

  const names = new Set(levels.map((l) => l.name));
  if (names.size !== 17) {
    return { valid: false, error: 'Phát hiện tên cấp bậc (name) bị trùng lặp' };
  }

  return { valid: true };
}

class RankSeedService {
  /**
   * Khởi tạo hệ thống cấp bậc thi đua mặc định cho năm học
   */
  async seedDefaultRankSystem(academicYearId: string, name = 'Hệ thống Cấp bậc Thi đua Quân đội Học đường'): Promise<{ system: RankSystem; levels: RankLevel[] }> {
    const existing = await db.rankSystems
      .filter((s) => s.academicYearId === academicYearId && s.isActive && !s.deletedAt)
      .first();

    if (existing) {
      const existingLevels = await db.rankLevels.where('rankSystemId').equals(existing.id).toArray();
      return { system: existing, levels: existingLevels };
    }

    const nowISO = new Date().toISOString();
    const systemId = crypto.randomUUID();

    const system: RankSystem = {
      id: systemId,
      name,
      academicYearId,
      termId: null,
      calculationScope: 'academic_year',
      rankMode: 'achievement',
      celebrationEnabled: true,
      presentationCelebrationEnabled: true,
      isActive: true,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const levels: RankLevel[] = DEFAULT_17_RANK_DEFINITIONS.map((def) => ({
      id: crypto.randomUUID(),
      rankSystemId: systemId,
      level: def.level,
      code: def.code,
      name: def.name,
      group: def.group,
      minPoints: def.minPoints,
      colorToken: def.colorToken,
      badgeKey: def.badgeKey,
      description: def.description,
      createdAt: nowISO,
      updatedAt: nowISO,
    }));

    // Validate 17 ranks before inserting
    const validation = validateRankLevels(levels);
    if (!validation.valid) {
      throw new Error(`Khởi tạo Cấp bậc thi đua thất bại: ${validation.error}`);
    }

    await db.runTransaction('rw', [db.rankSystems, db.rankLevels], async () => {
      await db.rankSystems.add(system);
      await db.rankLevels.bulkAdd(levels);
    });

    return { system, levels };
  }
}

export const rankSeedService = new RankSeedService();

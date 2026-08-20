import type {
  AvatarTheme,
  AvatarProgressLevel,
  AvatarLevelThreshold,
  AvatarLevelDefinition,
  AvatarImageRef,
  GlobalAvatarSystemSettings,
  ResolvedStudentAvatar,
  StudentAvatarPresentation,
} from '../types/avatar-theme.types';
import type { Student, UserSettings } from '../database/types';
import { avatarCatalogService } from './avatar-catalog.service';
import { avatarCardThemeService, DEFAULT_5_LEVEL_CARD_PALETTE } from './avatar-card-theme.service';

/**
 * Ngưỡng điểm tiến trình 5 cấp độ toàn cục mặc định (CHANGE-RANK-001 & FEAT-AVATAR-001)
 */
export const DEFAULT_AVATAR_LEVEL_THRESHOLDS: readonly [
  AvatarLevelThreshold,
  AvatarLevelThreshold,
  AvatarLevelThreshold,
  AvatarLevelThreshold,
  AvatarLevelThreshold
] = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 100 },
  { level: 3, minPoints: 300 },
  { level: 4, minPoints: 600 },
  { level: 5, minPoints: 1000 },
] as const;

export const DEFAULT_AVATAR_THEME_ID = 'military';

/**
 * Cấu hình Hệ thống Avatar 5 cấp độ toàn cục mặc định (FEAT-AVATAR-001)
 */
export const DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS: GlobalAvatarSystemSettings = {
  scope: 'GLOBAL',
  enabled: true,
  presetThemeId: 'military',
  levels: [
    {
      level: 1,
      minPoints: 0,
      name: 'Khởi đầu',
      shortLabel: 'Cấp 1',
      description: 'Bắt đầu hành trình rèn luyện nề nếp và tích lũy điểm thi đua.',
      image: { kind: 'BUILT_IN', assetKey: 'military/military-stage-1' },
      cardBaseColor: DEFAULT_5_LEVEL_CARD_PALETTE[0],
    },
    {
      level: 2,
      minPoints: 100,
      name: 'Tiến bộ',
      shortLabel: 'Cấp 2',
      description: 'Chăm chỉ phát biểu, hoàn thành tốt nhiệm vụ học tập trên lớp.',
      image: { kind: 'BUILT_IN', assetKey: 'military/military-stage-2' },
      cardBaseColor: DEFAULT_5_LEVEL_CARD_PALETTE[1],
    },
    {
      level: 3,
      minPoints: 300,
      name: 'Bứt phá',
      shortLabel: 'Cấp 3',
      description: 'Thành tích nổi bật, gương mẫu và tích cực tham gia hoạt động.',
      image: { kind: 'BUILT_IN', assetKey: 'military/military-stage-3' },
      cardBaseColor: DEFAULT_5_LEVEL_CARD_PALETTE[2],
    },
    {
      level: 4,
      minPoints: 600,
      name: 'Xuất sắc',
      shortLabel: 'Cấp 4',
      description: 'Kỷ luật vững vàng, dẫn đầu phong trào thi đua học tập của lớp.',
      image: { kind: 'BUILT_IN', assetKey: 'military/military-stage-4' },
      cardBaseColor: DEFAULT_5_LEVEL_CARD_PALETTE[3],
    },
    {
      level: 5,
      minPoints: 1000,
      name: 'Vinh quang',
      shortLabel: 'Cấp 5',
      description: 'Thành tích xuất sắc toàn diện, tấm gương sáng ngời cho cả lớp.',
      image: { kind: 'BUILT_IN', assetKey: 'military/military-stage-5' },
      cardBaseColor: DEFAULT_5_LEVEL_CARD_PALETTE[4],
    },
  ],
  progressionPolicy: 'HIGHEST_UNLOCKED',
  revision: 1,
  updatedAt: new Date().toISOString(),
};

/**
 * Phân giải Avatar Level 1..5 trực tiếp từ điểm thành tích
 */
export function resolveAvatarProgressLevelFromScore(
  score?: number | null,
  thresholds: readonly AvatarLevelThreshold[] | AvatarLevelThreshold[] = DEFAULT_AVATAR_LEVEL_THRESHOLDS
): AvatarProgressLevel {
  if (score === null || score === undefined || typeof score !== 'number' || isNaN(score) || score <= 0) {
    return 1;
  }

  const sortedThresholds = [...thresholds].sort((a, b) => b.minPoints - a.minPoints);

  for (const t of sortedThresholds) {
    if (score >= t.minPoints) {
      return t.level;
    }
  }

  return 1;
}

/**
 * Helper tương thích ngược (Legacy Compatibility)
 */
export function resolveAvatarProgressLevel(rankLevelOrOrder?: number | null): AvatarProgressLevel {
  if (!rankLevelOrOrder || typeof rankLevelOrOrder !== 'number' || rankLevelOrOrder <= 0) {
    return 1;
  }

  if (rankLevelOrOrder <= 3) return 1;
  if (rankLevelOrOrder <= 7) return 2;
  if (rankLevelOrOrder <= 10) return 3;
  if (rankLevelOrOrder <= 14) return 4;
  return 5;
}

export const AVATAR_THEMES: readonly AvatarTheme[] = [
  {
    id: 'military',
    name: 'Quân đội Thi đua',
    description: 'Hành trình rèn luyện nề nếp từ Tân binh tới Thống lĩnh kiên cường.',
    previewAssetKey: 'military/military-stage-1',
    active: true,
    stages: [
      {
        level: 1,
        name: 'Tân binh',
        assetKey: 'military/military-stage-1',
        altText: 'Avatar Quân đội Cấp 1 - Tân binh',
        description: 'Tân binh năng động, chăm ngoan rèn luyện nề nếp đầu tiên.',
      },
      {
        level: 2,
        name: 'Chiến sĩ',
        assetKey: 'military/military-stage-2',
        altText: 'Avatar Quân đội Cấp 2 - Chiến sĩ',
        description: 'Chiến sĩ kiên trì, tích cực phát biểu và hoàn thành bài vở.',
      },
      {
        level: 3,
        name: 'Đội trưởng',
        assetKey: 'military/military-stage-3',
        altText: 'Avatar Quân đội Cấp 3 - Đội trưởng',
        description: 'Đội trưởng gương mẫu, sẵn sàng dẫn dắt và giúp đỡ bạn bè.',
      },
      {
        level: 4,
        name: 'Chỉ huy',
        assetKey: 'military/military-stage-4',
        altText: 'Avatar Quân đội Cấp 4 - Chỉ huy',
        description: 'Chỉ huy tài ba, kỷ luật xuất sắc và dẫn đầu thi đua.',
      },
      {
        level: 5,
        name: 'Thống lĩnh',
        assetKey: 'military/military-stage-5',
        altText: 'Avatar Quân đội Cấp 5 - Thống lĩnh',
        description: 'Thống lĩnh vinh quang, tấm gương sáng ngời toàn diện của lớp.',
      },
    ],
  },
  {
    id: 'plant_growth',
    name: 'Phát triển của Cây',
    description: 'Quá trình gieo hạt tri thức từ Mầm non thành Cây đại thụ tỏa sáng.',
    previewAssetKey: 'plant/plant-stage-1',
    active: true,
    stages: [
      {
        level: 1,
        name: 'Hạt mầm',
        assetKey: 'plant/plant-stage-1',
        altText: 'Avatar Quá trình Cây Cấp 1 - Hạt mầm',
        description: 'Hạt giống chăm chỉ đang ấp ủ những ước mơ tri thức đầu tiên.',
      },
      {
        level: 2,
        name: 'Mầm non',
        assetKey: 'plant/plant-stage-2',
        altText: 'Avatar Quá trình Cây Cấp 2 - Mầm non',
        description: 'Chồi non xanh mướt vươn mình đón ánh nắng học tập mỗi ngày.',
      },
      {
        level: 3,
        name: 'Cây nhỏ',
        assetKey: 'plant/plant-stage-3',
        altText: 'Avatar Quá trình Cây Cấp 3 - Cây nhỏ',
        description: 'Cây nhỏ vững vàng với những tán lá xanh và hoa thơm chớm nở.',
      },
      {
        level: 4,
        name: 'Cây lớn',
        assetKey: 'plant/plant-stage-4',
        altText: 'Avatar Quá trình Cây Cấp 4 - Cây lớn',
        description: 'Cây lớn xum xuê đơm hoa kết trái từ công sức học tập.',
      },
      {
        level: 5,
        name: 'Cây đại thụ',
        assetKey: 'plant/plant-stage-5',
        altText: 'Avatar Quá trình Cây Cấp 5 - Cây đại thụ',
        description: 'Cây đại thụ tỏa bóng mát, biểu tượng của tri thức vững bền.',
      },
    ],
  },
  {
    id: 'royal_journey',
    name: 'Hành trình Vương triều',
    description: 'Con đường phấn đấu học tập từ Tập sự trở thành Vương quyền tôn quý.',
    previewAssetKey: 'royal/royal-stage-1',
    active: true,
    stages: [
      {
        level: 1,
        name: 'Tập sự',
        assetKey: 'royal/royal-stage-1',
        altText: 'Avatar Vương triều Cấp 1 - Tập sự',
        description: 'Người tập sự bắt đầu rèn luyện lễ phép và nỗ lực học hỏi.',
      },
      {
        level: 2,
        name: 'Hầu cận',
        assetKey: 'royal/royal-stage-2',
        altText: 'Avatar Vương triều Cấp 2 - Hầu cận',
        description: 'Hầu cận tận tụy, luôn trung thực và hăng hái xây dựng bài.',
      },
      {
        level: 3,
        name: 'Hiệp sĩ',
        assetKey: 'royal/royal-stage-3',
        altText: 'Avatar Vương triều Cấp 3 - Hiệp sĩ',
        description: 'Hiệp sĩ dũng cảm, luôn bảo vệ lẽ phải và tương trợ bạn bè.',
      },
      {
        level: 4,
        name: 'Quý tộc',
        assetKey: 'royal/royal-stage-4',
        altText: 'Avatar Vương triều Cấp 4 - Quý tộc',
        description: 'Quý tộc nho nhã, giữ gìn phong thái tự tin và thành tích tốt.',
      },
      {
        level: 5,
        name: 'Vương quyền',
        assetKey: 'royal/royal-stage-5',
        altText: 'Avatar Vương triều Cấp 5 - Vương quyền',
        description: 'Vương miện danh dự tôn vinh trí tuệ và phẩm chất cao quý.',
      },
    ],
  },
  {
    id: 'gamer_rank',
    name: 'Cấp bậc Game thủ',
    description: 'Thử thách leo rank thú vị từ Cấp Tập sự tiến tới Kim Cương rực rỡ.',
    previewAssetKey: 'gamer/gamer-stage-1',
    active: true,
    stages: [
      {
        level: 1,
        name: 'Tập sự',
        assetKey: 'gamer/gamer-stage-1',
        altText: 'Avatar Game thủ Cấp 1 - Tập sự',
        description: 'Game thủ tập sự bắt đầu làm quen với luật chơi và nỗ lực cày điểm.',
      },
      {
        level: 2,
        name: 'Đồng',
        assetKey: 'gamer/gamer-stage-2',
        altText: 'Avatar Game thủ Cấp 2 - Đồng',
        description: 'Rank Đồng bền bỉ, từng bước vượt qua các thử thách bài tập.',
      },
      {
        level: 3,
        name: 'Bạc',
        assetKey: 'gamer/gamer-stage-3',
        altText: 'Avatar Game thủ Cấp 3 - Bạc',
        description: 'Rank Bạc sắc sảo, phản xạ nhanh và liên tục phát biểu ghi điểm.',
      },
      {
        level: 4,
        name: 'Vàng',
        assetKey: 'gamer/gamer-stage-4',
        altText: 'Avatar Game thủ Cấp 4 - Vàng',
        description: 'Rank Vàng xuất chúng, giữ vững phong độ đỉnh cao của lớp.',
      },
      {
        level: 5,
        name: 'Kim Cương',
        assetKey: 'gamer/gamer-stage-5',
        altText: 'Avatar Game thủ Cấp 5 - Kim Cương',
        description: 'Huyền thoại Kim Cương, biểu tượng hoàn hảo của lớp học.',
      },
    ],
  },
];

export class AvatarThemeRegistry {
  private themes: Map<string, AvatarTheme> = new Map();

  constructor() {
    AVATAR_THEMES.forEach((theme) => {
      this.themes.set(theme.id, theme);
    });
  }

  getActiveThemes(): AvatarTheme[] {
    return Array.from(this.themes.values()).filter((t) => t.active);
  }

  getThemeById(themeId: string): AvatarTheme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Tạo 5 level definitions hoàn chỉnh từ một theme preset đã chọn
   * Có tùy chọn keepCustomImages để giữ lại hình ảnh tùy chỉnh đã tải lên của các cấp
   */
  getPresetThemeLevelDefinitions(
    themeId: string,
    baseThresholds: readonly AvatarLevelThreshold[] = DEFAULT_AVATAR_LEVEL_THRESHOLDS,
    options?: {
      keepCustomImages?: boolean;
      currentLevels?: readonly AvatarLevelDefinition[];
      savedCustomImagesByLevel?: Partial<Record<AvatarProgressLevel, AvatarImageRef>>;
    }
  ): AvatarLevelDefinition[] {
    const theme = this.getThemeById(themeId) || this.themes.get(DEFAULT_AVATAR_THEME_ID)!;
    const colors = DEFAULT_5_LEVEL_CARD_PALETTE;

    return theme.stages.map((stage, idx) => {
      const threshold = baseThresholds.find((t) => t.level === stage.level) || baseThresholds[idx]!;
      const currentLevelDef = options?.currentLevels?.find((l) => l.level === stage.level);
      const savedCustomImage = options?.savedCustomImagesByLevel?.[stage.level];

      let image: AvatarImageRef = {
        kind: 'BUILT_IN',
        assetKey: stage.assetKey,
      };

      if (options?.keepCustomImages) {
        if (currentLevelDef?.image.kind === 'UPLOADED') {
          image = currentLevelDef.image;
        } else if (savedCustomImage && savedCustomImage.kind === 'UPLOADED') {
          image = savedCustomImage;
        }
      }

      return {
        level: stage.level,
        minPoints: threshold.minPoints,
        name: stage.name,
        shortLabel: `Cấp ${stage.level}`,
        description: stage.description,
        image,
        cardBaseColor: colors[idx]!,
      };
    });
  }

  /**
   * Phân giải Trọn gói Presentation View Model cho Học sinh (Avatar + Label + Card Theme)
   * Đây là SINGLE SOURCE OF TRUTH dùng chung cho toàn bộ components (FEAT-AVATAR-001).
   */
  resolveStudentAvatarPresentation(options: {
    student: Student;
    score?: number | null;
    avatarLevel?: AvatarProgressLevel | null;
    globalSettings?: GlobalAvatarSystemSettings | null;
    uploadedAssetUrls?: Map<string, string>;
  }): StudentAvatarPresentation {
    const { student, score = 0, avatarLevel, globalSettings, uploadedAssetUrls } = options;
    const settings = globalSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
    const levels = settings.levels;

    // 1. Phân giải current level (1..5)
    let currentLevel: AvatarProgressLevel = 1;
    if (avatarLevel && avatarLevel >= 1 && avatarLevel <= 5) {
      currentLevel = avatarLevel;
    } else {
      const thresholds = levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));
      currentLevel = resolveAvatarProgressLevelFromScore(score, thresholds);
    }

    // 2. Lấy đúng Level Definition tương ứng
    const levelDef = levels.find((l) => l.level === currentLevel) || levels[0]!;

    // 3. Phân giải Asset Image (Built-in hoặc Uploaded)
    let assetUrl = '';
    let assetKey = '';
    let isUploaded = false;

    if (levelDef.image.kind === 'UPLOADED') {
      isUploaded = true;
      assetKey = levelDef.image.assetId;
      assetUrl = uploadedAssetUrls?.get(levelDef.image.assetId) || '';
    }

    if (!assetUrl) {
      // Built-in or fallback
      const key = levelDef.image.kind === 'BUILT_IN' ? levelDef.image.assetKey : `military/military-stage-${currentLevel}`;
      assetKey = key;
      const catalogItem = avatarCatalogService.getItemByKey(key);
      assetUrl = catalogItem?.assetUrl || avatarCatalogService.getDefaultAvatarUrl();
    }

    // 4. Sinh deterministic Card Theme từ cardBaseColor
    const cardTheme = avatarCardThemeService.generateCardThemeFromBaseColor(levelDef.cardBaseColor, currentLevel);

    // 5. Tính toán tiến trình lên cấp kế tiếp
    const nextLevelDef = levels.find((l) => l.level === currentLevel + 1);
    const nextLevelMinPoints = nextLevelDef?.minPoints;
    const pointsToNextLevel = nextLevelMinPoints !== undefined ? Math.max(0, nextLevelMinPoints - (score || 0)) : undefined;

    return {
      studentId: student.id,
      level: currentLevel,
      levelName: levelDef.name,
      levelShortLabel: levelDef.shortLabel || `Cấp ${currentLevel}`,
      levelDescription: levelDef.description,
      minPoints: levelDef.minPoints,
      nextLevelMinPoints,
      pointsToNextLevel,
      avatarAsset: {
        assetKey,
        assetUrl,
        altText: `Avatar Cấp ${currentLevel} - ${levelDef.name}`,
        isUploaded,
        isFallback: !assetUrl,
      },
      cardTheme,
    };
  }

  /**
   * Tính toán nhanh tác động phân bổ học sinh khi thay đổi ngưỡng điểm (Threshold Impact Preview)
   */
  calculateThresholdImpact(
    students: Student[],
    studentPointsMap: Map<string, number>,
    currentThresholds: readonly AvatarLevelThreshold[] | AvatarLevelThreshold[],
    newThresholds: readonly AvatarLevelThreshold[] | AvatarLevelThreshold[]
  ): {
    currentDistribution: Record<AvatarProgressLevel, number>;
    projectedDistribution: Record<AvatarProgressLevel, number>;
    changedCount: number;
  } {
    const currentDistribution: Record<AvatarProgressLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const projectedDistribution: Record<AvatarProgressLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let changedCount = 0;

    for (const st of students) {
      if (st.deletedAt) continue;
      const score = studentPointsMap.get(st.id) || 0;
      const curLvl = resolveAvatarProgressLevelFromScore(score, currentThresholds);
      const newLvl = resolveAvatarProgressLevelFromScore(score, newThresholds);

      currentDistribution[curLvl] = (currentDistribution[curLvl] || 0) + 1;
      projectedDistribution[newLvl] = (projectedDistribution[newLvl] || 0) + 1;

      if (curLvl !== newLvl) {
        changedCount++;
      }
    }

    return {
      currentDistribution,
      projectedDistribution,
      changedCount,
    };
  }

  /**
   * Chuẩn hóa nạp GlobalAvatarSystemSettings từ UserSettings
   */
  resolveGlobalSettings(settings?: UserSettings | null): GlobalAvatarSystemSettings {
    if (settings?.avatarSystemSettings && settings.avatarSystemSettings.levels?.length === 5) {
      return settings.avatarSystemSettings;
    }
    if (settings?.activeAvatarThemeId) {
      const presetLevels = this.getPresetThemeLevelDefinitions(settings.activeAvatarThemeId);
      return {
        ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
        presetThemeId: settings.activeAvatarThemeId,
        levels: presetLevels,
      };
    }
    return DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
  }

  /**
   * Helper ViewModel Resolver (Unified & Synchronized with Settings)
   */
  resolveStudentAvatarViewModel(options: {
    globalActiveThemeId?: string | null;
    globalSettings?: GlobalAvatarSystemSettings | null;
    uploadedAssetUrls?: Map<string, string>;
    avatarThemeId?: string | null;
    avatarKey?: string | null;
    customAvatar?: string | null;
    defaultAvatarKey?: string | null;
    score?: number | null;
    avatarLevel?: AvatarProgressLevel | null;
    rankLevelOrOrder?: number | null;
    preferRankAvatar?: boolean;
  }): ResolvedStudentAvatar {
    const settings = options.globalSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
    const activeThemeId = options.globalActiveThemeId || settings.presetThemeId || options.avatarThemeId || DEFAULT_AVATAR_THEME_ID;
    const theme = this.getThemeById(activeThemeId) || this.themes.get(DEFAULT_AVATAR_THEME_ID)!;

    // Check if customAvatar is an actual photo (Base64 data URI, blob, or web URL)
    const isRealCustomPhoto =
      typeof options.customAvatar === 'string' &&
      options.customAvatar.trim().length > 0 &&
      (options.customAvatar.startsWith('data:image/') ||
        options.customAvatar.startsWith('blob:') ||
        options.customAvatar.startsWith('http://') ||
        options.customAvatar.startsWith('https://') ||
        options.customAvatar.startsWith('/'));

    // 1. Explicit custom portrait photo (base64 / URL), unless preferRankAvatar is requested
    if (!options.preferRankAvatar && isRealCustomPhoto) {
      return {
        themeId: 'custom',
        themeName: 'Tùy chỉnh',
        level: 1,
        stageName: 'Tùy chỉnh',
        assetKey: 'custom',
        assetUrl: options.customAvatar!,
        altText: 'Avatar tùy chỉnh',
        isFallback: false,
        isLegacy: true,
      };
    }

    // 2. 5-Level Avatar System (Central Theme & Progression)
    let targetLevel: AvatarProgressLevel = 1;
    if (options.avatarLevel && options.avatarLevel >= 1 && options.avatarLevel <= 5) {
      targetLevel = options.avatarLevel;
    } else if (options.score !== undefined && options.score !== null) {
      const thresholds = settings.levels ? settings.levels.map((l) => ({ level: l.level, minPoints: l.minPoints })) : DEFAULT_AVATAR_LEVEL_THRESHOLDS;
      targetLevel = resolveAvatarProgressLevelFromScore(options.score, thresholds);
    } else if (options.rankLevelOrOrder) {
      targetLevel = resolveAvatarProgressLevel(options.rankLevelOrOrder);
    }

    const levelDef = settings.levels?.find((l) => l.level === targetLevel);
    let assetUrl = '';
    let assetKey = '';

    // Check custom uploaded asset for this level
    if (levelDef && levelDef.image.kind === 'UPLOADED') {
      assetKey = levelDef.image.assetId;
      assetUrl = options.uploadedAssetUrls?.get(levelDef.image.assetId) || '';
    }

    // Check built-in preset theme stage for this level
    if (!assetUrl) {
      const stage = theme.stages.find((s) => s.level === targetLevel) || theme.stages[0]!;
      const key = (levelDef?.image.kind === 'BUILT_IN' && levelDef.image.assetKey) ? levelDef.image.assetKey : stage.assetKey;
      assetKey = key;
      const catalogItem = avatarCatalogService.getItemByKey(key);
      assetUrl = catalogItem?.assetUrl || '';
    }

    if (assetUrl) {
      const stageName = levelDef?.name || theme.stages.find((s) => s.level === targetLevel)?.name || `Cấp ${targetLevel}`;
      return {
        themeId: theme.id,
        themeName: theme.name,
        level: targetLevel,
        stageName,
        assetKey,
        assetUrl,
        altText: levelDef?.description || `Avatar Cấp ${targetLevel}`,
        isFallback: false,
        isLegacy: false,
      };
    }

    // 3. Fallback to explicit custom photo if not previously returned
    if (isRealCustomPhoto) {
      return {
        themeId: 'custom',
        themeName: 'Tùy chỉnh',
        level: 1,
        stageName: 'Tùy chỉnh',
        assetKey: 'custom',
        assetUrl: options.customAvatar!,
        altText: 'Avatar tùy chỉnh',
        isFallback: false,
        isLegacy: true,
      };
    }

    // 4. Fallback to explicit avatarKey if 5-level did not resolve
    if (options.avatarKey && options.avatarKey.trim().length > 0) {
      const catalogItem = avatarCatalogService.getItemByKey(options.avatarKey);
      if (catalogItem) {
        return {
          themeId: 'legacy',
          themeName: 'Thư viện',
          level: 1,
          stageName: catalogItem.label || 'Avatar',
          assetKey: options.avatarKey,
          assetUrl: catalogItem.assetUrl,
          altText: catalogItem.label || 'Avatar học sinh',
          isFallback: false,
          isLegacy: true,
        };
      }
    }

    // 5. Default fallback
    const defaultUrl = avatarCatalogService.getDefaultAvatarUrl();
    return {
      themeId: theme.id,
      themeName: theme.name,
      level: targetLevel,
      stageName: `Cấp ${targetLevel}`,
      assetKey: options.defaultAvatarKey || 'default/default-boy',
      assetUrl: defaultUrl,
      altText: 'Avatar học sinh',
      isFallback: true,
      isLegacy: false,
    };
  }
}

export const avatarThemeRegistry = new AvatarThemeRegistry();

export type AvatarProgressLevel = 1 | 2 | 3 | 4 | 5;

export interface AvatarLevelThreshold {
  level: AvatarProgressLevel;
  minPoints: number;
}

export type AvatarImageRef =
  | {
      kind: 'BUILT_IN';
      assetKey: string;
    }
  | {
      kind: 'UPLOADED';
      assetId: string;
    };

export interface AvatarLevelDefinition {
  level: AvatarProgressLevel;
  minPoints: number;
  name: string;
  shortLabel: string;
  description: string;
  image: AvatarImageRef;
  cardBaseColor: string;
}

export interface AvatarStage {
  level: AvatarProgressLevel;
  name: string;
  assetKey: string;
  altText: string;
  description: string;
}

export interface AvatarTheme {
  id: string;
  name: string;
  description: string;
  previewAssetKey: string;
  stages: readonly [
    AvatarStage,
    AvatarStage,
    AvatarStage,
    AvatarStage,
    AvatarStage
  ];
  active: boolean;
}

export interface GlobalAvatarProgressionSettings {
  scope: 'GLOBAL';
  enabled: boolean;
  activeThemeId: string;
  levelThresholds: readonly [
    AvatarLevelThreshold,
    AvatarLevelThreshold,
    AvatarLevelThreshold,
    AvatarLevelThreshold,
    AvatarLevelThreshold
  ];
  progressionPolicy: 'HIGHEST_UNLOCKED' | 'CURRENT_SCORE';
  revision: number;
  updatedAt: string;
}

export interface GlobalAvatarSystemSettings {
  scope: 'GLOBAL';
  enabled: boolean;
  presetThemeId?: string;
  levels: readonly [
    AvatarLevelDefinition,
    AvatarLevelDefinition,
    AvatarLevelDefinition,
    AvatarLevelDefinition,
    AvatarLevelDefinition
  ];
  progressionPolicy: 'HIGHEST_UNLOCKED' | 'CURRENT_SCORE';
  savedCustomImagesByLevel?: Partial<Record<AvatarProgressLevel, AvatarImageRef>>;
  celebrationSettings?: LevelUpCelebrationSettings;
  revision: number;
  updatedAt: string;
}

export interface AvatarCardTheme {
  key: string;
  baseColor: string;
  surfaceStart: string;
  surfaceEnd: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;
  avatarRing: string;
  focusRing: string;
  shadow: string;
  isDark: boolean;
  contrastRatio: number;
  contrastPassed: boolean;
}

export interface ResolvedAvatarAsset {
  assetKey: string;
  assetUrl: string;
  altText: string;
  isUploaded: boolean;
  isFallback: boolean;
}

export interface ResolvedStudentAvatar {
  themeId: string;
  themeName: string;
  level: AvatarProgressLevel;
  stageName: string;
  assetKey: string;
  assetUrl: string;
  altText: string;
  isFallback: boolean;
  isLegacy: boolean;
}

export interface StudentAvatarPresentation {
  studentId: string;
  level: AvatarProgressLevel;
  levelName: string;
  levelShortLabel: string;
  levelDescription: string;
  minPoints: number;
  nextLevelMinPoints?: number;
  pointsToNextLevel?: number;
  avatarAsset: ResolvedAvatarAsset;
  cardTheme: AvatarCardTheme;
}

export type LevelUpCelebrationMode = 'AUTOMATIC' | 'MANUAL' | 'OFF';
export type LevelUpCelebrationIntensity = 'FULL' | 'BALANCED' | 'MINIMAL';

export interface LevelUpCelebrationSettings {
  enabled: boolean;
  mode: LevelUpCelebrationMode;
  intensity: LevelUpCelebrationIntensity;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  durationMs: number;
  maxAutomaticSequence: number;
  showLevelUp?: boolean;
  showLevelDown?: boolean;
  levelDownTarget?: 'CONTROLLER_ONLY' | 'PRESENTATION_ALLOWED';
  revision?: number;
}

export const DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS: LevelUpCelebrationSettings = {
  enabled: true,
  mode: 'AUTOMATIC',
  intensity: 'BALANCED',
  soundEnabled: true,
  confettiEnabled: true,
  durationMs: 5200,
  maxAutomaticSequence: 5,
  showLevelUp: true,
  showLevelDown: true,
  levelDownTarget: 'CONTROLLER_ONLY',
  revision: 1,
};

export type LevelChangeDirection = 'UP' | 'DOWN' | 'UNCHANGED';

export interface DirectLevelChangeNotification {
  notificationId: string;
  mutationId: string;
  studentId: string;
  studentDisplayName: string;
  studentCode?: string;
  classId: string;
  liveSessionId?: string | null;
  direction: 'UP' | 'DOWN';
  previousScore: number;
  currentScore: number;
  fromLevelId: AvatarProgressLevel;
  toLevelId: AvatarProgressLevel;
  previousLevel: LevelPresentationSnapshot;
  currentLevel: LevelPresentationSnapshot;
  levelsChanged: number;
  settingsRevision: number;
  createdAt: string;
  preferredTarget: 'PRESENTATION' | 'CONTROLLER' | 'LOCAL_FALLBACK';
}

export interface ImmediateLevelChangeModalSettings {
  enabled: boolean;
  showLevelUp: boolean;
  showLevelDown: boolean;
  levelDownTarget: 'CONTROLLER_ONLY' | 'PRESENTATION_ALLOWED';
  intensity: LevelUpCelebrationIntensity;
  durationMs: number;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  revision: number;
}

export const DEFAULT_IMMEDIATE_LEVEL_CHANGE_SETTINGS: ImmediateLevelChangeModalSettings = {
  enabled: true,
  showLevelUp: true,
  showLevelDown: true,
  levelDownTarget: 'CONTROLLER_ONLY',
  intensity: 'BALANCED',
  durationMs: 5200,
  soundEnabled: true,
  confettiEnabled: true,
  revision: 1,
};

export type LevelUpCelebrationStatus =
  | 'PENDING'
  | 'PRESENTING'
  | 'PRESENTED'
  | 'SKIPPED'
  | 'EXPIRED'
  | 'FAILED';

export interface LevelPresentationSnapshot {
  levelId: AvatarProgressLevel;
  levelName: string;
  levelShortLabel: string;
  levelDescription?: string;
  avatarAssetId?: string;
  avatarAssetKey?: string;
  avatarAssetUrl?: string;
  cardBaseColor: string;
  cardTheme: AvatarCardTheme;
}

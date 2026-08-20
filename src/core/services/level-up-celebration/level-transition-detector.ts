import type { Student } from '../../database/types';
import type {
  AvatarProgressLevel,
  GlobalAvatarSystemSettings,
  LevelPresentationSnapshot,
  LevelChangeDirection,
  DirectLevelChangeNotification,
} from '../../types/avatar-theme.types';
import {
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
  resolveAvatarProgressLevelFromScore,
  avatarThemeRegistry,
} from '../avatar-theme-registry';

export interface DetectLevelTransitionParams {
  previousScore: number;
  currentScore: number;
  student: Student;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  classId?: string;
  liveSessionId?: string | null;
  mutationId?: string;
}

export interface LevelTransitionResult {
  direction: 'UP' | 'DOWN';
  fromLevelId: AvatarProgressLevel;
  toLevelId: AvatarProgressLevel;
  levelsChanged: number;
  levelsGained: number; // backward compatibility
  fromLevel: LevelPresentationSnapshot;
  toLevel: LevelPresentationSnapshot;
  settingsRevision: number;
}

/**
 * Phân loại hướng thay đổi cấp bậc (UP, DOWN, UNCHANGED)
 */
export function classifyLevelChange(
  previousLevelId: AvatarProgressLevel,
  currentLevelId: AvatarProgressLevel
): LevelChangeDirection {
  if (currentLevelId > previousLevelId) return 'UP';
  if (currentLevelId < previousLevelId) return 'DOWN';
  return 'UNCHANGED';
}

/**
 * Pure detector phân giải chuyển cấp Avatar 5 cấp độ khi có biến động điểm thành tích.
 * Hỗ trợ cả 2 hướng: Thăng cấp (UP) và Giảm cấp (DOWN).
 * Trả về null khi cấp bậc không thay đổi (UNCHANGED).
 */
export function detectLevelTransition({
  previousScore,
  currentScore,
  student,
  globalSettings,
  uploadedAssetUrls,
}: DetectLevelTransitionParams): LevelTransitionResult | null {
  const activeSettings = globalSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
  const thresholds = activeSettings.levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));

  const fromLevelId = resolveAvatarProgressLevelFromScore(previousScore, thresholds);
  const toLevelId = resolveAvatarProgressLevelFromScore(currentScore, thresholds);

  const direction = classifyLevelChange(fromLevelId, toLevelId);
  if (direction === 'UNCHANGED') {
    return null;
  }

  // Resolve presentation cho cả 2 trạng thái từ cùng revision
  const fromPresentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
    student,
    score: previousScore,
    globalSettings: activeSettings,
    uploadedAssetUrls,
  });

  const toPresentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
    student,
    score: currentScore,
    globalSettings: activeSettings,
    uploadedAssetUrls,
  });

  const fromDef = activeSettings.levels.find((l) => l.level === fromLevelId) || activeSettings.levels[0]!;
  const toDef = activeSettings.levels.find((l) => l.level === toLevelId) || activeSettings.levels[activeSettings.levels.length - 1]!;

  const fromLevelSnapshot: LevelPresentationSnapshot = {
    levelId: fromLevelId,
    levelName: fromPresentation.levelName,
    levelShortLabel: fromPresentation.levelShortLabel,
    levelDescription: fromPresentation.levelDescription,
    avatarAssetId: fromDef.image.kind === 'UPLOADED' ? fromDef.image.assetId : undefined,
    avatarAssetKey: fromDef.image.kind === 'BUILT_IN' ? fromDef.image.assetKey : undefined,
    avatarAssetUrl: fromPresentation.avatarAsset.assetUrl,
    cardBaseColor: fromDef.cardBaseColor,
    cardTheme: fromPresentation.cardTheme,
  };

  const toLevelSnapshot: LevelPresentationSnapshot = {
    levelId: toLevelId,
    levelName: toPresentation.levelName,
    levelShortLabel: toPresentation.levelShortLabel,
    levelDescription: toPresentation.levelDescription,
    avatarAssetId: toDef.image.kind === 'UPLOADED' ? toDef.image.assetId : undefined,
    avatarAssetKey: toDef.image.kind === 'BUILT_IN' ? toDef.image.assetKey : undefined,
    avatarAssetUrl: toPresentation.avatarAsset.assetUrl,
    cardBaseColor: toDef.cardBaseColor,
    cardTheme: toPresentation.cardTheme,
  };

  const levelsChanged = Math.abs(toLevelId - fromLevelId);

  return {
    direction,
    fromLevelId,
    toLevelId,
    levelsChanged,
    levelsGained: direction === 'UP' ? levelsChanged : 0,
    fromLevel: fromLevelSnapshot,
    toLevel: toLevelSnapshot,
    settingsRevision: activeSettings.revision || 1,
  };
}

/**
 * Tạo DirectLevelChangeNotification hoàn chỉnh phục vụ cùng-context dispatch và cross-window broadcast
 */
export function buildDirectLevelChangeNotification(
  params: DetectLevelTransitionParams & {
    mutationId: string;
    notificationId: string;
    classId: string;
    preferredTarget?: 'PRESENTATION' | 'CONTROLLER' | 'LOCAL_FALLBACK';
  }
): DirectLevelChangeNotification | null {
  const transition = detectLevelTransition(params);
  if (!transition) return null;

  const nowISO = new Date().toISOString();
  const defaultTarget = transition.direction === 'DOWN' ? 'CONTROLLER' : 'PRESENTATION';

  return {
    notificationId: params.notificationId,
    mutationId: params.mutationId,
    studentId: params.student.id,
    studentDisplayName: params.student.fullName,
    studentCode: params.student.studentCode,
    classId: params.classId,
    liveSessionId: params.liveSessionId || null,
    direction: transition.direction,
    previousScore: params.previousScore,
    currentScore: params.currentScore,
    fromLevelId: transition.fromLevelId,
    toLevelId: transition.toLevelId,
    previousLevel: transition.fromLevel,
    currentLevel: transition.toLevel,
    levelsChanged: transition.levelsChanged,
    settingsRevision: transition.settingsRevision,
    createdAt: nowISO,
    preferredTarget: params.preferredTarget || defaultTarget,
  };
}

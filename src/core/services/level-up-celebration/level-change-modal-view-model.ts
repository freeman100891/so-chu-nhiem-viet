import type {
  AvatarCardTheme,
  AvatarProgressLevel,
  DirectLevelChangeNotification,
} from '../../types/avatar-theme.types';
import { avatarCatalogService } from '../avatar-catalog.service';

export type LevelModalVariant =
  | 'LEVEL_UP'
  | 'MULTI_LEVEL_UP'
  | 'MAX_LEVEL'
  | 'LEVEL_DOWN';

export interface ScoreDisplayOptions {
  showDelta?: boolean;
  showCurrent?: boolean;
  privacyMode?: boolean;
}

export interface ViewModelOptions extends ScoreDisplayOptions {
  maxLevelId?: AvatarProgressLevel;
}

export interface LevelChangeModalViewModel {
  id: string;
  variant: LevelModalVariant;
  student: {
    id: string;
    displayName: string;
    initials: string;
  };
  previousLevel: {
    id: AvatarProgressLevel;
    name: string;
    shortLabel: string;
    avatarSrc?: string;
  };
  currentLevel: {
    id: AvatarProgressLevel;
    name: string;
    shortLabel: string;
    description?: string;
    avatarSrc?: string;
    avatarAlt: string;
    cardBaseColor: string;
    cardTheme: AvatarCardTheme;
  };
  score?: {
    delta: number;
    current: number;
    showDelta: boolean;
    showCurrent: boolean;
    formattedSummary?: string;
  };
  levelsChanged: number;
  settingsRevision: number;
  content: {
    eyebrow: string;
    headline: string;
    supportingText?: string;
    levelBadgeLabel: string;
    transitionLabel: string;
    scoreSummary?: string;
    ariaAnnouncement: string;
  };
}

export interface BatchLevelChangeModalViewModel {
  id: string;
  header: {
    eyebrow: string;
    title: string;
    count: number;
    ariaAnnouncement: string;
  };
  items: LevelChangeModalViewModel[];
  overflowCount: number;
  isAllDown: boolean;
}

/**
 * Trích xuất 1-2 chữ cái đại diện cho học sinh từ họ tên đầy đủ tiếng Việt
 */
export function getStudentInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'HS';
  const trimmed = name.trim();
  if (!trimmed) return 'HS';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Fallback an toàn cho card theme khi snapshot không có đủ thông tin
 */
export function getSafeCardTheme(
  baseColor: string = '#f59e0b',
  existingTheme?: AvatarCardTheme
): AvatarCardTheme {
  if (existingTheme && existingTheme.baseColor) {
    return existingTheme;
  }

  return {
    key: `safe-theme-${baseColor}`,
    baseColor,
    surfaceStart: '#ffffff',
    surfaceEnd: '#f8fafc',
    border: baseColor,
    accent: baseColor,
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    badgeBackground: baseColor,
    badgeText: '#ffffff',
    badgeBorder: baseColor,
    avatarRing: baseColor,
    focusRing: baseColor,
    shadow: `0 10px 25px -5px ${baseColor}30`,
    isDark: false,
    contrastRatio: 4.5,
    contrastPassed: true,
  };
}

/**
 * Pure Mapper & Validator: Chuyển đổi DirectLevelChangeNotification sang LevelChangeModalViewModel
 * Không side-effects, không gọi DB, không tạo object URL, an toàn tuyệt đối cho SSR và Test
 */
export function buildLevelChangeModalViewModel(
  notification: DirectLevelChangeNotification,
  options: ViewModelOptions = {}
): LevelChangeModalViewModel {
  const {
    showDelta = true,
    showCurrent = true,
    privacyMode = false,
    maxLevelId = 5,
  } = options;

  // 1. Chuẩn hóa ID cấp độ 1-5
  const rawFromId = Number(notification.fromLevelId) || 1;
  const rawToId = Number(notification.toLevelId) || 1;
  const fromLevelId = (Math.max(1, Math.min(5, rawFromId))) as AvatarProgressLevel;
  const toLevelId = (Math.max(1, Math.min(5, rawToId))) as AvatarProgressLevel;

  // 2. Tính lại số cấp thay đổi chính xác
  const levelsChanged = Math.abs(toLevelId - fromLevelId) || 1;

  // 3. Phân loại Variant
  let variant: LevelModalVariant;
  if (notification.direction === 'DOWN' || toLevelId < fromLevelId) {
    variant = 'LEVEL_DOWN';
  } else if (toLevelId === maxLevelId && toLevelId > fromLevelId) {
    variant = 'MAX_LEVEL';
  } else if (levelsChanged > 1) {
    variant = 'MULTI_LEVEL_UP';
  } else {
    variant = 'LEVEL_UP';
  }

  // 4. Chuẩn hóa tên và avatar học sinh
  const displayName = notification.studentDisplayName?.trim() || 'Học sinh';
  const initials = getStudentInitials(displayName);

  // 5. Chuẩn hóa level snapshot
  const prevSnap = notification.previousLevel;
  const currSnap = notification.currentLevel;

  const previousLevelName = prevSnap?.levelName?.trim() || `Cấp ${fromLevelId}`;
  const previousLevelShortLabel = prevSnap?.levelShortLabel?.trim() || `Cấp ${fromLevelId}`;

  const currentLevelName = currSnap?.levelName?.trim() || `Cấp ${toLevelId}`;
  const currentLevelShortLabel = currSnap?.levelShortLabel?.trim() || `Cấp ${toLevelId}`;
  const currentLevelDesc = currSnap?.levelDescription?.trim() || undefined;

  const currentBaseColor = currSnap?.cardBaseColor || (variant === 'LEVEL_DOWN' ? '#64748b' : '#f59e0b');
  const currentCardTheme = getSafeCardTheme(currentBaseColor, currSnap?.cardTheme);

  // Phân giải Avatar URL đồng bộ theo cấp độ và chủ đề
  let prevAvatarSrc = prevSnap?.avatarAssetUrl;
  if (!prevAvatarSrc) {
    if (prevSnap?.avatarAssetKey) {
      prevAvatarSrc = avatarCatalogService.getItemByKey(prevSnap.avatarAssetKey)?.assetUrl;
    }
    if (!prevAvatarSrc) {
      const key = `military/military-stage-${fromLevelId}`;
      prevAvatarSrc = avatarCatalogService.getItemByKey(key)?.assetUrl;
    }
  }

  let currAvatarSrc = currSnap?.avatarAssetUrl;
  if (!currAvatarSrc) {
    if (currSnap?.avatarAssetKey) {
      currAvatarSrc = avatarCatalogService.getItemByKey(currSnap.avatarAssetKey)?.assetUrl;
    }
    if (!currAvatarSrc) {
      const key = `military/military-stage-${toLevelId}`;
      currAvatarSrc = avatarCatalogService.getItemByKey(key)?.assetUrl;
    }
  }

  // 6. Xử lý điểm số và Privacy Policy
  const prevScore = Number.isFinite(notification.previousScore) ? notification.previousScore : 0;
  const currScore = Number.isFinite(notification.currentScore) ? notification.currentScore : 0;
  const scoreDelta = currScore - prevScore;

  const isScoreFinite = Number.isFinite(notification.currentScore) && Number.isFinite(notification.previousScore);
  const allowScoreDisplay = !privacyMode && isScoreFinite && variant !== 'LEVEL_DOWN';

  let scoreSummary: string | undefined = undefined;
  if (allowScoreDisplay) {
    if (showDelta && showCurrent && scoreDelta > 0) {
      scoreSummary = `+${scoreDelta} điểm · Tổng ${currScore} điểm`;
    } else if (showDelta && scoreDelta > 0) {
      scoreSummary = `+${scoreDelta} điểm`;
    } else if (showCurrent) {
      scoreSummary = `Tổng ${currScore} điểm`;
    }
  }

  // 7. Chuẩn hóa Vietnamese Copy theo từng Variant
  let eyebrow = 'Chúc mừng!';
  let headline = 'đã đạt cấp mới';
  let supportingText: string | undefined = undefined;
  let ariaAnnouncement = `Chúc mừng ${displayName} đã đạt Cấp ${toLevelId}, ${currentLevelName}.`;

  if (variant === 'MAX_LEVEL') {
    eyebrow = 'Chúc mừng!';
    headline = 'đã chinh phục cấp cao nhất';
    if (levelsChanged > 1) {
      supportingText = `Đã thăng ${levelsChanged} cấp`;
    }
    ariaAnnouncement = `Chúc mừng ${displayName} đã chinh phục cấp cao nhất, Cấp ${toLevelId}, ${currentLevelName}.`;
  } else if (variant === 'MULTI_LEVEL_UP') {
    eyebrow = 'Chúc mừng!';
    headline = `đã thăng ${levelsChanged} cấp`;
    ariaAnnouncement = `Chúc mừng ${displayName} đã thăng ${levelsChanged} cấp và đạt Cấp ${toLevelId}, ${currentLevelName}.`;
  } else if (variant === 'LEVEL_DOWN') {
    eyebrow = '';
    headline = 'Cấp bậc đã được cập nhật';
    supportingText = undefined;
    ariaAnnouncement = `Cấp bậc của ${displayName} đã được cập nhật thành Cấp ${toLevelId}, ${currentLevelName}.`;
  }

  const levelBadgeLabel = `Cấp ${toLevelId}`;
  const transitionLabel = `Cấp ${fromLevelId} → Cấp ${toLevelId}`;

  return {
    id: notification.notificationId || `modal-${notification.studentId}-${toLevelId}`,
    variant,
    student: {
      id: notification.studentId,
      displayName,
      initials,
    },
    previousLevel: {
      id: fromLevelId,
      name: previousLevelName,
      shortLabel: previousLevelShortLabel,
      avatarSrc: prevAvatarSrc,
    },
    currentLevel: {
      id: toLevelId,
      name: currentLevelName,
      shortLabel: currentLevelShortLabel,
      description: currentLevelDesc,
      avatarSrc: currAvatarSrc,
      avatarAlt: `Avatar ${currentLevelName}`,
      cardBaseColor: currentBaseColor,
      cardTheme: currentCardTheme,
    },
    score: allowScoreDisplay
      ? {
          delta: scoreDelta,
          current: currScore,
          showDelta,
          showCurrent,
          formattedSummary: scoreSummary,
        }
      : undefined,
    levelsChanged,
    settingsRevision: notification.settingsRevision || 1,
    content: {
      eyebrow,
      headline,
      supportingText,
      levelBadgeLabel,
      transitionLabel,
      scoreSummary,
      ariaAnnouncement,
    },
  };
}

/**
 * Pure Mapper cho Batch Level Changes (Nhiều học sinh)
 */
export function buildBatchLevelChangeModalViewModel(
  notifications: DirectLevelChangeNotification[],
  options: ViewModelOptions = {}
): BatchLevelChangeModalViewModel {
  const items = notifications.map((n) => buildLevelChangeModalViewModel(n, options));
  const isAllDown = items.length > 0 && items.every((i) => i.variant === 'LEVEL_DOWN');

  const count = items.length;
  const title = isAllDown ? 'Cấp Bậc Đã Được Cập Nhật' : `${count} học sinh vừa đạt cấp mới`;
  const eyebrow = isAllDown ? '' : 'Chúc mừng các em!';

  const ariaAnnouncement = isAllDown
    ? `Cấp bậc của ${items.map((i) => i.student.displayName).join(', ')} đã được cập nhật.`
    : `Chúc mừng ${items.map((i) => `${i.student.displayName} đạt Cấp ${i.currentLevel.id}`).join(', ')}!`;

  return {
    id: `batch-${Date.now()}-${count}`,
    header: {
      eyebrow,
      title,
      count,
      ariaAnnouncement,
    },
    items,
    overflowCount: Math.max(0, count - 4),
    isAllDown,
  };
}

import type { AvatarCardTheme } from '../types/avatar-theme.types';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * 5 Bảng màu cơ sở mặc định cho 5 cấp tiến trình avatar
 * - Cấp 1 (Khởi đầu): Slate trung tính #64748B
 * - Cấp 2 (Tiến bộ): Teal ngọc lam #0F766E
 * - Cấp 3 (Bứt phá): Blue xanh dương #2563EB
 * - Cấp 4 (Xuất sắc): Purple tím #7C3AED
 * - Cấp 5 (Vinh quang): Amber vàng hổ phách #B7791F
 */
export const DEFAULT_5_LEVEL_CARD_PALETTE: readonly [string, string, string, string, string] = [
  '#64748B', // Cấp 1
  '#0F766E', // Cấp 2
  '#2563EB', // Cấp 3
  '#7C3AED', // Cấp 4
  '#B7791F', // Cấp 5
] as const;

/**
 * Phân tích mã màu Hex (#RGB hoặc #RRGGBB) thành RGB
 */
export function hexToRgb(hex: string): RgbColor | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.trim().replace(/^#/, '');

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0]! + cleanHex[0]!, 16);
    const g = parseInt(cleanHex[1]! + cleanHex[1]!, 16);
    const b = parseInt(cleanHex[2]! + cleanHex[2]!, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  return null;
}

/**
 * Chuyển RGB thành mã màu Hex chuẩn (#RRGGBB)
 */
export function rgbToHex(rgb: RgbColor): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Chuyển RGB thành HSL
 */
export function rgbToHsl(rgb: RgbColor): HslColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Chuyển HSL thành RGB
 */
export function hslToRgb(hsl: HslColor): RgbColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let val = t;
      if (val < 0) val += 1;
      if (val > 1) val -= 1;
      if (val < 1 / 6) return p + (q - p) * 6 * val;
      if (val < 1 / 2) return q;
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Tính Relative Luminance theo chuẩn WCAG 2.1
 */
export function calculateRelativeLuminance(rgb: RgbColor): number {
  const transform = (v: number) => {
    const sRGB = v / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };

  const R = transform(rgb.r);
  const G = transform(rgb.g);
  const B = transform(rgb.b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Tính Contrast Ratio giữa 2 màu theo chuẩn WCAG 2.1
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) || { r: 15, g: 23, b: 42 };
  const rgb2 = hexToRgb(hex2) || { r: 255, g: 255, b: 255 };

  const l1 = calculateRelativeLuminance(rgb1);
  const l2 = calculateRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Sinh deterministic toàn bộ visual tokens từ một mã màu Base Color
 */
export function generateCardThemeFromBaseColor(baseColorHex: string, levelNumber: number = 1): AvatarCardTheme {
  const validRgb = hexToRgb(baseColorHex) || hexToRgb(DEFAULT_5_LEVEL_CARD_PALETTE[(levelNumber - 1) % 5]!) || {
    r: 100,
    g: 116,
    b: 139,
  };
  const hsl = rgbToHsl(validRgb);

  // Surface start (very light pastel tint 97%)
  const surfaceStartRgb = hslToRgb({
    h: hsl.h,
    s: Math.min(hsl.s, 45),
    l: 97,
  });

  // Surface end (light gradient end 92%)
  const surfaceEndRgb = hslToRgb({
    h: hsl.h,
    s: Math.min(hsl.s, 40),
    l: 92,
  });

  // Border (subtle tint border 82%)
  const borderRgb = hslToRgb({
    h: hsl.h,
    s: Math.min(hsl.s, 50),
    l: 80,
  });

  // Badge background (88% lightness)
  const badgeBgRgb = hslToRgb({
    h: hsl.h,
    s: Math.min(hsl.s, 60),
    l: 89,
  });

  // Badge border (75% lightness)
  const badgeBorderRgb = hslToRgb({
    h: hsl.h,
    s: Math.min(hsl.s, 60),
    l: 75,
  });

  // Badge text (25% lightness - high contrast)
  const badgeTextRgb = hslToRgb({
    h: hsl.h,
    s: Math.max(hsl.s, 60),
    l: 25,
  });

  // Avatar ring (vibrant 60% lightness)
  const avatarRingRgb = hslToRgb({
    h: hsl.h,
    s: Math.max(hsl.s, 55),
    l: 60,
  });

  const surfaceStart = rgbToHex(surfaceStartRgb);
  const surfaceEnd = rgbToHex(surfaceEndRgb);
  const border = rgbToHex(borderRgb);
  const accent = rgbToHex(validRgb);
  const badgeBackground = rgbToHex(badgeBgRgb);
  const badgeBorder = rgbToHex(badgeBorderRgb);
  const badgeText = rgbToHex(badgeTextRgb);
  const avatarRing = rgbToHex(avatarRingRgb);
  const focusRing = accent;
  const shadow = `rgba(${validRgb.r}, ${validRgb.g}, ${validRgb.b}, 0.08)`;

  // WCAG Text: Slate 900 #0F172A
  const textPrimary = '#0F172A';
  const textSecondary = '#475569';

  const contrastRatio = calculateContrastRatio(textPrimary, surfaceStart);
  const contrastPassed = contrastRatio >= 4.5;

  return {
    key: `avatar-level-${levelNumber}`,
    baseColor: rgbToHex(validRgb),
    surfaceStart,
    surfaceEnd,
    border,
    accent,
    textPrimary,
    textSecondary,
    badgeBackground,
    badgeText,
    badgeBorder,
    avatarRing,
    focusRing,
    shadow,
    isDark: false,
    contrastRatio,
    contrastPassed,
  };
}

export const avatarCardThemeService = {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  calculateContrastRatio,
  generateCardThemeFromBaseColor,
  DEFAULT_5_LEVEL_CARD_PALETTE,
};

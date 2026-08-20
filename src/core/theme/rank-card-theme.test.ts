import { describe, it, expect } from 'vitest';
import {
  RANK_CARD_THEMES,
  NEUTRAL_RANK_CARD_THEME,
  getRankCardTheme,
  getRankCardStyle,
} from './rank-card-theme';

// Helper function to calculate relative luminance according to WCAG 2.1
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper to calculate contrast ratio between 2 hex colors
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Rank Card Theme Tokens & Selector (FEAT-RANK-002)', () => {
  it('1. Contains exactly 17 unique rank themes covering Level 1 to 17', () => {
    const keys = Object.keys(RANK_CARD_THEMES).map(Number);
    expect(keys.length).toBe(17);

    for (let level = 1; level <= 17; level++) {
      const theme = RANK_CARD_THEMES[level];
      expect(theme).toBeDefined();
      expect(theme?.order).toBe(level);
      expect(theme?.key).toBeTruthy();
      expect(theme?.surfaceStart).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme?.surfaceEnd).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme?.textPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme?.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme?.badgeBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme?.badgeText).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('2. getRankCardTheme returns correct theme for numbers and RankLevel objects', () => {
    expect(getRankCardTheme(1).key).toBe('slate');
    expect(getRankCardTheme(7).key).toBe('green');
    expect(getRankCardTheme(17).key).toBe('royal');

    expect(getRankCardTheme({ level: 3, name: 'Hạ sĩ', code: 'HA_SI', group: 'Hạ sĩ quan và Binh sĩ', minPoints: 60, colorToken: '', badgeKey: '', description: '', rankSystemId: 'sys-1', id: 'lvl-3', createdAt: '', updatedAt: '', deletedAt: null }).key).toBe('ice');
    expect(getRankCardTheme({ level: 14, name: 'Thiếu tướng', code: 'THIEU_TUONG', group: 'Cấp Tướng', minPoints: 1200, colorToken: '', badgeKey: '', description: '', rankSystemId: 'sys-1', id: 'lvl-14', createdAt: '', updatedAt: '', deletedAt: null }).key).toBe('violet');
  });

  it('3. getRankCardTheme returns neutral fallback for null, undefined, or invalid levels', () => {
    expect(getRankCardTheme(null)).toEqual(NEUTRAL_RANK_CARD_THEME);
    expect(getRankCardTheme(undefined)).toEqual(NEUTRAL_RANK_CARD_THEME);
    expect(getRankCardTheme(0)).toEqual(NEUTRAL_RANK_CARD_THEME);
    expect(getRankCardTheme(18)).toEqual(NEUTRAL_RANK_CARD_THEME);
    expect(getRankCardTheme(-5)).toEqual(NEUTRAL_RANK_CARD_THEME);
  });

  it('4. All 17 rank themes satisfy WCAG AA contrast for textPrimary vs surface gradient', () => {
    for (let level = 1; level <= 17; level++) {
      const theme = RANK_CARD_THEMES[level]!;
      const ratioStart = getContrastRatio(theme.textPrimary, theme.surfaceStart);
      const ratioEnd = getContrastRatio(theme.textPrimary, theme.surfaceEnd);

      // WCAG AA requires >= 4.5:1 for normal text
      expect(ratioStart).toBeGreaterThanOrEqual(4.5);
      expect(ratioEnd).toBeGreaterThanOrEqual(4.5);

      // Badge text vs badge background should also be >= 4.0:1
      const badgeRatio = getContrastRatio(theme.badgeText, theme.badgeBackground);
      expect(badgeRatio).toBeGreaterThanOrEqual(4.0);
    }
  });

  it('5. Level 17 (Royal) has isDark: true and high contrast on dark navy surface', () => {
    const royal = RANK_CARD_THEMES[17]!;
    expect(royal.isDark).toBe(true);
    expect(royal.textPrimary).toBe('#F8FAFC'); // Light text on dark navy
    const contrast = getContrastRatio(royal.textPrimary, royal.surfaceStart);
    expect(contrast).toBeGreaterThanOrEqual(10.0); // Extremely crisp and readable
  });

  it('6. getRankCardStyle generates CSS Custom Properties mapping', () => {
    const theme = RANK_CARD_THEMES[1]!;
    const style = getRankCardStyle(theme) as Record<string, string>;

    expect(style['--rank-surface-start']).toBe(theme.surfaceStart);
    expect(style['--rank-surface-end']).toBe(theme.surfaceEnd);
    expect(style['--rank-border']).toBe(theme.border);
    expect(style['--rank-accent']).toBe(theme.accent);
    expect(style['--rank-text-primary']).toBe(theme.textPrimary);
    expect(style['--rank-badge-bg']).toBe(theme.badgeBackground);
  });
});

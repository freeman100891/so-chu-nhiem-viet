import { describe, it, expect } from 'vitest';
import {
  avatarCardThemeService,
  DEFAULT_5_LEVEL_CARD_PALETTE,
  hexToRgb,
  rgbToHex,
  calculateContrastRatio,
  generateCardThemeFromBaseColor,
} from './avatar-card-theme.service';

describe('AvatarCardThemeService Tests (FEAT-AVATAR-001)', () => {
  it('1. Parses hex colors correctly to RGB and converts back', () => {
    const rgb1 = hexToRgb('#2563EB');
    expect(rgb1).toEqual({ r: 37, g: 99, b: 235 });
    expect(rgbToHex(rgb1!)).toBe('#2563EB');

    const rgbShort = hexToRgb('#FFF');
    expect(rgbShort).toEqual({ r: 255, g: 255, b: 255 });
    expect(rgbToHex(rgbShort!)).toBe('#FFFFFF');

    expect(hexToRgb('invalid')).toBeNull();
  });

  it('2. Calculates WCAG 2.1 relative luminance and contrast ratio', () => {
    // Pure Black on Pure White = 21:1
    const maxRatio = calculateContrastRatio('#000000', '#FFFFFF');
    expect(maxRatio).toBe(21);

    // Same color = 1:1
    const minRatio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
    expect(minRatio).toBe(1);

    // Standard dark slate #0F172A on light gray #F8FAFC
    const bodyContrast = calculateContrastRatio('#0F172A', '#F8FAFC');
    expect(bodyContrast).toBeGreaterThan(15);
  });

  it('3. Generates deterministic 5-level card theme tokens for all default palette colors', () => {
    DEFAULT_5_LEVEL_CARD_PALETTE.forEach((baseColor, index) => {
      const level = index + 1;
      const theme = generateCardThemeFromBaseColor(baseColor, level);

      expect(theme.key).toBe(`avatar-level-${level}`);
      expect(theme.baseColor.toUpperCase()).toBe(baseColor.toUpperCase());
      expect(theme.surfaceStart).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.surfaceEnd).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.border).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.textPrimary).toBe('#0F172A');
      expect(theme.contrastPassed).toBe(true);
      expect(theme.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('4. Handles custom colors gracefully and enforces WCAG AA compliance', () => {
    const customColors = ['#E11D48', '#059669', '#D97706', '#4F46E5', '#0284C7'];

    customColors.forEach((color, idx) => {
      const theme = avatarCardThemeService.generateCardThemeFromBaseColor(color, idx + 1);
      expect(theme.contrastPassed).toBe(true);
      expect(theme.contrastRatio).toBeGreaterThanOrEqual(4.5);
      expect(theme.surfaceStart).toBeDefined();
      expect(theme.surfaceEnd).toBeDefined();
    });
  });
});

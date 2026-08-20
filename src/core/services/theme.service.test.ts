import { describe, it, expect, beforeEach } from 'vitest';
import { themeService } from './theme.service';

describe('Theme Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('1. Should apply theme seamlessly and update data-theme attribute on root element', async () => {
    await themeService.applyTheme('ethnic');

    expect(document.documentElement.getAttribute('data-theme')).toBe('ethnic');
    expect(themeService.getCurrentTheme()).toBe('ethnic');
  });

  it('2. Should persist selected theme in localStorage', async () => {
    await themeService.applyTheme('regions');

    const stored = localStorage.getItem('app_theme');
    expect(stored).toBe('regions');
  });

  it('3. Should restore theme from localStorage during initTheme', async () => {
    localStorage.setItem('app_theme', 'military');

    const restored = await themeService.initTheme();
    expect(restored).toBe('military');
    expect(document.documentElement.getAttribute('data-theme')).toBe('military');
  });
});

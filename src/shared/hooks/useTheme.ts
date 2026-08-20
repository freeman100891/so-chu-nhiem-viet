import { useEffect, useState } from 'react';
import type { AppTheme } from '../../core/database/types';
import { settingsRepository } from '../../core/repositories/settings.repository';

const THEME_STORAGE_KEY = 'sch_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
    return saved || 'traditional';
  });

  useEffect(() => {
    // Synchronize initial theme from IndexedDB settings if available
    settingsRepository.getSettings().then((s) => {
      if (s.theme) {
        setThemeState(s.theme);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const changeTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    settingsRepository.updateSettings({ theme: newTheme }).catch((err) => {
      console.error('Failed to persist theme to IndexedDB settings:', err);
    });
  };

  return { theme, changeTheme };
}

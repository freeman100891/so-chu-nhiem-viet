import { db } from '../database/db';
import type { UserSettings } from '../database/types';

export class SettingsRepository {
  async getSettings(): Promise<UserSettings> {
    const existing = await db.settings.get('default');
    if (existing) return existing;

    const now = new Date().toISOString();
    const defaultSettings: UserSettings = {
      id: 'default',
      theme: 'traditional',
      activeAcademicYearId: null,
      activeClassId: null,
      sidebarCollapsed: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.settings.put(defaultSettings);
    return defaultSettings;
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.settings.put(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gvcn_settings_changed'));
      window.dispatchEvent(new Event('gvcn_data_changed'));
    }
    return updated;
  }
}

export const settingsRepository = new SettingsRepository();

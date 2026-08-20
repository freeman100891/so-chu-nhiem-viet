import { db } from '../database/db';

export type ThemeId = 'military' | 'ethnic' | 'regions';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'military',
    name: 'Hành Quân Tri Thức',
    subtitle: 'Phong cách Quân đội Giáo Dục',
    description: 'Xanh rêu, Xanh lá đậm, Kaki, Đỏ cờ & Vàng sao. Trang nghiêm, kỷ luật và truyền cảm hứng.',
    primaryColor: '#2D5A27',
    secondaryColor: '#E9ECE0',
    accentColor: '#DC2626',
  },
  {
    id: 'ethnic',
    name: 'Sắc Màu 54 Dân Tộc',
    subtitle: 'Họa Tiết Thổ Cẩm Truyền Thống',
    description: 'Chàm, Đỏ đất, Vàng ấm & Xanh ngọc. Tinh tế, ấm áp và tôn vinh sự đa dạng văn hóa.',
    primaryColor: '#1E3A8A',
    secondaryColor: '#F5EFE6',
    accentColor: '#D97706',
  },
  {
    id: 'regions',
    name: 'Đất Nước Ba Miền',
    subtitle: 'Phong Cảnh Thiên Nhiên Việt Nam',
    description: 'Sự hài hòa giữa Xanh núi Bắc Bộ, Vàng nắng Miền Trung và Đồng ruộng Miền Nam.',
    primaryColor: '#059669',
    secondaryColor: '#E6F0E6',
    accentColor: '#B91C1C',
  },
];

export class ThemeService {
  private currentTheme: ThemeId = 'military';

  /**
   * Khởi tạo Theme khi ứng dụng mở ra (Đọc từ localStorage & DB)
   */
  async initTheme(): Promise<ThemeId> {
    const localTheme = localStorage.getItem('app_theme') as ThemeId;
    if (localTheme && (localTheme === 'military' || localTheme === 'ethnic' || localTheme === 'regions')) {
      this.applyThemeToDOM(localTheme);
      this.currentTheme = localTheme;
      return localTheme;
    }

    try {
      const settings = await db.settings.toCollection().first();
      if (settings?.theme) {
        const themeId = settings.theme as ThemeId;
        this.applyThemeToDOM(themeId);
        this.currentTheme = themeId;
        localStorage.setItem('app_theme', themeId);
        return themeId;
      }
    } catch (err) {
      console.error('Error loading theme settings:', err);
    }

    this.applyThemeToDOM('military');
    return 'military';
  }

  /**
   * Áp dụng Theme mới lập tức KHÔNG reload trang
   */
  async applyTheme(themeId: ThemeId): Promise<void> {
    this.applyThemeToDOM(themeId);
    this.currentTheme = themeId;
    localStorage.setItem('app_theme', themeId);

    try {
      const settings = await db.settings.toCollection().first();
      if (settings) {
        await db.settings.update(settings.id, {
          theme: themeId,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving theme settings to DB:', err);
    }
  }

  /**
   * Set attribute data-theme trên <html> root element
   */
  private applyThemeToDOM(themeId: ThemeId) {
    document.documentElement.setAttribute('data-theme', themeId);
  }

  getCurrentTheme(): ThemeId {
    return this.currentTheme;
  }
}

export const themeService = new ThemeService();

import type { AppTheme } from '../core/database/types';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    bg: string;
    accent: string;
  };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'traditional',
    name: 'Truyền Thống',
    description: 'Tông màu ấm áp, phong cách Giấy Giót & Gỗ Trầm cổ điển',
    previewColors: {
      primary: '#854d0e',
      bg: '#fdfbf7',
      accent: '#d97706',
    },
  },
  {
    id: 'lotus',
    name: 'Hoa Sen Thanh Lịch',
    description: 'Tông màu Xanh Ngọc & Hồng Đầm dịu mát, trang nhã',
    previewColors: {
      primary: '#047857',
      bg: '#f0fdf4',
      accent: '#be185d',
    },
  },
  {
    id: 'modern',
    name: 'Hiện Đại Tối Giản',
    description: 'Tông màu Xanh Chàm & Slate công nghệ tinh gọn, rõ ràng',
    previewColors: {
      primary: '#2563eb',
      bg: '#f8fafc',
      accent: '#0284c7',
    },
  },
];

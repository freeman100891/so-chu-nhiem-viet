/// <reference types="vite/client" />

/**
 * Avatar Catalog & Resolver Service
 * Tự động đọc toàn bộ ảnh trong src/assets/images/avatars bằng Vite import.meta.glob
 * Cung cấp danh mục avatar theo nhóm, tìm kiếm và hàm phân giải URL an toàn offline.
 */

export interface AvatarItem {
  key: string;
  src: string;
  fileName: string;
  label: string;
  category: string;
  categoryLabel: string;
}

export interface AvatarCategoryMeta {
  id: string;
  label: string;
}

export const AVATAR_CATEGORIES: readonly AvatarCategoryMeta[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'default', label: 'Mặc định' },
  { id: 'students', label: 'Học sinh' },
  { id: 'animals', label: 'Động vật' },
  { id: 'cartoons', label: 'Hoạt hình' },
  { id: 'ethnic', label: 'Dân tộc' },
  { id: 'military', label: 'Thi đua Quân ngũ' },
] as const;

// Friendly label mapping for Vietnamese UI
const AVATAR_LABELS: Record<string, string> = {
  // default
  'default/default-student': 'Học sinh tiêu chuẩn',
  'default/default-boy': 'Học sinh nam chuẩn',
  'default/default-girl': 'Học sinh nữ chuẩn',

  // students
  'students/student-boy-1': 'Nam sinh tươi vui',
  'students/student-boy-2': 'Nam sinh đội mũ',
  'students/student-girl-1': 'Nữ sinh duyên dáng',
  'students/student-girl-2': 'Nữ sinh đeo kính',
  'students/student-reading': 'Chăm ngoan đọc sách',
  'students/student-smart': 'Thủ khoa cử nhân',

  // animals
  'animals/animal-cat': 'Mèo con tinh nghịch',
  'animals/animal-dog': 'Cún cưng trung thành',
  'animals/animal-bear': 'Gấu nâu thân thiện',
  'animals/animal-rabbit': 'Thỏ trắng nhanh nhẹn',
  'animals/animal-panda': 'Gấu trúc Panda',
  'animals/animal-fox': 'Cáo cam thông thái',
  'animals/animal-lion': 'Sư tử dũng mãnh',
  'animals/animal-owl': 'Cú mèo thông thái',

  // cartoons
  'cartoons/cartoon-star': 'Ngôi sao may mắn',
  'cartoons/cartoon-sun': 'Mặt trời rực rỡ',
  'cartoons/cartoon-rocket': 'Tên lửa khám phá',
  'cartoons/cartoon-dino': 'Khủng long xanh',
  'cartoons/cartoon-robot': 'Robot thông minh',
  'cartoons/cartoon-superhero': 'Siêu anh hùng',

  // ethnic
  'ethnic/ethnic-boy-tay': 'Thiếu nhi Tày',
  'ethnic/ethnic-girl-hmong': 'Thiếu nhi H’Mông',
  'ethnic/ethnic-boy-ede': 'Thiếu nhi Ê Đê',
  'ethnic/ethnic-girl-muong': 'Thiếu nhi Mường',

  // military
  'military/military-scout': 'Chiến sĩ măng non',
  'military/military-cadet': 'Hải quân nhí',
  'military/military-commander': 'Chỉ huy đội viên',
  'military/military-general': 'Đại tướng tài ba',
  'military/military-stage-1': 'Quân đội Cấp 1 - Tân binh',
  'military/military-stage-2': 'Quân đội Cấp 2 - Chiến sĩ',
  'military/military-stage-3': 'Quân đội Cấp 3 - Đội trưởng',
  'military/military-stage-4': 'Quân đội Cấp 4 - Chỉ huy',
  'military/military-stage-5': 'Quân đội Cấp 5 - Thống lĩnh',

  // plant
  'plant/plant-stage-1': 'Cây Cấp 1 - Hạt mầm',
  'plant/plant-stage-2': 'Cây Cấp 2 - Mầm non',
  'plant/plant-stage-3': 'Cây Cấp 3 - Cây nhỏ',
  'plant/plant-stage-4': 'Cây Cấp 4 - Cây trưởng thành',
  'plant/plant-stage-5': 'Cây Cấp 5 - Đại thụ Tỏa sáng',

  // royal
  'royal/royal-stage-1': 'Vương triều Cấp 1 - Người khởi hành',
  'royal/royal-stage-2': 'Vương triều Cấp 2 - Thường dân',
  'royal/royal-stage-3': 'Vương triều Cấp 3 - Hiệp sĩ',
  'royal/royal-stage-4': 'Vương triều Cấp 4 - Vương giả',
  'royal/royal-stage-5': 'Vương triều Cấp 5 - Hoàng đế',

  // gamer
  'gamer/gamer-stage-1': 'Game thủ Cấp 1 - Tập sự',
  'gamer/gamer-stage-2': 'Game thủ Cấp 2 - Người chơi',
  'gamer/gamer-stage-3': 'Game thủ Cấp 3 - Cao thủ',
  'gamer/gamer-stage-4': 'Game thủ Cấp 4 - Bậc thầy',
  'gamer/gamer-stage-5': 'Game thủ Cấp 5 - Huyền thoại',
};

const CATEGORY_LABELS: Record<string, string> = {
  default: 'Mặc định',
  students: 'Học sinh',
  animals: 'Động vật',
  cartoons: 'Hoạt hình',
  ethnic: 'Dân tộc',
  military: 'Thi đua Quân ngũ',
  plant: 'Phát triển của Cây',
  royal: 'Hành trình Vương triều',
  gamer: 'Cấp bậc Game thủ',
};

// Vite import.meta.glob eager loading for images
const avatarModules = import.meta.glob<{ default: string }>(
  '/src/assets/images/avatars/**/*.{svg,png,jpg,jpeg,webp}',
  { eager: true }
);

export class AvatarCatalogService {
  private catalog: AvatarItem[] = [];
  private catalogMap = new Map<string, AvatarItem>();
  private defaultAvatarFallback = '';

  constructor() {
    this.buildCatalog();
  }

  private buildCatalog(): void {
    const items: AvatarItem[] = [];

    for (const [path, mod] of Object.entries(avatarModules)) {
      // Path format: /src/assets/images/avatars/category/filename.ext
      const parts = path.split('/');
      const fileName = parts[parts.length - 1] || '';
      const category = parts[parts.length - 2] || 'default';
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const key = `${category}/${nameWithoutExt}`;

      const src = typeof mod === 'string' ? mod : (mod as { default: string })?.default || '';
      const label = AVATAR_LABELS[key] || nameWithoutExt;
      const categoryLabel = CATEGORY_LABELS[category] || category;

      const item: AvatarItem = {
        key,
        src,
        fileName,
        label,
        category,
        categoryLabel,
      };

      items.push(item);
      this.catalogMap.set(key, item);

      if (key === 'default/default-student') {
        this.defaultAvatarFallback = src;
      }
    }

    // Sort catalog consistently by category order, then label
    const categoryOrder: Record<string, number> = {
      default: 0,
      students: 1,
      animals: 2,
      cartoons: 3,
      ethnic: 4,
      military: 5,
    };

    items.sort((a, b) => {
      const catOrderA = categoryOrder[a.category] ?? 99;
      const catOrderB = categoryOrder[b.category] ?? 99;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return a.label.localeCompare(b.label, 'vi');
    });

    this.catalog = items;

    // If default/default-student was not found directly, pick the first available
    if (!this.defaultAvatarFallback && items.length > 0) {
      this.defaultAvatarFallback = items[0]!.src;
    }
  }

  /**
   * Lấy toàn bộ danh mục avatar
   */
  getCatalog(): AvatarItem[] {
    return this.catalog;
  }

  /**
   * Lấy danh mục avatar theo nhóm
   */
  getByCategory(categoryId: string): AvatarItem[] {
    if (!categoryId || categoryId === 'all') {
      return this.catalog;
    }
    return this.catalog.filter((item) => item.category === categoryId);
  }

  /**
   * Tìm kiếm avatar theo từ khóa
   */
  search(query: string, categoryId = 'all'): AvatarItem[] {
    const list = this.getByCategory(categoryId);
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
    );
  }

  /**
   * Lấy chi tiết một AvatarItem theo key logic
   */
  getAvatarByKey(key?: string | null): AvatarItem | undefined {
    if (!key) return undefined;
    return this.catalogMap.get(key);
  }

  /**
   * Helper tương thích: lấy item và assetUrl theo key
   */
  getItemByKey(key?: string | null): { assetUrl: string; label?: string } | undefined {
    const item = this.getAvatarByKey(key);
    if (!item) return undefined;
    return { assetUrl: item.src, label: item.label };
  }

  /**
   * URL ảnh mặc định tích hợp sẵn của hệ thống
   */
  getSystemDefaultSrc(): string {
    return this.defaultAvatarFallback;
  }

  /**
   * Helper tương thích: lấy URL ảnh mặc định
   */
  getDefaultAvatarUrl(): string {
    return this.defaultAvatarFallback;
  }

  /**
   * Phân giải Avatar học sinh theo thứ tự ưu tiên:
   * 1. Ảnh riêng do người dùng upload (customAvatar Base64/URL)
   * 2. AvatarKey riêng của học sinh (nếu hợp lệ trong catalog)
   * 3. DefaultAvatarKey do giáo viên cấu hình chung (nếu hợp lệ)
   * 4. Ảnh mặc định default-student.svg của hệ thống
   */
  resolveAvatar(
    avatarKey?: string | null,
    defaultAvatarKey?: string | null,
    customAvatar?: string | null
  ): string {
    if (customAvatar && customAvatar.trim().length > 0) {
      return customAvatar;
    }

    if (avatarKey) {
      const found = this.catalogMap.get(avatarKey);
      if (found) return found.src;
    }

    if (defaultAvatarKey) {
      const defaultFound = this.catalogMap.get(defaultAvatarKey);
      if (defaultFound) return defaultFound.src;
    }

    return this.defaultAvatarFallback;
  }
}

export const avatarCatalogService = new AvatarCatalogService();

export function resolveStudentAvatar(
  avatarKey?: string | null,
  defaultAvatarKey?: string | null,
  customAvatar?: string | null
): string {
  return avatarCatalogService.resolveAvatar(avatarKey, defaultAvatarKey, customAvatar);
}

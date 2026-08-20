import { db } from '../database/db';
import type { Gift, GiftCategory, GiftInventoryMode, GiftStatus } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';

interface DefaultGiftSeedItem {
  name: string;
  description: string;
  category: GiftCategory;
  pointCost: number;
  inventoryMode: GiftInventoryMode;
  stockOnHand?: number;
  lowStockThreshold?: number;
  displayOrder: number;
  presentationVisible: boolean;
  icon: string;
}

export class GiftSeedService {
  private readonly defaultCatalog: DefaultGiftSeedItem[] = [
    {
      name: 'Gói sticker dán sổ khen thưởng',
      description: 'Bộ sticker 50 hình dán hoạt hình đáng yêu',
      category: 'TOY',
      pointCost: 10,
      inventoryMode: 'TRACKED',
      stockOnHand: 30,
      lowStockThreshold: 5,
      displayOrder: 1,
      presentationVisible: true,
      icon: 'Sparkles',
    },
    {
      name: 'Bút chì 2B & Tẩy gôm hình thú',
      description: 'Dụng cụ học tập nắn nót từng nét chữ',
      category: 'STATIONERY',
      pointCost: 15,
      inventoryMode: 'TRACKED',
      stockOnHand: 25,
      lowStockThreshold: 5,
      displayOrder: 2,
      presentationVisible: true,
      icon: 'PenTool',
    },
    {
      name: 'Thước kẻ đa năng 20cm',
      description: 'Thước dẻo có họa tiết sinh động',
      category: 'STATIONERY',
      pointCost: 20,
      inventoryMode: 'TRACKED',
      stockOnHand: 20,
      lowStockThreshold: 4,
      displayOrder: 3,
      presentationVisible: true,
      icon: 'Ruler',
    },
    {
      name: 'Vở ô ly Bãi Bằng cao cấp',
      description: 'Vở 96 trang giấy chống lóa mắt',
      category: 'STATIONERY',
      pointCost: 30,
      inventoryMode: 'TRACKED',
      stockOnHand: 20,
      lowStockThreshold: 5,
      displayOrder: 4,
      presentationVisible: true,
      icon: 'BookOpen',
    },
    {
      name: 'Bộ bút màu dạ 12 màu',
      description: 'Bộ màu vẽ tranh mĩ thuật tươi sáng',
      category: 'STATIONERY',
      pointCost: 45,
      inventoryMode: 'TRACKED',
      stockOnHand: 15,
      lowStockThreshold: 3,
      displayOrder: 5,
      presentationVisible: true,
      icon: 'Palette',
    },
    {
      name: 'Sách truyện khoa học kỳ thú',
      description: 'Khám phá thế giới động thực vật và vũ trụ',
      category: 'BOOK',
      pointCost: 60,
      inventoryMode: 'TRACKED',
      stockOnHand: 10,
      lowStockThreshold: 2,
      displayOrder: 6,
      presentationVisible: true,
      icon: 'Book',
    },
    {
      name: 'Đặc quyền: Đổi chỗ ngồi 1 tuần',
      description: 'Được chọn vị trí bàn học mong muốn trong 1 tuần',
      category: 'PRIVILEGE',
      pointCost: 50,
      inventoryMode: 'UNLIMITED',
      displayOrder: 7,
      presentationVisible: true,
      icon: 'Crown',
    },
    {
      name: 'Đặc quyền: Làm Lớp trưởng / Quản ca 1 ngày',
      description: 'Trải nghiệm điều hành nề nếp và sinh hoạt lớp',
      category: 'PRIVILEGE',
      pointCost: 75,
      inventoryMode: 'UNLIMITED',
      displayOrder: 8,
      presentationVisible: true,
      icon: 'Award',
    },
    {
      name: 'Đặc quyền: Miễn 1 buổi trực nhật',
      description: 'Được miễn 1 buổi quét lớp và lau bảng',
      category: 'PRIVILEGE',
      pointCost: 70,
      inventoryMode: 'UNLIMITED',
      displayOrder: 9,
      presentationVisible: true,
      icon: 'ShieldCheck',
    },
    {
      name: 'Hộp bánh kẹo liên hoan cuối tuần',
      description: 'Phần quà ngọt ngào chia sẻ cùng bạn bè',
      category: 'SNACK',
      pointCost: 40,
      inventoryMode: 'TRACKED',
      stockOnHand: 12,
      lowStockThreshold: 3,
      displayOrder: 10,
      presentationVisible: true,
      icon: 'Gift',
    },
  ];

  /**
   * Seed dữ liệu quà tặng mẫu nếu thư viện hiện đang rỗng
   */
  async seedDefaultGifts(): Promise<Gift[]> {
    const activeGifts = await db.gifts.filter((g) => !g.deletedAt).toArray();
    if (activeGifts.length > 0) {
      return activeGifts;
    }

    const nowISO = new Date().toISOString();
    const seeded: Gift[] = [];

    await db.transaction('rw', [db.gifts, db.giftStockMovements], async () => {
      for (const item of this.defaultCatalog) {
        const giftId = generateUUID();
        const gift: Gift = {
          id: giftId,
          name: item.name,
          normalizedName: normalizeVietnameseText(item.name),
          description: item.description,
          category: item.category,
          pointCost: item.pointCost,
          status: 'ACTIVE' as GiftStatus,
          inventoryMode: item.inventoryMode,
          stockOnHand: item.stockOnHand,
          lowStockThreshold: item.lowStockThreshold,
          displayOrder: item.displayOrder,
          presentationVisible: item.presentationVisible,
          icon: item.icon,
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        };

        await db.gifts.add(gift);
        seeded.push(gift);

        if (item.inventoryMode === 'TRACKED' && item.stockOnHand && item.stockOnHand > 0) {
          await db.giftStockMovements.add({
            id: generateUUID(),
            giftId,
            type: 'INITIAL',
            quantityDelta: item.stockOnHand,
            stockBefore: 0,
            stockAfter: item.stockOnHand,
            reason: 'Khởi tạo tồn kho ban đầu',
            occurredAt: nowISO,
            createdAt: nowISO,
          });
        }
      }
    });

    return seeded;
  }
}

export const giftSeedService = new GiftSeedService();

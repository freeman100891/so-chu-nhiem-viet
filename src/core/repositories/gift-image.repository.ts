import { db } from '../database/db';
import type { GiftImage } from '../database/types';

export class GiftImageRepository {
  /**
   * Tìm ảnh của món quà theo giftId
   */
  async findByGiftId(giftId: string): Promise<GiftImage | undefined> {
    return await db.giftImages.where('giftId').equals(giftId).first();
  }

  /**
   * Truy vấn hàng loạt (Batch query) ảnh/thumbnail cho danh sách quà tặng
   */
  async findThumbnailsByGiftIds(giftIds: string[]): Promise<Map<string, GiftImage>> {
    const map = new Map<string, GiftImage>();
    if (giftIds.length === 0) return map;

    const images = await db.giftImages.where('giftId').anyOf(giftIds).toArray();
    for (const img of images) {
      map.set(img.giftId, img);
    }

    return map;
  }

  /**
   * Lưu hoặc cập nhật bản ghi ảnh món quà
   */
  async save(image: GiftImage): Promise<void> {
    await db.giftImages.put(image);
  }

  /**
   * Xóa ảnh của món quà theo giftId
   */
  async deleteByGiftId(giftId: string): Promise<void> {
    await db.giftImages.where('giftId').equals(giftId).delete();
  }

  /**
   * Đếm tổng số lượng ảnh quà tặng
   */
  async count(): Promise<number> {
    return await db.giftImages.count();
  }
}

export const giftImageRepository = new GiftImageRepository();

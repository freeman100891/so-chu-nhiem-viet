import { db } from '../database/db';
import type { GiftImage } from '../database/types';
import { giftImageRepository } from '../repositories/gift-image.repository';
import {
  processGiftImage,
  validateGiftImageFile,
  type ProcessedGiftImage,
} from './gift-image-processor.service';
import { generateUUID } from '../../shared/utilities/uuid';

export class GiftImageService {
  /**
   * Xác thực và xử lý trước ảnh từ file người dùng chọn
   */
  async processAndPrepare(file: File): Promise<ProcessedGiftImage> {
    return await processGiftImage(file);
  }

  /**
   * Kiểm tra nhanh tính hợp lệ của file ảnh
   */
  async validateFile(file: File) {
    return await validateGiftImageFile(file);
  }

  /**
   * Lấy ảnh quà tặng đầy đủ theo giftId
   */
  async getImageByGiftId(giftId: string): Promise<GiftImage | undefined> {
    return await giftImageRepository.findByGiftId(giftId);
  }

  /**
   * Lấy batch thumbnail map cho danh sách quà tặng (tránh N+1 query)
   */
  async getBatchThumbnails(giftIds: string[]): Promise<Map<string, GiftImage>> {
    return await giftImageRepository.findThumbnailsByGiftIds(giftIds);
  }

  /**
   * Lưu ảnh cho món quà trong transaction Dexie
   */
  async saveImageForGift(giftId: string, processed: ProcessedGiftImage): Promise<GiftImage> {
    const existing = await giftImageRepository.findByGiftId(giftId);
    const nowISO = new Date().toISOString();
    const nextVersion = (existing?.version ?? 0) + 1;

    const giftImageRecord: GiftImage = {
      id: existing?.id || generateUUID(),
      giftId,
      fullBlob: processed.fullBlob,
      fullMimeType: processed.fullMimeType,
      fullWidth: processed.fullWidth,
      fullHeight: processed.fullHeight,
      fullSizeBytes: processed.fullSizeBytes,
      thumbnailBlob: processed.thumbnailBlob,
      thumbnailMimeType: processed.thumbnailMimeType,
      thumbnailWidth: processed.thumbnailWidth,
      thumbnailHeight: processed.thumbnailHeight,
      thumbnailSizeBytes: processed.thumbnailSizeBytes,
      contentHash: processed.contentHash,
      version: nextVersion,
      createdAt: existing?.createdAt || nowISO,
      updatedAt: nowISO,
    };

    await db.transaction('rw', [db.giftImages, db.gifts, db.auditLogs], async () => {
      await giftImageRepository.save(giftImageRecord);

      // Cập nhật imageId và imageVersion trên bảng gifts
      await db.gifts.update(giftId, {
        imageId: giftImageRecord.id,
        imageVersion: nextVersion,
        updatedAt: nowISO,
      });

      // Ghi audit metadata (không chứa binary)
      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'GiftImage',
        recordId: giftId,
        action: existing ? 'UPDATE' : 'CREATE',
        details: JSON.stringify({
          giftId,
          version: nextVersion,
          fullWidth: processed.fullWidth,
          fullHeight: processed.fullHeight,
          fullSizeBytes: processed.fullSizeBytes,
          thumbnailSizeBytes: processed.thumbnailSizeBytes,
          mimeType: processed.fullMimeType,
        }),
        timestamp: nowISO,
      });
    });

    return giftImageRecord;
  }

  /**
   * Xóa ảnh của món quà trong transaction
   */
  async removeImageForGift(giftId: string): Promise<void> {
    const existing = await giftImageRepository.findByGiftId(giftId);
    if (!existing) return;

    const nowISO = new Date().toISOString();

    await db.transaction('rw', [db.giftImages, db.gifts, db.auditLogs], async () => {
      await giftImageRepository.deleteByGiftId(giftId);

      await db.gifts.update(giftId, {
        imageId: undefined,
        imageVersion: (existing.version || 1) + 1,
        updatedAt: nowISO,
      });

      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'GiftImage',
        recordId: giftId,
        action: 'DELETE',
        details: JSON.stringify({
          giftId,
          deletedImageId: existing.id,
          lastVersion: existing.version,
        }),
        timestamp: nowISO,
      });
    });
  }
}

export const giftImageService = new GiftImageService();

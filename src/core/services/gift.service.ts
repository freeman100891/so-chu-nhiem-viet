import { db } from '../database/db';
import type { Gift, GiftCategory, GiftImage, GiftInventoryMode, GiftStatus } from '../database/types';
import { giftRepository } from '../repositories/gift.repository';
import { giftSeedService } from './gift-seed.service';
import { generateUUID } from '../../shared/utilities/uuid';
import type { ProcessedGiftImage } from './gift-image-processor.service';

export interface CreateGiftInput {
  name: string;
  description?: string;
  category: GiftCategory;
  pointCost: number;
  inventoryMode: GiftInventoryMode;
  stockOnHand?: number;
  lowStockThreshold?: number;
  displayOrder?: number;
  presentationVisible?: boolean;
  icon?: string;
  imageRef?: string;
  pendingImage?: ProcessedGiftImage;
}

export interface UpdateGiftInput {
  name?: string;
  description?: string;
  category?: GiftCategory;
  pointCost?: number;
  inventoryMode?: GiftInventoryMode;
  stockOnHand?: number;
  lowStockThreshold?: number;
  displayOrder?: number;
  presentationVisible?: boolean;
  icon?: string;
  imageRef?: string;
  status?: GiftStatus;
  pendingImage?: ProcessedGiftImage;
  removeImage?: boolean;
}

export class GiftService {
  /**
   * Khởi tạo quà mẫu nếu trống và lấy danh sách quà trong catalog
   */
  async getCatalogGifts(includeArchived = false): Promise<Gift[]> {
    await giftSeedService.seedDefaultGifts();
    return await giftRepository.findCatalogGifts(includeArchived);
  }

  /**
   * Tạo món quà mới (kèm ảnh atomically nếu có pendingImage)
   */
  async createGift(input: CreateGiftInput): Promise<Gift> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Tên món quà không được để trống.');
    }
    if (!Number.isInteger(input.pointCost) || input.pointCost <= 0) {
      throw new Error('Mức điểm quy đổi phải là số nguyên dương lớn hơn 0.');
    }

    const nowISO = new Date().toISOString();
    const stockOnHand = input.inventoryMode === 'TRACKED' ? Math.max(0, input.stockOnHand || 0) : undefined;
    const lowStockThreshold = input.inventoryMode === 'TRACKED' ? Math.max(0, input.lowStockThreshold || 3) : undefined;

    const count = await db.gifts.count();
    const displayOrder = input.displayOrder ?? count + 1;

    let createdGift!: Gift;

    await db.transaction('rw', [db.gifts, db.giftImages, db.giftStockMovements, db.auditLogs], async () => {
      createdGift = await giftRepository.create({
        name,
        description: input.description?.trim() || '',
        category: input.category || 'STATIONERY',
        pointCost: input.pointCost,
        status: 'ACTIVE',
        inventoryMode: input.inventoryMode,
        stockOnHand,
        lowStockThreshold,
        displayOrder,
        presentationVisible: input.presentationVisible !== false,
        icon: input.icon || 'Gift',
        imageRef: input.imageRef,
      });

      if (input.pendingImage) {
        const imageId = generateUUID();
        const giftImageRecord: GiftImage = {
          id: imageId,
          giftId: createdGift.id,
          fullBlob: input.pendingImage.fullBlob,
          fullMimeType: input.pendingImage.fullMimeType,
          fullWidth: input.pendingImage.fullWidth,
          fullHeight: input.pendingImage.fullHeight,
          fullSizeBytes: input.pendingImage.fullSizeBytes,
          thumbnailBlob: input.pendingImage.thumbnailBlob,
          thumbnailMimeType: input.pendingImage.thumbnailMimeType,
          thumbnailWidth: input.pendingImage.thumbnailWidth,
          thumbnailHeight: input.pendingImage.thumbnailHeight,
          thumbnailSizeBytes: input.pendingImage.thumbnailSizeBytes,
          contentHash: input.pendingImage.contentHash,
          version: 1,
          createdAt: nowISO,
          updatedAt: nowISO,
        };

        await db.giftImages.add(giftImageRecord);

        await db.gifts.update(createdGift.id, {
          imageId,
          imageVersion: 1,
          updatedAt: nowISO,
        });

        createdGift.imageId = imageId;
        createdGift.imageVersion = 1;
      }

      if (input.inventoryMode === 'TRACKED' && stockOnHand && stockOnHand > 0) {
        await db.giftStockMovements.add({
          id: generateUUID(),
          giftId: createdGift.id,
          type: 'INITIAL',
          quantityDelta: stockOnHand,
          stockBefore: 0,
          stockAfter: stockOnHand,
          reason: 'Khởi tạo số lượng tồn kho ban đầu',
          occurredAt: nowISO,
          createdAt: nowISO,
        });
      }
    });

    return createdGift;
  }

  /**
   * Cập nhật thông tin món quà (kèm cập nhật/xóa ảnh)
   */
  async updateGift(id: string, updates: UpdateGiftInput): Promise<Gift | undefined> {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Tên món quà không được để trống.');
    }
    if (updates.pointCost !== undefined && (!Number.isInteger(updates.pointCost) || updates.pointCost <= 0)) {
      throw new Error('Mức điểm quy đổi phải là số nguyên dương lớn hơn 0.');
    }

    const nowISO = new Date().toISOString();
    let updatedGift: Gift | undefined;

    await db.transaction('rw', [db.gifts, db.giftImages, db.auditLogs], async () => {
      const existing = await giftRepository.findById(id);
      if (!existing) return;

      let nextImageId = existing.imageId;
      let nextImageVersion = existing.imageVersion;

      if (updates.removeImage) {
        await db.giftImages.where('giftId').equals(id).delete();
        nextImageId = undefined;
        nextImageVersion = (existing.imageVersion || 1) + 1;
      } else if (updates.pendingImage) {
        const existingImg = await db.giftImages.where('giftId').equals(id).first();
        const nextVer = (existingImg?.version ?? 0) + 1;
        const imgId = existingImg?.id || generateUUID();

        await db.giftImages.put({
          id: imgId,
          giftId: id,
          fullBlob: updates.pendingImage.fullBlob,
          fullMimeType: updates.pendingImage.fullMimeType,
          fullWidth: updates.pendingImage.fullWidth,
          fullHeight: updates.pendingImage.fullHeight,
          fullSizeBytes: updates.pendingImage.fullSizeBytes,
          thumbnailBlob: updates.pendingImage.thumbnailBlob,
          thumbnailMimeType: updates.pendingImage.thumbnailMimeType,
          thumbnailWidth: updates.pendingImage.thumbnailWidth,
          thumbnailHeight: updates.pendingImage.thumbnailHeight,
          thumbnailSizeBytes: updates.pendingImage.thumbnailSizeBytes,
          contentHash: updates.pendingImage.contentHash,
          version: nextVer,
          createdAt: existingImg?.createdAt || nowISO,
          updatedAt: nowISO,
        });

        nextImageId = imgId;
        nextImageVersion = nextVer;
      }

      const fieldsToUpdate: any = {
        ...updates,
        imageId: nextImageId,
        imageVersion: nextImageVersion,
      };
      if (updates.name !== undefined) {
        fieldsToUpdate.name = updates.name.trim();
      } else {
        delete fieldsToUpdate.name;
      }
      if (updates.description !== undefined) {
        fieldsToUpdate.description = updates.description.trim();
      }
      delete fieldsToUpdate.pendingImage;
      delete fieldsToUpdate.removeImage;

      updatedGift = await giftRepository.update(id, fieldsToUpdate);
    });

    return updatedGift;
  }

  /**
   * Điều chỉnh số lượng tồn kho (Nhập thêm hoặc kiểm kê)
   */
  async adjustStock(giftId: string, newStock: number, reason: string): Promise<boolean> {
    if (!Number.isInteger(newStock) || newStock < 0) {
      throw new Error('Số lượng tồn kho phải là số nguyên không âm.');
    }

    const gift = await giftRepository.findById(giftId);
    if (!gift) return false;

    const oldStock = gift.stockOnHand ?? 0;
    const delta = newStock - oldStock;
    const nowISO = new Date().toISOString();

    await db.transaction('rw', [db.gifts, db.giftStockMovements, db.auditLogs], async () => {
      await db.gifts.update(giftId, {
        stockOnHand: newStock,
        updatedAt: nowISO,
      });

      await db.giftStockMovements.add({
        id: generateUUID(),
        giftId,
        type: delta > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
        quantityDelta: delta,
        stockBefore: oldStock,
        stockAfter: newStock,
        reason: reason.trim() || 'Điều chỉnh kiểm kê kho định kỳ',
        occurredAt: nowISO,
        createdAt: nowISO,
      });

      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'Gift',
        recordId: giftId,
        action: 'UPDATE',
        timestamp: nowISO,
        details: `Điều chỉnh tồn kho món quà "${gift.name}": ${oldStock} ➔ ${newStock} (Lý do: ${reason.trim() || 'Kiểm kê'})`,
      });
    });

    return true;
  }

  /**
   * Lưu trữ hoặc Khôi phục trạng thái quà
   */
  async toggleArchive(giftId: string, archive: boolean): Promise<boolean> {
    if (archive) {
      return await giftRepository.archiveGift(giftId);
    }
    return await giftRepository.unarchiveGift(giftId);
  }
}

export const giftService = new GiftService();

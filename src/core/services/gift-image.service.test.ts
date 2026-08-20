import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { giftService } from './gift.service';
import { giftImageService } from './gift-image.service';
import { giftImageRepository } from '../repositories/gift-image.repository';
import type { ProcessedGiftImage } from './gift-image-processor.service';

describe('GiftImageService & Repository Integration Tests (FEAT-GIFT-003)', () => {
  beforeEach(async () => {
    await db.gifts.clear();
    await db.giftImages.clear();
    await db.auditLogs.clear();
  });

  const createMockProcessedImage = (size = 1000): ProcessedGiftImage => {
    const fullBlob = new Blob([new Uint8Array(size)], { type: 'image/webp' });
    const thumbBlob = new Blob([new Uint8Array(200)], { type: 'image/webp' });

    return {
      fullBlob,
      fullMimeType: 'image/webp',
      fullWidth: 800,
      fullHeight: 600,
      fullSizeBytes: size,
      thumbnailBlob: thumbBlob,
      thumbnailMimeType: 'image/webp',
      thumbnailWidth: 320,
      thumbnailHeight: 240,
      thumbnailSizeBytes: 200,
      contentHash: 'hash-abc-123',
      originalFileName: 'gift-photo.png',
      originalSizeBytes: 5000,
    };
  };

  it('1. Should atomically create gift with pending image in IndexedDB', async () => {
    const mockImage = createMockProcessedImage(1500);

    const gift = await giftService.createGift({
      name: 'Hộp bút màu sáp 12 màu',
      category: 'STATIONERY',
      pointCost: 25,
      inventoryMode: 'TRACKED',
      stockOnHand: 15,
      presentationVisible: true,
      pendingImage: mockImage,
    });

    expect(gift.id).toBeDefined();
    expect(gift.imageId).toBeDefined();
    expect(gift.imageVersion).toBe(1);

    // Verify record in giftImages table
    const storedImage = await giftImageRepository.findByGiftId(gift.id);
    expect(storedImage).toBeDefined();
    expect(storedImage?.fullSizeBytes).toBe(1500);
    expect(storedImage?.thumbnailSizeBytes).toBe(200);
    expect(storedImage?.fullWidth).toBe(800);
    expect(storedImage?.fullHeight).toBe(600);
    expect(storedImage?.version).toBe(1);
    expect(storedImage?.fullBlob).toBeDefined();
  });

  it('2. Should batch query thumbnails for multiple gifts (findThumbnailsByGiftIds)', async () => {
    const gift1 = await giftService.createGift({
      name: 'Món quà 1',
      category: 'STATIONERY',
      pointCost: 10,
      inventoryMode: 'UNLIMITED',
      presentationVisible: true,
      pendingImage: createMockProcessedImage(100),
    });

    const gift2 = await giftService.createGift({
      name: 'Món quà 2 (không có ảnh)',
      category: 'BOOK',
      pointCost: 20,
      inventoryMode: 'UNLIMITED',
      presentationVisible: true,
    });

    const gift3 = await giftService.createGift({
      name: 'Món quà 3',
      category: 'TOY',
      pointCost: 30,
      inventoryMode: 'UNLIMITED',
      presentationVisible: true,
      pendingImage: createMockProcessedImage(300),
    });

    const batchMap = await giftImageService.getBatchThumbnails([gift1.id, gift2.id, gift3.id]);
    expect(batchMap.size).toBe(2);
    expect(batchMap.has(gift1.id)).toBe(true);
    expect(batchMap.has(gift2.id)).toBe(false);
    expect(batchMap.has(gift3.id)).toBe(true);
  });

  it('3. Should replace gift image with incremented version counter', async () => {
    const gift = await giftService.createGift({
      name: 'Sổ tay bìa da',
      category: 'STATIONERY',
      pointCost: 50,
      inventoryMode: 'UNLIMITED',
      presentationVisible: true,
      pendingImage: createMockProcessedImage(1000),
    });

    expect(gift.imageVersion).toBe(1);

    // Update with new image
    const updated = await giftService.updateGift(gift.id, {
      name: 'Sổ tay bìa da cao cấp',
      pendingImage: createMockProcessedImage(2500),
    });

    expect(updated?.name).toBe('Sổ tay bìa da cao cấp');
    expect(updated?.imageVersion).toBe(2);

    const updatedImage = await giftImageRepository.findByGiftId(gift.id);
    expect(updatedImage?.version).toBe(2);
    expect(updatedImage?.fullSizeBytes).toBe(2500);
  });

  it('4. Should remove gift image and clear imageId without deleting gift record', async () => {
    const gift = await giftService.createGift({
      name: 'Bộ cờ vua nam châm',
      category: 'TOY',
      pointCost: 80,
      inventoryMode: 'TRACKED',
      stockOnHand: 5,
      presentationVisible: true,
      pendingImage: createMockProcessedImage(1200),
    });

    expect(gift.imageId).toBeDefined();

    // Remove image
    const updated = await giftService.updateGift(gift.id, {
      removeImage: true,
    });

    expect(updated?.imageId).toBeUndefined();

    const storedImage = await giftImageRepository.findByGiftId(gift.id);
    expect(storedImage).toBeUndefined();

    // Gift record still exists
    const storedGift = await db.gifts.get(gift.id);
    expect(storedGift).toBeDefined();
    expect(storedGift?.name).toBe('Bộ cờ vua nam châm');
  });

  it('5. Should record audit log metadata on image create, update and delete without storing Blobs', async () => {
    const gift = await giftService.createGift({
      name: 'Thước kẻ 20cm',
      category: 'STATIONERY',
      pointCost: 15,
      inventoryMode: 'UNLIMITED',
      presentationVisible: true,
    });

    // Save image via service
    await giftImageService.saveImageForGift(gift.id, createMockProcessedImage(800));

    // Remove image
    await giftImageService.removeImageForGift(gift.id);

    const allLogs = await db.auditLogs.toArray();
    const logs = allLogs.filter((l) => l.entityName === 'GiftImage');
    expect(logs.length).toBe(2);

    const createLog = logs.find((l) => l.action === 'CREATE');
    const deleteLog = logs.find((l) => l.action === 'DELETE');

    expect(createLog).toBeDefined();
    const createDetails = JSON.parse(createLog?.details || '{}');
    expect(createDetails.mimeType).toBe('image/webp');
    // Ensure no binary Blob or base64 was saved into audit log details
    expect(createDetails.fullBlob).toBeUndefined();
    expect(createLog?.details).not.toContain('data:image');

    expect(deleteLog).toBeDefined();
    const deleteDetails = JSON.parse(deleteLog?.details || '{}');
    expect(deleteDetails.giftId).toBe(gift.id);
  });
});

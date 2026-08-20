import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectAvatarMagicBytes,
  validateAvatarImageFile,
  computeBufferHash,
  avatarAssetService,
  AVATAR_ASSET_CONFIG,
  type ProcessedAvatarAsset,
} from './avatar-asset.service';
import { db } from '../database/db';

describe('AvatarAssetService Tests (FEAT-AVATAR-001 & FEAT-AVATAR-004)', () => {
  beforeEach(async () => {
    await db.avatarAssets.clear();
    avatarAssetService.clearCache();
  });

  it('1. Detects magic bytes correctly for PNG, JPEG, and WebP', () => {
    // PNG Header: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
    expect(detectAvatarMagicBytes(pngBytes)).toBe('image/png');

    // JPEG Header: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectAvatarMagicBytes(jpegBytes)).toBe('image/jpeg');

    // WebP Header: RIFF .... WEBP
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(detectAvatarMagicBytes(webpBytes)).toBe('image/webp');

    // Invalid bytes
    const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectAvatarMagicBytes(invalidBytes)).toBeNull();
  });

  it('2. Rejects SVG uploads for security', async () => {
    const fakeSvg = new File(['<svg></svg>'], 'malicious.svg', { type: 'image/svg+xml' });
    const result = await validateAvatarImageFile(fakeSvg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SVG');
  });

  it('3. Rejects files exceeding 2MB size limit', async () => {
    const largeContent = new Uint8Array(AVATAR_ASSET_CONFIG.MAX_INPUT_SIZE_BYTES + 100);
    const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });
    const result = await validateAvatarImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2 MB');
  });

  it('4. Rejects unsupported extensions and corrupted files', async () => {
    const exeFile = new File(['binary'], 'virus.exe', { type: 'application/octet-stream' });
    const result = await validateAvatarImageFile(exeFile);
    expect(result.valid).toBe(false);
  });

  it('5. Computes content hash consistently for identical buffers', async () => {
    const buffer1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    const buffer2 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    const buffer3 = new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1]).buffer;

    const hash1 = await computeBufferHash(buffer1);
    const hash2 = await computeBufferHash(buffer2);
    const hash3 = await computeBufferHash(buffer3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('6. Saves, retrieves and queries avatar assets by target level', async () => {
    const fakeBlob1 = new Blob(['fake image level 1'], { type: 'image/webp' });
    const fakeBlob2 = new Blob(['fake image level 2'], { type: 'image/webp' });

    const asset1: ProcessedAvatarAsset = {
      id: 'asset-lvl-1',
      blob: fakeBlob1,
      mimeType: 'image/webp',
      width: 320,
      height: 320,
      sizeBytes: 15420,
      objectUrl: 'blob:fake-url-1',
      contentHash: 'hash-lvl-1',
      targetLevel: 1,
      originalFileName: 'superhero_lvl1.webp',
    };

    const asset2: ProcessedAvatarAsset = {
      id: 'asset-lvl-2',
      blob: fakeBlob2,
      mimeType: 'image/webp',
      width: 320,
      height: 320,
      sizeBytes: 18200,
      objectUrl: 'blob:fake-url-2',
      contentHash: 'hash-lvl-2',
      targetLevel: 2,
      originalFileName: 'superhero_lvl2.webp',
    };

    await avatarAssetService.saveAvatarAsset(asset1);
    await avatarAssetService.saveAvatarAsset(asset2);

    // Retrieve by ID
    const retrieved1 = await avatarAssetService.getAssetById('asset-lvl-1');
    expect(retrieved1).toBeDefined();
    expect(retrieved1?.targetLevel).toBe(1);
    expect(retrieved1?.originalFileName).toBe('superhero_lvl1.webp');

    // Query for level 1
    const level1Assets = await avatarAssetService.getUploadedAssetsForLevel(1);
    expect(level1Assets.length).toBe(1);
    expect(level1Assets[0]?.id).toBe('asset-lvl-1');

    // Query all assets
    const allAssets = await avatarAssetService.getAllUploadedAvatarAssets();
    expect(allAssets.length).toBe(2);

    // Delete asset
    await avatarAssetService.deleteAvatarAsset('asset-lvl-1');
    const afterDelete = await avatarAssetService.getAllUploadedAvatarAssets();
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0]?.id).toBe('asset-lvl-2');
  });

  it('7. Reuses existing asset when saving duplicate content hash', async () => {
    const fakeBlob = new Blob(['same content'], { type: 'image/webp' });
    const asset1: ProcessedAvatarAsset = {
      id: 'asset-orig',
      blob: fakeBlob,
      mimeType: 'image/webp',
      width: 320,
      height: 320,
      sizeBytes: 12000,
      objectUrl: 'blob:orig',
      contentHash: 'same-hash-123',
      targetLevel: 3,
      originalFileName: 'hero_v1.webp',
    };

    const asset2: ProcessedAvatarAsset = {
      id: 'asset-dup',
      blob: fakeBlob,
      mimeType: 'image/webp',
      width: 320,
      height: 320,
      sizeBytes: 12000,
      objectUrl: 'blob:dup',
      contentHash: 'same-hash-123',
      targetLevel: 3,
      originalFileName: 'hero_v2.webp',
    };

    const saved1 = await avatarAssetService.saveAvatarAsset(asset1);
    const saved2 = await avatarAssetService.saveAvatarAsset(asset2);

    // Should return existing asset ID instead of creating a second row
    expect(saved2.id).toBe(saved1.id);

    const allInDb = await db.avatarAssets.toArray();
    expect(allInDb.length).toBe(1);
  });
});

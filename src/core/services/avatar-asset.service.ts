import { db } from '../database/db';
import type { AvatarAsset } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export interface AvatarImageValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProcessedAvatarAsset {
  id: string;
  blob: Blob;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
  objectUrl: string;
  contentHash?: string;
  targetLevel?: number;
  originalFileName?: string;
}

export const AVATAR_ASSET_CONFIG = {
  MAX_INPUT_SIZE_BYTES: 2 * 1024 * 1024, // 2 MiB
  MAX_DIMENSION: 1024, // 1024 px max
  TARGET_DIMENSION: 320, // 320x320 for optimal avatar display
  WEBP_QUALITY: 0.85, // 85% WebP quality for crisp details and small file size
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp'],
  ALLOWED_MIMES: ['image/png', 'image/jpeg', 'image/webp'] as const,
};

/**
 * Kiểm tra magic bytes của mảng nhị phân để nhận diện MIME thực tế
 */
export function detectAvatarMagicBytes(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Tính toán mã băm SHA-256 (hoặc fallback) từ buffer nhị phân để chống trùng lặp
 */
export async function computeBufferHash(buffer: ArrayBuffer): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if subtle crypto is unavailable
  }

  let hash = 0;
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < Math.min(bytes.length, 1024); i++) {
    hash = (hash << 5) - hash + bytes[i]!;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Xác thực tính hợp lệ của file ảnh avatar tải lên
 */
export async function validateAvatarImageFile(file: File): Promise<AvatarImageValidationResult> {
  if (!file) {
    return { valid: false, error: 'Vui lòng chọn một file ảnh.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File ảnh không có dữ liệu.' };
  }

  if (file.size > AVATAR_ASSET_CONFIG.MAX_INPUT_SIZE_BYTES) {
    return { valid: false, error: 'Dung lượng ảnh vượt quá giới hạn tối đa 2 MB.' };
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.svg')) {
    return { valid: false, error: 'Vì lý do an toàn, không hỗ trợ tải lên file SVG. Vui lòng sử dụng ảnh PNG, WebP hoặc JPG.' };
  }

  const hasValidExt = AVATAR_ASSET_CONFIG.ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return { valid: false, error: 'Định dạng file không được hỗ trợ. Vui lòng chọn ảnh PNG, JPG hoặc WebP.' };
  }

  // Check magic bytes
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const detected = detectAvatarMagicBytes(bytes);

    if (!detected) {
      return { valid: false, error: 'Nội dung file không hợp lệ hoặc bị hỏng.' };
    }

    return { valid: true, detectedMimeType: detected };
  } catch (err) {
    return { valid: false, error: 'Không thể đọc nội dung file ảnh.' };
  }
}

/**
 * Xử lý resize/crop 1:1, nén tối ưu (WebP 85% / PNG) và băm nội dung client-side
 */
export async function processAvatarImage(
  file: File,
  options?: { targetLevel?: number; targetDimension?: number }
): Promise<ProcessedAvatarAsset> {
  const validation = await validateAvatarImageFile(file);
  if (!validation.valid || !validation.detectedMimeType) {
    throw new Error(validation.error || 'Ảnh không hợp lệ.');
  }

  const originalMime = validation.detectedMimeType;
  const targetDimension = options?.targetDimension || AVATAR_ASSET_CONFIG.TARGET_DIMENSION;
  const targetLevel = options?.targetLevel;
  const originalFileName = file.name;

  // Compute content hash
  let contentHash: string | undefined;
  try {
    const fileBuffer = await file.arrayBuffer();
    contentHash = await computeBufferHash(fileBuffer);
  } catch {
    // Ignore hash error
  }

  // Load into Image element
  return new Promise((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);

      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (naturalWidth === 0 || naturalHeight === 0) {
        reject(new Error('Kích thước ảnh không hợp lệ.'));
        return;
      }

      // Center crop square
      const minSide = Math.min(naturalWidth, naturalHeight);
      const cropX = (naturalWidth - minSide) / 2;
      const cropY = (naturalHeight - minSide) / 2;

      // Target size
      const targetSize = Math.min(minSide, targetDimension);

      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: use raw file blob
        const id = generateUUID();
        const objectUrl = URL.createObjectURL(file);
        resolve({
          id,
          blob: file,
          mimeType: originalMime,
          width: naturalWidth,
          height: naturalHeight,
          sizeBytes: file.size,
          objectUrl,
          contentHash,
          targetLevel,
          originalFileName,
        });
        return;
      }

      // Draw cropped square
      ctx.drawImage(img, cropX, cropY, minSide, minSide, 0, 0, targetSize, targetSize);

      // Attempt WebP export for optimal compression, falling back to PNG if not supported
      const tryExportWebp = () => {
        try {
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob && webpBlob.type === 'image/webp') {
                const id = generateUUID();
                const objectUrl = URL.createObjectURL(webpBlob);
                resolve({
                  id,
                  blob: webpBlob,
                  mimeType: 'image/webp',
                  width: targetSize,
                  height: targetSize,
                  sizeBytes: webpBlob.size,
                  objectUrl,
                  contentHash,
                  targetLevel,
                  originalFileName,
                });
              } else {
                // Fallback to PNG
                exportPngFallback();
              }
            },
            'image/webp',
            AVATAR_ASSET_CONFIG.WEBP_QUALITY
          );
        } catch {
          exportPngFallback();
        }
      };

      const exportPngFallback = () => {
        const outputMime = originalMime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const quality = outputMime === 'image/jpeg' ? 0.9 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const id = generateUUID();
              const objectUrl = URL.createObjectURL(file);
              resolve({
                id,
                blob: file,
                mimeType: originalMime,
                width: naturalWidth,
                height: naturalHeight,
                sizeBytes: file.size,
                objectUrl,
                contentHash,
                targetLevel,
                originalFileName,
              });
              return;
            }

            const id = generateUUID();
            const objectUrl = URL.createObjectURL(blob);
            resolve({
              id,
              blob,
              mimeType: outputMime,
              width: targetSize,
              height: targetSize,
              sizeBytes: blob.size,
              objectUrl,
              contentHash,
              targetLevel,
              originalFileName,
            });
          },
          outputMime,
          quality
        );
      };

      tryExportWebp();
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new Error('Không thể tải hoặc giải mã file ảnh.'));
    };

    img.src = tempUrl;
  });
}

export class AvatarAssetService {
  private urlCache: Map<string, string> = new Map();

  /**
   * Lưu asset đã xử lý vào bảng Dexie avatarAssets
   * Tự động tái sử dụng nếu đã tồn tại cùng contentHash
   */
  async saveAvatarAsset(
    processed: ProcessedAvatarAsset,
    metadata?: { targetLevel?: number; originalFileName?: string }
  ): Promise<AvatarAsset> {
    const nowISO = new Date().toISOString();
    const targetLevel = metadata?.targetLevel ?? processed.targetLevel;
    const originalFileName = metadata?.originalFileName ?? processed.originalFileName;

    // Check if duplicate hash exists
    if (processed.contentHash) {
      const existing = await db.avatarAssets
        .filter((a) => a.contentHash === processed.contentHash)
        .first();

      if (existing) {
        // Update metadata if needed
        if (targetLevel !== undefined || originalFileName) {
          await db.avatarAssets.update(existing.id, {
            targetLevel: targetLevel ?? existing.targetLevel,
            originalFileName: originalFileName ?? existing.originalFileName,
            updatedAt: nowISO,
          });
        }
        this.urlCache.set(existing.id, processed.objectUrl);
        return {
          ...existing,
          targetLevel: targetLevel ?? existing.targetLevel,
          originalFileName: originalFileName ?? existing.originalFileName,
          updatedAt: nowISO,
        };
      }
    }

    const record: AvatarAsset = {
      id: processed.id,
      blob: processed.blob,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      contentHash: processed.contentHash,
      targetLevel,
      originalFileName,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    await db.avatarAssets.put(record);
    this.urlCache.set(record.id, processed.objectUrl);
    return record;
  }

  /**
   * Lấy asset theo ID từ IndexedDB
   */
  async getAssetById(id: string): Promise<AvatarAsset | undefined> {
    return await db.avatarAssets.get(id);
  }

  /**
   * Lấy URL hiển thị cho asset ID (quản lý qua in-memory cache)
   */
  async getAssetUrl(id: string): Promise<string | undefined> {
    if (this.urlCache.has(id)) {
      return this.urlCache.get(id);
    }

    const record = await this.getAssetById(id);
    if (!record) return undefined;

    const url = URL.createObjectURL(record.blob);
    this.urlCache.set(id, url);
    return url;
  }

  /**
   * Preload URLs cho nhiều asset IDs (tránh N+1 queries)
   */
  async preloadAssetUrls(ids: string[]): Promise<Map<string, string>> {
    const resultMap = new Map<string, string>();
    const missingIds: string[] = [];

    for (const id of ids) {
      if (this.urlCache.has(id)) {
        resultMap.set(id, this.urlCache.get(id)!);
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length > 0) {
      const records = await db.avatarAssets.where('id').anyOf(missingIds).toArray();
      for (const rec of records) {
        const url = URL.createObjectURL(rec.blob);
        this.urlCache.set(rec.id, url);
        resultMap.set(rec.id, url);
      }
    }

    return resultMap;
  }

  /**
   * Lấy danh sách ảnh đã tải lên theo từng Cấp (hoặc toàn bộ nếu không truyền level)
   */
  async getUploadedAssetsForLevel(level?: number): Promise<AvatarAsset[]> {
    let assets: AvatarAsset[];
    if (level !== undefined) {
      assets = await db.avatarAssets
        .filter((a) => a.targetLevel === level)
        .toArray();
    } else {
      assets = await db.avatarAssets.toArray();
    }

    // Sort newest first
    assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return assets;
  }

  /**
   * Lấy toàn bộ danh sách ảnh đã tải lên
   */
  async getAllUploadedAvatarAssets(): Promise<AvatarAsset[]> {
    const assets = await db.avatarAssets.toArray();
    assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return assets;
  }

  /**
   * Xóa asset khỏi IndexedDB và giải phóng cache Object URL
   */
  async deleteAvatarAsset(id: string): Promise<void> {
    await db.avatarAssets.delete(id);
    this.revokeAssetUrl(id);
  }

  /**
   * Giải phóng Object URL khi cần
   */
  revokeAssetUrl(id: string): void {
    const url = this.urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.urlCache.delete(id);
    }
  }

  /**
   * Giải phóng toàn bộ URL cache
   */
  clearCache(): void {
    for (const [, url] of this.urlCache.entries()) {
      URL.revokeObjectURL(url);
    }
    this.urlCache.clear();
  }
}

export const avatarAssetService = new AvatarAssetService();

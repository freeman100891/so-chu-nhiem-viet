import { computeSHA256 } from '../backup/crypto';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProcessedGiftImage {
  fullBlob: Blob;
  fullMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fullWidth: number;
  fullHeight: number;
  fullSizeBytes: number;
  thumbnailBlob: Blob;
  thumbnailMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
  contentHash?: string;
  originalFileName?: string;
  originalSizeBytes?: number;
}

export const GIFT_IMAGE_CONFIG = {
  MAX_INPUT_SIZE_BYTES: 5 * 1024 * 1024, // 5 MiB
  MAX_INPUT_DIMENSION: 8192, // 8192 px max per side
  MAX_PIXEL_COUNT: 20_000_000, // 20 Megapixels
  MAX_FULL_DIMENSION: 1200, // 1200 px max long edge for full image
  MAX_THUMBNAIL_DIMENSION: 320, // 320 px max long edge for thumbnail
  TARGET_FULL_SIZE_BYTES: 1024 * 1024, // 1 MiB target
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

/**
 * Kiểm tra magic bytes của mảng nhị phân để xác định định dạng ảnh thực sự
 */
export function detectMagicBytes(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
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
  // offset 0-3: 52 49 46 46 ("RIFF")
  // offset 8-11: 57 45 42 50 ("WEBP")
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
 * Xác thực toàn diện file ảnh đầu vào (Size, Extension, MIME, Magic Bytes)
 */
export async function validateGiftImageFile(file: File): Promise<ImageValidationResult> {
  if (!file) {
    return { valid: false, error: 'Vui lòng chọn một ảnh.' };
  }

  // 1. File rỗng
  if (file.size === 0) {
    return { valid: false, error: 'File ảnh không có dữ liệu.' };
  }

  // 2. Kích thước file tối đa 5MB
  if (file.size > GIFT_IMAGE_CONFIG.MAX_INPUT_SIZE_BYTES) {
    return { valid: false, error: 'Ảnh vượt quá dung lượng cho phép 5 MB.' };
  }

  // 3. Extension allowlist check
  const lowerName = file.name.toLowerCase();
  const hasValidExt = GIFT_IMAGE_CONFIG.ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return { valid: false, error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' };
  }

  // 4. MIME type check
  const declaredMime = file.type.toLowerCase();
  if (!GIFT_IMAGE_CONFIG.ALLOWED_MIMES.includes(declaredMime as any) && declaredMime !== 'image/jpg') {
    return { valid: false, error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' };
  }

  // 5. Magic Bytes Header Check
  try {
    let buffer: ArrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      buffer = await file.arrayBuffer();
    } else {
      buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    const bytes = new Uint8Array(buffer.slice(0, 16));
    const detected = detectMagicBytes(bytes);

    if (!detected) {
      return { valid: false, error: 'File đã chọn không phải ảnh hợp lệ.' };
    }

    return { valid: true, detectedMimeType: detected };
  } catch {
    return { valid: false, error: 'Không thể đọc dữ liệu file ảnh.' };
  }
}

/**
 * Tính toán kích thước mới bảo toàn tỷ lệ và không upscale
 */
export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new Error('Kích thước ảnh không hợp lệ.');
  }

  if (srcWidth <= maxDimension && srcHeight <= maxDimension) {
    return { width: srcWidth, height: srcHeight };
  }

  if (srcWidth >= srcHeight) {
    const width = maxDimension;
    const height = Math.max(1, Math.round((srcHeight * maxDimension) / srcWidth));
    return { width, height };
  } else {
    const height = maxDimension;
    const width = Math.max(1, Math.round((srcWidth * maxDimension) / srcHeight));
    return { width, height };
  }
}

/**
 * Helper decode ảnh an toàn bằng HTMLImageElement
 */
function decodeImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh này. Vui lòng chọn ảnh khác.'));
    };

    img.src = url;
  });
}

/**
 * Render canvas thành Blob với MIME type và Quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Lỗi chuyển đổi Canvas sang Blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Xử lý, resize, nén và chuẩn hóa ảnh quà tặng (loại bỏ EXIF/GPS, tạo Full + Thumbnail)
 */
export async function processGiftImage(file: File): Promise<ProcessedGiftImage> {
  // 1. Xác thực file
  const validation = await validateGiftImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Ảnh không hợp lệ.');
  }

  // 2. Decode ảnh
  let img: HTMLImageElement;
  try {
    img = await decodeImageElement(file);
  } catch (err: any) {
    throw new Error(err?.message || 'Không thể đọc ảnh này. Vui lòng chọn ảnh khác.');
  }

  const rawWidth = img.naturalWidth || img.width;
  const rawHeight = img.naturalHeight || img.height;

  // 3. Kiểm tra dimensions & pixel count
  if (rawWidth <= 0 || rawHeight <= 0) {
    throw new Error('Kích thước ảnh không hợp lệ.');
  }

  if (
    rawWidth > GIFT_IMAGE_CONFIG.MAX_INPUT_DIMENSION ||
    rawHeight > GIFT_IMAGE_CONFIG.MAX_INPUT_DIMENSION ||
    rawWidth * rawHeight > GIFT_IMAGE_CONFIG.MAX_PIXEL_COUNT
  ) {
    throw new Error('Kích thước ảnh quá lớn để xử lý an toàn.');
  }

  // Quyết định output MIME:
  // Ưu tiên WebP; nếu ảnh PNG có transparency thì giữ PNG/WebP; còn lại JPEG
  const preferredMime: 'image/jpeg' | 'image/png' | 'image/webp' =
    validation.detectedMimeType === 'image/png' ? 'image/png' : 'image/webp';

  // 4. Tạo Full Image (Max 1200px)
  const fullDim = calculateTargetDimensions(rawWidth, rawHeight, GIFT_IMAGE_CONFIG.MAX_FULL_DIMENSION);
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = fullDim.width;
  fullCanvas.height = fullDim.height;

  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) {
    throw new Error('Không thể khởi tạo canvas context.');
  }

  // Vẽ ảnh (tự động strip EXIF/GPS và chuẩn hóa orientation)
  fullCtx.drawImage(img, 0, 0, fullDim.width, fullDim.height);

  let fullBlob = await canvasToBlob(fullCanvas, preferredMime, 0.85);

  // Fallback JPEG nếu browser không hỗ trợ toBlob webp và trả về rỗng/png
  let fullMimeType: 'image/jpeg' | 'image/png' | 'image/webp' = preferredMime;
  if (!fullBlob.type.includes(preferredMime)) {
    fullMimeType = 'image/jpeg';
    fullBlob = await canvasToBlob(fullCanvas, 'image/jpeg', 0.85);
  }

  // 5. Tạo Thumbnail Image (Max 320px)
  const thumbDim = calculateTargetDimensions(rawWidth, rawHeight, GIFT_IMAGE_CONFIG.MAX_THUMBNAIL_DIMENSION);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbDim.width;
  thumbCanvas.height = thumbDim.height;

  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) {
    throw new Error('Không thể khởi tạo thumbnail canvas context.');
  }

  thumbCtx.drawImage(img, 0, 0, thumbDim.width, thumbDim.height);

  let thumbBlob = await canvasToBlob(thumbCanvas, preferredMime, 0.8);
  let thumbMimeType: 'image/jpeg' | 'image/png' | 'image/webp' = preferredMime;
  if (!thumbBlob.type.includes(preferredMime)) {
    thumbMimeType = 'image/jpeg';
    thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.8);
  }

  // 6. Tính toán Content Hash SHA-256 của Full Blob
  let contentHash: string | undefined;
  try {
    const fullArrayBuffer = await fullBlob.arrayBuffer();
    const bytes = new Uint8Array(fullArrayBuffer);
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]!);
    }
    contentHash = await computeSHA256(binaryStr);
  } catch {
    // Optional hash computation
  }

  // Dọn dẹp canvas
  fullCanvas.width = 0;
  fullCanvas.height = 0;
  thumbCanvas.width = 0;
  thumbCanvas.height = 0;

  return {
    fullBlob,
    fullMimeType,
    fullWidth: fullDim.width,
    fullHeight: fullDim.height,
    fullSizeBytes: fullBlob.size,
    thumbnailBlob: thumbBlob,
    thumbnailMimeType: thumbMimeType,
    thumbnailWidth: thumbDim.width,
    thumbnailHeight: thumbDim.height,
    thumbnailSizeBytes: thumbBlob.size,
    contentHash,
    originalFileName: file.name.slice(0, 100),
    originalSizeBytes: file.size,
  };
}

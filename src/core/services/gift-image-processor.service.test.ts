import { describe, it, expect } from 'vitest';
import {
  detectMagicBytes,
  validateGiftImageFile,
  calculateTargetDimensions,
  GIFT_IMAGE_CONFIG,
} from './gift-image-processor.service';

describe('GiftImageProcessor Unit & Security Tests (FEAT-GIFT-003)', () => {
  it('1. Should detect JPEG magic bytes (FF D8 FF)', () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectMagicBytes(jpegBytes)).toBe('image/jpeg');
  });

  it('2. Should detect PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectMagicBytes(pngBytes)).toBe('image/png');
  });

  it('3. Should detect WebP magic bytes (RIFF...WEBP)', () => {
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20,
    ]);
    expect(detectMagicBytes(webpBytes)).toBe('image/webp');
  });

  it('4. Should reject unknown magic bytes or fake files', () => {
    const fakeBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // GIF
    expect(detectMagicBytes(fakeBytes)).toBeNull();

    const textBytes = new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e, 0x00, 0x00, 0x00, 0x00]); // <script>
    expect(detectMagicBytes(textBytes)).toBeNull();
  });

  it('5. Should reject empty file (0 bytes)', async () => {
    const emptyFile = new File([], 'test.jpg', { type: 'image/jpeg' });
    const result = await validateGiftImageFile(emptyFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('không có dữ liệu');
  });

  it('6. Should reject file exceeding 5MB max size limit', async () => {
    const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)]);
    const bigFile = new File([bigBlob], 'big.png', { type: 'image/png' });
    const result = await validateGiftImageFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MB');
  });

  it('7. Should reject unallowed extensions (SVG, PDF, HTML, EXE)', async () => {
    const svgFile = new File([new Uint8Array([1, 2, 3])], 'vector.svg', { type: 'image/svg+xml' });
    const svgResult = await validateGiftImageFile(svgFile);
    expect(svgResult.valid).toBe(false);

    const exeFile = new File([new Uint8Array([1, 2, 3])], 'app.exe', { type: 'application/octet-stream' });
    const exeResult = await validateGiftImageFile(exeFile);
    expect(exeResult.valid).toBe(false);
  });

  it('8. Should reject renamed fake file with valid extension but invalid magic bytes', async () => {
    const fakeContent = new TextEncoder().encode('<html><body>Fake Image</body></html>');
    const fakeFile = new File([fakeContent], 'photo.jpg', { type: 'image/jpeg' });
    const result = await validateGiftImageFile(fakeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('không phải ảnh hợp lệ');
  });

  it('9. Should validate legitimate PNG file with valid signature and extension', async () => {
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
    const validFile = new File([validPngBytes], 'pen.png', { type: 'image/png' });
    const result = await validateGiftImageFile(validFile);
    expect(result.valid).toBe(true);
    expect(result.detectedMimeType).toBe('image/png');
  });

  it('10. calculateTargetDimensions should resize landscape, portrait and not upscale small image', () => {
    // Small image: No upscale
    const small = calculateTargetDimensions(200, 150, GIFT_IMAGE_CONFIG.MAX_FULL_DIMENSION);
    expect(small).toEqual({ width: 200, height: 150 });

    // Large landscape (2400x1200 -> 1200x600)
    const landscape = calculateTargetDimensions(2400, 1200, 1200);
    expect(landscape).toEqual({ width: 1200, height: 600 });

    // Large portrait (1000x2000 -> 600x1200)
    const portrait = calculateTargetDimensions(1000, 2000, 1200);
    expect(portrait).toEqual({ width: 600, height: 1200 });

    // Thumbnail scale (1200x600 -> 320x160)
    const thumb = calculateTargetDimensions(1200, 600, 320);
    expect(thumb).toEqual({ width: 320, height: 160 });
  });
});

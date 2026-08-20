import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GiftImageUploadField } from './GiftImageUploadField';
import { giftImageService } from '../../../core/services/gift-image.service';

describe('GiftImageUploadField Component Tests (FEAT-GIFT-003)', () => {
  const onImageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Should render empty dropzone with label, instructions and file input', () => {
    render(
      <GiftImageUploadField
        hasExistingImage={false}
        onImageChange={onImageChange}
      />
    );

    expect(screen.getByText('Hình ảnh quà tặng')).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, WebP tối đa 5 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/Bấm để chọn ảnh hoặc kéo thả vào đây/i)).toBeInTheDocument();
  });

  it('2. Should render existing image preview with Replace and Remove buttons', () => {
    render(
      <GiftImageUploadField
        hasExistingImage={true}
        existingImageUrl="https://example.com/gift.png"
        onImageChange={onImageChange}
      />
    );

    const img = screen.getByAltText('Xem trước hình ảnh món quà');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/gift.png');

    expect(screen.getByRole('button', { name: /Thay ảnh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xóa ảnh/i })).toBeInTheDocument();
  });

  it('3. Should mark pending removal when clicking Xóa ảnh', () => {
    render(
      <GiftImageUploadField
        hasExistingImage={true}
        existingImageUrl="https://example.com/gift.png"
        onImageChange={onImageChange}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /Xóa ảnh/i });
    fireEvent.click(removeBtn);

    expect(onImageChange).toHaveBeenCalledWith(null, true);
    expect(screen.getByText(/Ảnh sẽ bị xóa khi bấm "Lưu thay đổi"/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hoàn tác/i })).toBeInTheDocument();
  });

  it('4. Should handle file upload and show processed image preview', async () => {
    const mockProcessed = {
      fullBlob: new Blob([new Uint8Array(1000)], { type: 'image/webp' }),
      fullMimeType: 'image/webp' as const,
      fullWidth: 800,
      fullHeight: 600,
      fullSizeBytes: 1000,
      thumbnailBlob: new Blob([new Uint8Array(200)], { type: 'image/webp' }),
      thumbnailMimeType: 'image/webp' as const,
      thumbnailWidth: 320,
      thumbnailHeight: 240,
      thumbnailSizeBytes: 200,
      originalFileName: 'pencil.png',
      originalSizeBytes: 4000,
    };

    vi.spyOn(giftImageService, 'validateFile').mockResolvedValue({ valid: true, detectedMimeType: 'image/png' });
    vi.spyOn(giftImageService, 'processAndPrepare').mockResolvedValue(mockProcessed);

    render(
      <GiftImageUploadField
        hasExistingImage={false}
        onImageChange={onImageChange}
      />
    );

    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([validPngBytes], 'pencil.png', { type: 'image/png' });

    const input = screen.getByLabelText(/Hình ảnh quà tặng/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledWith(mockProcessed, false);
    });

    expect(await screen.findByText('Ảnh mới sẵn sàng lưu')).toBeInTheDocument();
    expect(screen.getByText(/800 × 600 px/i)).toBeInTheDocument();
  });
});

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Kiểm tra định dạng MIME type và dung lượng file ảnh trước khi xử lý
 */
export function validateImageFile(file: File): ImageValidationResult {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận các định dạng ảnh: JPG, JPEG, PNG, WEBP.',
    };
  }

  const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: 'Kích thước file ảnh không được vượt quá 2MB.',
    };
  }

  return { valid: true };
}

/**
 * Resize nén ảnh phía client bằng HTML5 Canvas API (mặc định tối đa 256x256 px)
 * Trả về chuỗi base64 data URL gọn nhẹ để lưu trữ trong IndexedDB
 */
export function resizeImageFile(
  file: File,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Lỗi khi đọc định dạng ảnh'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh'));
    reader.readAsDataURL(file);
  });
}

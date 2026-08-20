/**
 * Chuẩn hóa chuỗi tiếng Việt thành chuỗi chữ thường không dấu
 * Ví dụ: "Nguyễn Văn An" -> "nguyen van an"
 */
export function normalizeVietnameseText(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
    .replace(/\s+/g, ' ');
}

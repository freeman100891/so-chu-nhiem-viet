/**
 * Trả về chuỗi ngày hôm nay theo múi giờ địa phương dạng YYYY-MM-DD.
 * Tránh việc dùng toISOString() gây lệch múi giờ UTC.
 */
export function getTodayDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuyển YYYY-MM-DD sang định dạng ngày Việt Nam DD/MM/YYYY
 */
export function formatDateVietnamese(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Trả về thời gian hiện tại ISO UTC string cho timestamp audit/database
 */
export function getISOUtcString(): string {
  return new Date().toISOString();
}

/**
 * Đảm bảo chuỗi ngày hợp lệ YYYY-MM-DD
 */
export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateStr);
}

/**
 * Định dạng ngày giờ dạng HH:mm - DD/MM/YYYY
 */
export function formatDateTimeVietnamese(isoString?: string | null): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}


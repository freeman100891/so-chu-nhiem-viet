/**
 * Utility functions for Excel data parsing, serial date conversion, HTML sanitization, and formula injection defense
 */

/**
 * Phòng chống tấn công Formula Injection (chuyển các ô bắt đầu bằng =, +, -, @ thành dạng text an toàn '=...)
 */
export function escapeFormulaInjection(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@') ||
    trimmed.startsWith('\t') ||
    trimmed.startsWith('\r')
  ) {
    return `'${trimmed}`;
  }
  return value;
}

/**
 * Sanitize text nội dung loại bỏ thẻ HTML nguy hiểm
 */
export function sanitizeCellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Strip basic HTML tags
  return str.replace(/<[^>]*>?/gm, '');
}

/**
 * Chuyển đổi linh hoạt giữa Excel Serial Date Number (VD: 39448 -> 2008-01-01), text DD/MM/YYYY và ISO YYYY-MM-DD
 */
export function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  // Case 1: JS Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0]!;
  }

  // Case 2: Excel Serial Number (e.g. 39448)
  if (typeof value === 'number' || (!isNaN(Number(value)) && !String(value).includes('/')) && !String(value).includes('-')) {
    const serial = Number(value);
    if (serial > 1000 && serial < 100000) {
      // Excel epoch starts Jan 1 1900. 25569 days between 1900-01-01 and 1970-01-01
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return dateInfo.toISOString().split('T')[0]!;
    }
  }

  const str = String(value).trim();

  // Case 3: Standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Case 4: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1]!.padStart(2, '0');
    const month = dmyMatch[2]!.padStart(2, '0');
    const year = dmyMatch[3]!;
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Kiểm tra định dạng số điện thoại Việt Nam hợp lệ
 */
export function validateVietnamesePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const cleanPhone = phone.replace(/[\s\-.+]/g, '');
  return /^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone);
}

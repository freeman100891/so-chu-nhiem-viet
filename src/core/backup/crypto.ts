/**
 * Cryptographic utilities using Web Crypto API for SHA-256 checksums and PBKDF2 + AES-GCM 256-bit encryption
 */

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Tính mã băm SHA-256 cho chuỗi văn bản
 */
export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Dẫn xuất khóa mã hóa AES-GCM từ mật khẩu người dùng qua PBKDF2 (100,000 vòng lặp)
 */
async function deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedDataPayload {
  cipherText: string; // Base64
  salt: string; // Base64
  iv: string; // Base64
}

/**
 * Mã hóa chuỗi văn bản bằng AES-GCM 256-bit
 */
export async function encryptPayload(text: string, password: string): Promise<EncryptedDataPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAESKey(password, salt);

  const encoder = new TextEncoder();
  const textBuffer = encoder.encode(text);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textBuffer
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Giải mã chuỗi văn bản AES-GCM 256-bit
 */
export async function decryptPayload(payload: EncryptedDataPayload, password: string): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const encryptedBuffer = base64ToBuffer(payload.cipherText);

  const key = await deriveAESKey(password, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

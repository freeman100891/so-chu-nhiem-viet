import { describe, it, expect } from 'vitest';
import { generateUUID } from './uuid';

describe('generateUUID Utility Tests', () => {
  it('should generate a valid RFC4122 v4 UUID format', () => {
    const id = generateUUID();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate unique UUIDs on consecutive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUUID());
    }
    expect(ids.size).toBe(100);
  });

  it('should fallback gracefully when crypto.randomUUID is undefined (e.g. non-secure HTTP context)', () => {
    // Mock crypto without randomUUID
    const originalRandomUUID = crypto.randomUUID;
    // @ts-expect-error test fallback
    crypto.randomUUID = undefined;

    const fallbackId = generateUUID();
    expect(fallbackId).toBeDefined();
    expect(fallbackId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Restore
    crypto.randomUUID = originalRandomUUID;
  });
});

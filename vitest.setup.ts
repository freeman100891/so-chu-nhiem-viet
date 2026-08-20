import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Polyfill URL.createObjectURL and URL.revokeObjectURL for JSDOM
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => `blob:http://localhost/${Math.random().toString(36).substring(2)}`);
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }

  // Polyfill HTMLCanvasElement.prototype.toBlob if missing
  if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
    HTMLCanvasElement.prototype.toBlob = function (callback, type = 'image/jpeg', quality = 0.85) {
      setTimeout(() => {
        const dummyBlob = new Blob([new Uint8Array([1, 2, 3, 4])], { type });
        callback(dummyBlob);
      }, 0);
    };
  }
}

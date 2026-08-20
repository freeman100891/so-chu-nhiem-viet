import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { generateUUID } from './shared/utilities/uuid';
import './index.css';

// Polyfill crypto.randomUUID for non-secure HTTP contexts (e.g. accessing via local IP http://192.168.x.x)
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    // @ts-expect-error polyfill window.crypto
    window.crypto = {};
  }
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = generateUUID as unknown as () => `${string}-${string}-${string}-${string}-${string}`;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

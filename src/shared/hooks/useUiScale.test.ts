import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUiScale } from './useUiScale';

describe('useUiScale Hook Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-ui-scale');
  });

  it('should initialize with default auto density when nothing is stored', () => {
    const { result } = renderHook(() => useUiScale());
    expect(result.current.density).toBe('auto');
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
  });

  it('should update density to large and set data-density attribute and localStorage', () => {
    const { result } = renderHook(() => useUiScale());

    act(() => {
      result.current.setDensity('large');
    });

    expect(result.current.density).toBe('large');
    expect(document.documentElement.getAttribute('data-density')).toBe('large');
    expect(localStorage.getItem('online-classroom-density')).toBe('large');
  });

  it('should update density to compact and restore to auto', () => {
    const { result } = renderHook(() => useUiScale());

    act(() => {
      result.current.setDensity('compact');
    });
    expect(result.current.density).toBe('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');

    act(() => {
      result.current.setDensity('auto');
    });
    expect(result.current.density).toBe('auto');
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
  });

  it('should handle presentation mode toggling', async () => {
    const { result } = renderHook(() => useUiScale());

    await act(async () => {
      await result.current.enterPresentationMode();
    });

    expect(result.current.isPresentationMode).toBe(true);
    expect(document.documentElement.getAttribute('data-ui-scale')).toBe('presentation');

    await act(async () => {
      await result.current.exitPresentationMode();
    });

    expect(result.current.isPresentationMode).toBe(false);
    expect(document.documentElement.hasAttribute('data-ui-scale')).toBe(false);
  });
});

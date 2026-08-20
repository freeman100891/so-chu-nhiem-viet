import { useState, useEffect, useCallback } from 'react';

export type UiDensityMode = 'auto' | 'large' | 'medium' | 'compact';

export const useUiScale = () => {
  const [density, setDensityState] = useState<UiDensityMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = localStorage.getItem('online-classroom-density') as UiDensityMode;
    return saved && ['auto', 'large', 'medium', 'compact'].includes(saved) ? saved : 'auto';
  });

  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(document.fullscreenElement);
  });

  // Apply density data attribute to html element
  const setDensity = useCallback((mode: UiDensityMode) => {
    setDensityState(mode);
    try {
      localStorage.setItem('online-classroom-density', mode);
      localStorage.setItem('ui-scale-mode', mode);
    } catch {
      // safe fallback if storage is restricted
    }

    if (typeof document !== 'undefined') {
      if (mode === 'auto') {
        document.documentElement.removeAttribute('data-density');
      } else {
        document.documentElement.setAttribute('data-density', mode);
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (density && density !== 'auto') {
      document.documentElement.setAttribute('data-density', density);
    } else {
      document.documentElement.removeAttribute('data-density');
    }
  }, [density]);

  // Handle Fullscreen presentation mode
  const enterPresentationMode = useCallback(async () => {
    setIsPresentationMode(true);
    document.documentElement.setAttribute('data-ui-scale', 'presentation');
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request denied or not supported:', err);
    }
  }, []);

  const exitPresentationMode = useCallback(async () => {
    setIsPresentationMode(false);
    document.documentElement.removeAttribute('data-ui-scale');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  }, []);

  const togglePresentationMode = useCallback(() => {
    if (isPresentationMode) {
      exitPresentationMode();
    } else {
      enterPresentationMode();
    }
  }, [isPresentationMode, enterPresentationMode, exitPresentationMode]);

  // Sync fullscreen change with presentation state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsPresentationMode(isFs);
      if (isFs) {
        document.documentElement.setAttribute('data-ui-scale', 'presentation');
      } else {
        document.documentElement.removeAttribute('data-ui-scale');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return {
    density,
    setDensity,
    isPresentationMode,
    enterPresentationMode,
    exitPresentationMode,
    togglePresentationMode,
  };
};

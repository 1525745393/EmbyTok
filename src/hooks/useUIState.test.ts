import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from './useUIState';

describe('useUIState hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isMenuOpen).toBe(false);
      expect(result.current.isMuted).toBe(true);
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isAutoPlay).toBe(false);
    });

    it('should have toggle functions', () => {
      const { result } = renderHook(() => useUIState());

      expect(typeof result.current.toggleFullscreen).toBe('function');
      expect(typeof result.current.toggleMute).toBe('function');
      expect(typeof result.current.toggleAutoPlay).toBe('function');
    });
  });

  describe('toggleMute', () => {
    it('should toggle isMuted state', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
    });
  });

  describe('toggleAutoPlay', () => {
    it('should toggle isAutoPlay state', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isAutoPlay).toBe(false);

      act(() => {
        result.current.toggleAutoPlay();
      });

      expect(result.current.isAutoPlay).toBe(true);

      act(() => {
        result.current.toggleAutoPlay();
      });

      expect(result.current.isAutoPlay).toBe(false);
    });
  });

  describe('toggleFullscreen', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useUIState());
      expect(typeof result.current.toggleFullscreen).toBe('function');
    });
  });

  describe('setIsMenuOpen', () => {
    it('should set menu open state', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isMenuOpen).toBe(false);

      act(() => {
        result.current.setIsMenuOpen(true);
      });

      expect(result.current.isMenuOpen).toBe(true);

      act(() => {
        result.current.setIsMenuOpen(false);
      });

      expect(result.current.isMenuOpen).toBe(false);
    });
  });

  describe('orientation mode', () => {
    it('should have orientationMode state', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current).toHaveProperty('orientationMode');
      expect(result.current.orientationMode).toBe('vertical'); // 默认值
    });

    it('should have setOrientationMode function', () => {
      const { result } = renderHook(() => useUIState());

      expect(typeof result.current.setOrientationMode).toBe('function');
    });
  });
});

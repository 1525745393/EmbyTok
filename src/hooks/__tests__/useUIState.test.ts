import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../useUIState';

describe('useUIState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUIState());

    expect(result.current.isMenuOpen).toBe(false);
    expect(result.current.isMuted).toBe(true);
    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.isAutoPlay).toBe(false);
    expect(result.current.orientationMode).toBe('vertical');
  });

  it('should toggle menu open state', () => {
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

  it('should toggle mute state', () => {
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

  it('should toggle auto play state', () => {
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

  it('should set auto play directly', () => {
    const { result } = renderHook(() => useUIState());

    act(() => {
      result.current.setIsAutoPlay(true);
    });

    expect(result.current.isAutoPlay).toBe(true);

    act(() => {
      result.current.setIsAutoPlay(false);
    });

    expect(result.current.isAutoPlay).toBe(false);
  });

  it('should set mute directly', () => {
    const { result } = renderHook(() => useUIState());

    act(() => {
      result.current.setIsMuted(false);
    });

    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.setIsMuted(true);
    });

    expect(result.current.isMuted).toBe(true);
  });

  it('should persist orientation mode in localStorage', () => {
    const { result } = renderHook(() => useUIState());

    expect(result.current.orientationMode).toBe('vertical');
    expect(localStorage.getItem('embyOrientationMode')).toBe('"vertical"');

    act(() => {
      result.current.setOrientationMode('horizontal');
    });

    expect(result.current.orientationMode).toBe('horizontal');
    expect(localStorage.getItem('embyOrientationMode')).toBe('"horizontal"');

    act(() => {
      result.current.setOrientationMode('both');
    });

    expect(result.current.orientationMode).toBe('both');
    expect(localStorage.getItem('embyOrientationMode')).toBe('"both"');

    act(() => {
      result.current.setOrientationMode('vertical');
    });

    expect(result.current.orientationMode).toBe('vertical');
    expect(localStorage.getItem('embyOrientationMode')).toBe('"vertical"');
  });

  it('should load orientation mode from localStorage', () => {
    localStorage.setItem('embyOrientationMode', '"horizontal"');

    const { result } = renderHook(() => useUIState());

    expect(result.current.orientationMode).toBe('horizontal');
  });
});

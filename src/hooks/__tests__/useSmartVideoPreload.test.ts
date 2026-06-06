import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartVideoPreload } from '../useSmartVideoPreload';
import type { EmbyItem } from '../../../types';

describe('useSmartVideoPreload Hook', () => {
  const mockVideos: EmbyItem[] = [
    { Id: 'video1', Name: 'Video 1', Type: 'Video', MediaType: 'Video' },
    { Id: 'video2', Name: 'Video 2', Type: 'Video', MediaType: 'Video' },
    { Id: 'video3', Name: 'Video 3', Type: 'Video', MediaType: 'Video' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSmartVideoPreload(mockVideos, 0));

    expect(result.current.networkQuality).toBe('unknown');
    expect(result.current.scrollSpeed).toBe(0);
    expect(result.current.scrollDirection).toBe('none');
    expect(typeof result.current.isPreloaded).toBe('function');
    expect(typeof result.current.getCacheStatus).toBe('function');
    expect(typeof result.current.updateScrollSpeed).toBe('function');
  });

  it('should accept custom configuration', () => {
    const { result } = renderHook(() =>
      useSmartVideoPreload(mockVideos, 0, {
        enabled: true,
        preloadBuffer: 15,
        nextVideoPreloadSeconds: 10,
        maxCachedVideos: 5,
      })
    );

    expect(result.current.config).toBeDefined();
  });

  it('should expose preload methods', () => {
    const { result } = renderHook(() => useSmartVideoPreload(mockVideos, 0, { enabled: false }));

    expect(typeof result.current.isPreloaded).toBe('function');
    expect(typeof result.current.getCacheStatus).toBe('function');
  });

  it('should handle scroll speed updates', () => {
    const { result } = renderHook(() => useSmartVideoPreload(mockVideos, 0));

    expect(typeof result.current.updateScrollSpeed).toBe('function');

    act(() => {
      result.current.updateScrollSpeed(100);
    });
  });

  it('should handle empty video list', () => {
    const { result } = renderHook(() => useSmartVideoPreload([], 0));

    expect(result.current.isPreloaded('video1')).toBe(false);
  });
});

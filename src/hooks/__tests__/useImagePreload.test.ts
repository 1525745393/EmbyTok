import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImagePreload } from '../useImagePreload';
import type { MediaClient } from '../../../services/MediaClient';
import type { EmbyItem } from '../../../types';

describe('useImagePreload Hook', () => {
  const mockClient = {
    getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
  } as unknown as MediaClient;

  const mockVideos: EmbyItem[] = [
    {
      Id: 'video1',
      Name: 'Video 1',
      Type: 'Video',
      MediaType: 'Video',
      ImageTags: { Primary: 'primary1' },
    },
    {
      Id: 'video2',
      Name: 'Video 2',
      Type: 'Video',
      MediaType: 'Video',
      ImageTags: { Primary: 'primary2' },
    },
    {
      Id: 'video3',
      Name: 'Video 3',
      Type: 'Video',
      MediaType: 'Video',
      ImageTags: { Primary: 'primary3' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize and expose methods', () => {
    const { result } = renderHook(() =>
      useImagePreload(mockVideos, 0, mockClient, { enabled: false })
    );

    expect(typeof result.current.getPreloadStatus).toBe('function');
    expect(typeof result.current.isPreloaded).toBe('function');
  });

  it('should return pending status for unloaded items', () => {
    const { result } = renderHook(() => useImagePreload(mockVideos, 0, mockClient));

    expect(result.current.getPreloadStatus('video1')).toBe('pending');
    expect(result.current.isPreloaded('video1')).toBe(false);
  });

  it('should accept configuration options', () => {
    const { result } = renderHook(() =>
      useImagePreload(mockVideos, 0, mockClient, {
        enabled: false,
        preloadCount: 2,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should handle empty video list', () => {
    const { result } = renderHook(() => useImagePreload([], 0, mockClient));

    expect(result.current.preloadStatus).toEqual({});
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoList } from '../useVideoList';
import type { MediaClient } from '../../../services/MediaClient';
import type { EmbyItem, EmbyLibrary, FeedType, OrientationMode } from '../../../types';

describe('useVideoList Hook', () => {
  const mockClient = {
    getVideos: vi.fn(),
    getFavorites: vi.fn(),
    toggleFavorite: vi.fn(),
    deleteItem: vi.fn(),
  } as unknown as MediaClient;

  const mockLibrary: EmbyLibrary = {
    Id: 'lib1',
    Name: 'Movies',
    CollectionType: 'movies',
  };

  const mockVideo1: EmbyItem = {
    Id: 'video1',
    Name: 'Test Video 1',
    Type: 'Video',
    MediaType: 'Video',
  };

  const mockVideo2: EmbyItem = {
    Id: 'video2',
    Name: 'Test Video 2',
    Type: 'Video',
    MediaType: 'Video',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty state when no client', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    expect(result.current.videos).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.navStack).toEqual([]);
  });

  it('should expose all necessary methods and state', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    expect(typeof result.current.loadVideos).toBe('function');
    expect(typeof result.current.toggleFavorite).toBe('function');
    expect(typeof result.current.deleteVideo).toBe('function');
    expect(typeof result.current.navigateTo).toBe('function');
    expect(typeof result.current.navigateBack).toBe('function');
    expect(typeof result.current.selectVideo).toBe('function');
    expect(typeof result.current.setViewMode).toBe('function');
    expect(typeof result.current.setCurrentIndex).toBe('function');
  });

  it('should manage navigation stack', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    expect(result.current.navStack).toEqual([]);

    act(() => {
      result.current.navigateTo('folder1', 'My Folder');
    });

    expect(result.current.navStack).toEqual([{ id: 'folder1', title: 'My Folder' }]);
    expect(result.current.viewMode).toBe('grid');

    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.navStack).toEqual([]);
  });

  it('should manage view mode', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    expect(result.current.viewMode).toBe('feed');

    act(() => {
      result.current.setViewMode('grid');
    });

    expect(result.current.viewMode).toBe('grid');

    act(() => {
      result.current.setViewMode('feed');
    });

    expect(result.current.viewMode).toBe('feed');
  });

  it('should manage current index', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.setCurrentIndex(5);
    });

    expect(result.current.currentIndex).toBe(5);

    act(() => {
      result.current.selectVideo(10);
    });

    expect(result.current.currentIndex).toBe(10);
    expect(result.current.viewMode).toBe('feed');
  });

  it('should handle select video', () => {
    const { result } = renderHook(() =>
      useVideoList({
        client: null,
        selectedLib: null,
        feedType: 'latest',
        orientationMode: 'vertical',
        hiddenLibIds: new Set(),
        libraries: [],
      })
    );

    act(() => {
      result.current.setViewMode('grid');
      result.current.selectVideo(3);
    });

    expect(result.current.currentIndex).toBe(3);
    expect(result.current.viewMode).toBe('feed');
  });
});

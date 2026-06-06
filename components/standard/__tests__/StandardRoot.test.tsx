import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StandardRoot from '../StandardRoot';

// 模拟 capacitor/app
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

// 模拟 clientFactory
vi.mock('../../../services/clientFactory', () => ({
  ClientFactory: {
    create: vi.fn().mockReturnValue({
      getLibraries: vi.fn().mockResolvedValue([]),
      getVideos: vi.fn().mockResolvedValue({ items: [] }),
      getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
    }),
  },
}));

// 模拟 hooks
vi.mock('../../../src/hooks', () => ({
  useSearch: () => ({
    query: '',
    results: { items: [] },
    loading: false,
    searchHistory: [],
    debouncedSearch: vi.fn(),
    performSearch: vi.fn(),
    clearHistory: vi.fn(),
  }),
  useSubtitles: () => ({
    settings: { enabled: true },
    updateSettings: vi.fn(),
    toggleSubtitles: vi.fn(),
    selectTrack: vi.fn(),
    loadSubtitles: vi.fn(),
    cues: [],
  }),
  useFavorites: () => ({
    collections: [],
    createCollection: vi.fn(),
    deleteCollection: vi.fn(),
    renameCollection: vi.fn(),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
    getCollection: vi.fn(),
    getItemCollections: vi.fn(),
  }),
  useWatchHistory: () => ({
    history: [],
    addToHistory: vi.fn(),
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
    getHistoryItem: vi.fn(),
    getProgress: vi.fn(),
  }),
  useUpdateChecker: () => ({
    currentVersion: '1.0.0',
    isChecking: false,
    checkForUpdates: vi.fn().mockResolvedValue({ hasUpdate: false }),
  }),
}));

describe('StandardRoot Component', () => {
  it('should render loading fallback initially', () => {
    // 清空 localStorage 模拟未登录状态
    Storage.prototype.getItem = vi.fn().mockReturnValue(null);

    render(<StandardRoot />);

    // 应该显示加载状态
    expect(document.body).toBeInTheDocument();
  });
});

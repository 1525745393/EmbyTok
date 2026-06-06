import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

describe('useSearch Hook', () => {
  // Mock MediaClient
  const mockClient = {
    searchItems: vi.fn(),
  };

  const mockSearchResults = [
    { Id: 'item1', Name: 'Test Movie', Type: 'Movie' },
    { Id: 'item2', Name: 'Test Show', Type: 'Series' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSearch(null));

    expect(result.current.query).toBe('');
    expect(result.current.results.items).toEqual([]);
    expect(result.current.results.totalRecordCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.searchHistory).toEqual([]);
  });

  it('updates query state', () => {
    const { result } = renderHook(() => useSearch(null));

    act(() => {
      result.current.setQuery('test search');
    });

    expect(result.current.query).toBe('test search');
  });

  it('performs search and returns results', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.results.items).toEqual(mockSearchResults);
    expect(result.current.results.totalRecordCount).toBe(2);
    expect(mockClient.searchItems).toHaveBeenCalledWith('test query');
  });

  it('adds search to history', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('first search');
    });

    expect(result.current.searchHistory).toHaveLength(1);
    expect(result.current.searchHistory[0].query).toBe('first search');

    await act(async () => {
      await result.current.performSearch('second search');
    });

    expect(result.current.searchHistory).toHaveLength(2);
    expect(result.current.searchHistory[0].query).toBe('second search');
  });

  it('does not add empty query to history', async () => {
    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('');
    });

    expect(result.current.searchHistory).toEqual([]);
  });

  it('removes duplicate from history', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('test search');
    });

    await act(async () => {
      await result.current.performSearch('TEST SEARCH'); // Same as before, case insensitive
    });

    expect(result.current.searchHistory).toHaveLength(1);
  });

  it('removes item from history', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('test search 1');
    });

    await act(async () => {
      await result.current.performSearch('test search 2');
    });

    expect(result.current.searchHistory).toHaveLength(2);

    act(() => {
      result.current.removeFromHistory('test search 1');
    });

    expect(result.current.searchHistory).toHaveLength(1);
    expect(result.current.searchHistory[0].query).toBe('test search 2');
  });

  it('clears entire search history', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('test search 1');
    });

    await act(async () => {
      await result.current.performSearch('test search 2');
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.searchHistory).toEqual([]);
  });

  it('debounces search calls', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    act(() => {
      result.current.debouncedSearch('first query');
    });

    act(() => {
      result.current.debouncedSearch('second query');
    });

    act(() => {
      result.current.debouncedSearch('final query');
    });

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      // Wait for any pending promises
      await Promise.resolve();
    });

    // Should only call search once with the final query
    expect(mockClient.searchItems).toHaveBeenCalledTimes(1);
    expect(mockClient.searchItems).toHaveBeenCalledWith('final query');
  });

  it('clears results when query is empty', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    // First search
    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.results.items).toEqual(mockSearchResults);

    // Then clear query
    act(() => {
      result.current.debouncedSearch('');
    });

    expect(result.current.results.items).toEqual([]);
  });

  it('handles search errors gracefully', async () => {
    mockClient.searchItems.mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.results.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('persists search history in localStorage', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    await act(async () => {
      await result.current.performSearch('persisted search');
    });

    expect(localStorage.getItem('embytok_search_history')).toContain('persisted search');
  });

  it('limits search history to max items', async () => {
    mockClient.searchItems.mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch(mockClient as any));

    // Add 25 searches
    for (let i = 1; i <= 25; i++) {
      await act(async () => {
        await result.current.performSearch(`search ${i}`);
      });
    }

    expect(result.current.searchHistory).toHaveLength(20); // Should be limited to 20
  });
});

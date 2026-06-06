import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLibraries } from '../useLibraries';

describe('useLibraries Hook', () => {
  // Mock MediaClient
  const mockClient = {
    getLibraries: vi.fn(),
  };

  const mockLibraries = [
    { Id: 'lib1', Name: 'Movies', CollectionType: 'movies' },
    { Id: 'lib2', Name: 'TV Shows', CollectionType: 'tvshows' },
    { Id: 'lib3', Name: 'Music', CollectionType: 'music' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with empty state when no client', () => {
    const { result } = renderHook(() => useLibraries(null));

    expect(result.current.libraries).toEqual([]);
    expect(result.current.selectedLib).toBeNull();
    expect(result.current.hiddenLibIds).toEqual([]);
  });

  it('fetches libraries when client is available', async () => {
    mockClient.getLibraries.mockResolvedValue(mockLibraries);

    const { result } = renderHook(() => useLibraries(mockClient as any));

    // Wait for the async fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.libraries).toEqual(mockLibraries);
    expect(mockClient.getLibraries).toHaveBeenCalled();
  });

  it('allows selecting a library', () => {
    const { result } = renderHook(() => useLibraries(null));

    act(() => {
      result.current.setSelectedLib(mockLibraries[0]);
    });

    expect(result.current.selectedLib).toEqual(mockLibraries[0]);
  });

  it('toggles library visibility', () => {
    const { result } = renderHook(() => useLibraries(null));

    // Hide first library
    act(() => {
      result.current.toggleHiddenLib('lib1');
    });

    expect(result.current.hiddenLibIds).toContain('lib1');
    expect(result.current.hiddenLibIdsSet.has('lib1')).toBe(true);

    // Show first library again
    act(() => {
      result.current.toggleHiddenLib('lib1');
    });

    expect(result.current.hiddenLibIds).not.toContain('lib1');
    expect(result.current.hiddenLibIdsSet.has('lib1')).toBe(false);
  });

  it('persists hidden library IDs in localStorage', () => {
    const { result } = renderHook(() => useLibraries(null));

    act(() => {
      result.current.toggleHiddenLib('lib1');
      result.current.toggleHiddenLib('lib2');
    });

    expect(localStorage.getItem('embyHiddenLibs')).toContain('lib1');
    expect(localStorage.getItem('embyHiddenLibs')).toContain('lib2');
  });

  it('allows manually fetching libraries', async () => {
    mockClient.getLibraries.mockResolvedValue(mockLibraries);

    const { result } = renderHook(() => useLibraries(mockClient as any));

    // Wait for initial fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Call fetchLibraries again
    const updatedLibraries = [
      ...mockLibraries,
      { Id: 'lib4', Name: 'Photos', CollectionType: 'photos' },
    ];
    mockClient.getLibraries.mockResolvedValue(updatedLibraries);

    await act(async () => {
      await result.current.fetchLibraries();
    });

    expect(result.current.libraries).toEqual(updatedLibraries);
  });
});

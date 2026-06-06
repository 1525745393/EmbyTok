import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

describe('useFavorites Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default collection', () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].name).toBe('收藏');
    expect(result.current.collections[0].itemIds).toEqual([]);
  });

  it('creates a new collection', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.createCollection('My Collection');
    });

    expect(result.current.collections).toHaveLength(2);
    expect(result.current.collections[1].name).toBe('My Collection');
  });

  it('does not allow deleting default collection', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.deleteCollection('default');
    });

    expect(result.current.collections).toHaveLength(1);
  });

  it('deletes a non-default collection', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('Test Collection');
    });

    act(() => {
      result.current.deleteCollection(newCollection.id);
    });

    expect(result.current.collections).toHaveLength(1);
  });

  it('renames a collection', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('Old Name');
    });

    act(() => {
      result.current.renameCollection(newCollection.id, 'New Name');
    });

    expect(result.current.collections.find((c) => c.id === newCollection.id)?.name).toBe(
      'New Name'
    );
  });

  it('adds an item to favorites in default collection', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addToFavorites('item123');
    });

    expect(result.current.collections[0].itemIds).toContain('item123');
  });

  it('adds an item to favorites in specific collection', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('My Collection');
    });

    act(() => {
      result.current.addToFavorites('item456', newCollection.id);
    });

    expect(result.current.collections.find((c) => c.id === newCollection.id)?.itemIds).toContain(
      'item456'
    );
  });

  it('does not add duplicate items to a collection', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addToFavorites('item789');
      result.current.addToFavorites('item789');
    });

    expect(result.current.collections[0].itemIds.filter((id) => id === 'item789')).toHaveLength(1);
  });

  it('removes an item from all collections when no collection specified', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('Collection 2');
      result.current.addToFavorites('item101');
      result.current.addToFavorites('item101', newCollection.id);
    });

    act(() => {
      result.current.removeFromFavorites('item101');
    });

    expect(result.current.collections[0].itemIds).not.toContain('item101');
    expect(
      result.current.collections.find((c) => c.id === newCollection.id)?.itemIds
    ).not.toContain('item101');
  });

  it('removes an item from specific collection', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('Collection 3');
      result.current.addToFavorites('item202');
      result.current.addToFavorites('item202', newCollection.id);
    });

    act(() => {
      result.current.removeFromFavorites('item202', newCollection.id);
    });

    expect(result.current.collections[0].itemIds).toContain('item202');
    expect(
      result.current.collections.find((c) => c.id === newCollection.id)?.itemIds
    ).not.toContain('item202');
  });

  it('checks if an item is favorite in specific collection', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('My Collection');
      result.current.addToFavorites('item303', newCollection.id);
    });

    expect(result.current.isFavorite('item303', newCollection.id)).toBe(true);
    expect(result.current.isFavorite('item303')).toBe(true);
    expect(result.current.isFavorite('not-favorite')).toBe(false);
  });

  it('gets all collections', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.createCollection('Collection 1');
      result.current.createCollection('Collection 2');
    });

    const collections = result.current.getCollections();
    expect(collections).toHaveLength(3);
  });

  it('gets a specific collection by ID', () => {
    const { result } = renderHook(() => useFavorites());

    let newCollection;
    act(() => {
      newCollection = result.current.createCollection('Find Me');
    });

    const found = result.current.getCollection(newCollection.id);
    expect(found?.name).toBe('Find Me');
  });

  it('gets all collections that contain an item', () => {
    const { result } = renderHook(() => useFavorites());

    let collection1, collection2;
    act(() => {
      collection1 = result.current.createCollection('Collection A');
      collection2 = result.current.createCollection('Collection B');
      result.current.addToFavorites('shared-item', collection1.id);
      result.current.addToFavorites('shared-item', collection2.id);
    });

    const itemCollections = result.current.getItemCollections('shared-item');
    expect(itemCollections).toHaveLength(2);
  });
});

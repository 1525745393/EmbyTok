import { useCallback } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { FavoritesState, FavoriteCollection } from '../../types';

const FAVORITES_KEY = 'embytok_favorites';
const DEFAULT_COLLECTION_ID = 'default';
const DEFAULT_COLLECTION_NAME = '收藏';

export function useFavorites() {
  const [favoritesState, setFavoritesState] = useLocalStorageState<FavoritesState>(FAVORITES_KEY, {
    collections: [
      {
        id: DEFAULT_COLLECTION_ID,
        name: DEFAULT_COLLECTION_NAME,
        createdAt: Date.now(),
        itemIds: [],
      },
    ],
    defaultCollectionId: DEFAULT_COLLECTION_ID,
  });

  const createCollection = useCallback(
    (name: string) => {
      const newCollection: FavoriteCollection = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        createdAt: Date.now(),
        itemIds: [],
      };

      setFavoritesState((prev) => ({
        ...prev,
        collections: [...prev.collections, newCollection],
      }));

      return newCollection;
    },
    [setFavoritesState]
  );

  const deleteCollection = useCallback(
    (collectionId: string) => {
      if (collectionId === DEFAULT_COLLECTION_ID) return;

      setFavoritesState((prev) => ({
        ...prev,
        collections: prev.collections.filter((c) => c.id !== collectionId),
      }));
    },
    [setFavoritesState]
  );

  const renameCollection = useCallback(
    (collectionId: string, newName: string) => {
      setFavoritesState((prev) => ({
        ...prev,
        collections: prev.collections.map((c) =>
          c.id === collectionId ? { ...c, name: newName.trim() } : c
        ),
      }));
    },
    [setFavoritesState]
  );

  const addToFavorites = useCallback(
    (itemId: string, collectionId?: string) => {
      const targetCollectionId = collectionId || favoritesState.defaultCollectionId;

      setFavoritesState((prev) => ({
        ...prev,
        collections: prev.collections.map((c) => {
          if (c.id === targetCollectionId && !c.itemIds.includes(itemId)) {
            return { ...c, itemIds: [...c.itemIds, itemId] };
          }
          return c;
        }),
      }));
    },
    [favoritesState.defaultCollectionId, setFavoritesState]
  );

  const removeFromFavorites = useCallback(
    (itemId: string, collectionId?: string) => {
      if (collectionId) {
        setFavoritesState((prev) => ({
          ...prev,
          collections: prev.collections.map((c) => {
            if (c.id === collectionId) {
              return { ...c, itemIds: c.itemIds.filter((id) => id !== itemId) };
            }
            return c;
          }),
        }));
      } else {
        setFavoritesState((prev) => ({
          ...prev,
          collections: prev.collections.map((c) => ({
            ...c,
            itemIds: c.itemIds.filter((id) => id !== itemId),
          })),
        }));
      }
    },
    [setFavoritesState]
  );

  const isFavorite = useCallback(
    (itemId: string, collectionId?: string) => {
      if (collectionId) {
        const collection = favoritesState.collections.find((c) => c.id === collectionId);
        return collection?.itemIds.includes(itemId) || false;
      }
      return favoritesState.collections.some((c) => c.itemIds.includes(itemId));
    },
    [favoritesState.collections]
  );

  const getCollections = useCallback(() => {
    return favoritesState.collections;
  }, [favoritesState.collections]);

  const getCollection = useCallback(
    (collectionId: string) => {
      return favoritesState.collections.find((c) => c.id === collectionId);
    },
    [favoritesState.collections]
  );

  const getItemCollections = useCallback(
    (itemId: string) => {
      return favoritesState.collections.filter((c) => c.itemIds.includes(itemId));
    },
    [favoritesState.collections]
  );

  return {
    collections: favoritesState.collections,
    createCollection,
    deleteCollection,
    renameCollection,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getCollections,
    getCollection,
    getItemCollections,
  };
}

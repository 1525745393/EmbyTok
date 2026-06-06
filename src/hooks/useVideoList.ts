import { useState, useEffect, useCallback } from 'react';
import { EmbyItem, FeedType, OrientationMode, EmbyLibrary } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import { isFolderType } from '../../utils';

const PAGE_SIZE = 200;

interface NavItem {
  id: string;
  title: string;
}

interface UseVideoListOptions {
  client: MediaClient | null;
  selectedLib: EmbyLibrary | null;
  feedType: FeedType;
  orientationMode: OrientationMode;
  hiddenLibIds: Set<string>;
  libraries: EmbyLibrary[];
}

export function useVideoList({
  client,
  selectedLib,
  feedType,
  orientationMode,
  hiddenLibIds,
  libraries,
}: UseVideoListOptions) {
  const [videos, setVideos] = useState<EmbyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [navStack, setNavStack] = useState<NavItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadVideos = useCallback(
    async (reset: boolean = false, overrideParentId?: string) => {
      if (!client || loading) return;
      setLoading(true);
      const skip = 0;
      const effectiveParentId =
        overrideParentId !== undefined
          ? overrideParentId
          : navStack.length > 0
            ? navStack[navStack.length - 1].id
            : undefined;

      if (reset) {
        setVideos([]);
        setHasMore(false);
        setCurrentIndex(0);
      }

      let includeIds = !selectedLib
        ? libraries
            .filter((l) => !hiddenLibIds.has(l.Id))
            .map((l) => l.Id)
            .join(',')
        : undefined;

      try {
        if (reset) {
          const favs = await client.getFavorites(selectedLib?.Name || '收藏');
          setFavoriteIds(new Set(favs));
        }

        const { items: newVideos } = await client.getVideos(
          effectiveParentId,
          selectedLib,
          feedType,
          skip,
          PAGE_SIZE,
          orientationMode,
          includeIds
        );

        setVideos(newVideos);
        setHasMore(false);

        if (reset && effectiveParentId && newVideos.length > 0) {
          if (isFolderType(newVideos[0]) && viewMode === 'feed') {
            setViewMode('grid');
          }
        }
      } catch (e) {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [
      client,
      loading,
      navStack,
      selectedLib,
      feedType,
      orientationMode,
      hiddenLibIds,
      libraries,
      viewMode,
    ]
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      if (!client) return;
      await client.toggleFavorite(id, isFavorite, selectedLib?.Name || '收藏');
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (isFavorite) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [client, selectedLib]
  );

  const deleteVideo = useCallback(
    async (itemId: string) => {
      if (!client) return;
      await client.deleteItem(itemId);
      setVideos((prev) => prev.filter((video) => video.Id !== itemId));
    },
    [client]
  );

  const navigateTo = useCallback((id: string, title: string) => {
    setNavStack((prev) => [...prev, { id, title }]);
    setViewMode('grid');
  }, []);

  const navigateBack = useCallback(() => {
    setNavStack((prev) => prev.slice(0, -1));
  }, []);

  const selectVideo = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewMode('feed');
  }, []);

  useEffect(() => {
    if (client) {
      loadVideos(true);
    }
  }, [client, navStack, feedType, selectedLib, orientationMode, hiddenLibIds]);

  return {
    videos,
    loading,
    hasMore,
    navStack,
    favoriteIds,
    viewMode,
    setViewMode,
    currentIndex,
    setCurrentIndex,
    loadVideos,
    toggleFavorite,
    deleteVideo,
    navigateTo,
    navigateBack,
    selectVideo,
  };
}

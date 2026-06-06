import { useState, useEffect, useCallback, useRef } from 'react';
import { EmbyItem } from '../../types';
import { MediaClient } from '../../services/MediaClient';

interface UseImagePreloadOptions {
  enabled?: boolean;
  preloadCount?: number;
}

interface PreloadStatus {
  [itemId: string]: 'pending' | 'loading' | 'loaded' | 'error';
}

export function useImagePreload(
  videos: EmbyItem[],
  activeIndex: number,
  client: MediaClient,
  { enabled = true, preloadCount = 1 }: UseImagePreloadOptions = {}
) {
  const [preloadStatus, setPreloadStatus] = useState<PreloadStatus>({});
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const preloadImage = useCallback(
    (item: EmbyItem) => {
      if (!enabled || !item.ImageTags?.Primary) return;

      const itemId = item.Id;
      const currentStatus = preloadStatus[itemId];

      if (currentStatus === 'loading' || currentStatus === 'loaded') {
        return;
      }

      setPreloadStatus((prev) => ({ ...prev, [itemId]: 'loading' }));

      const img = new Image();
      const imageUrl = client.getImageUrl(itemId, item.ImageTags.Primary, 'Primary');

      img.onload = () => {
        preloadedImagesRef.current.set(itemId, img);
        setPreloadStatus((prev) => ({ ...prev, [itemId]: 'loaded' }));
      };

      img.onerror = () => {
        setPreloadStatus((prev) => ({ ...prev, [itemId]: 'error' }));
      };

      img.src = imageUrl;
    },
    [enabled, client, preloadStatus]
  );

  useEffect(() => {
    if (!enabled || videos.length === 0) return;

    // 预加载当前活跃视频之后的视频
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = activeIndex + i;
      if (nextIndex < videos.length) {
        preloadImage(videos[nextIndex]);
      }
    }
  }, [activeIndex, videos, enabled, preloadCount, preloadImage]);

  const getPreloadStatus = useCallback(
    (itemId: string) => {
      return preloadStatus[itemId] || 'pending';
    },
    [preloadStatus]
  );

  const isPreloaded = useCallback(
    (itemId: string) => {
      return preloadStatus[itemId] === 'loaded' || preloadedImagesRef.current.has(itemId);
    },
    [preloadStatus]
  );

  return {
    getPreloadStatus,
    isPreloaded,
    preloadStatus,
  };
}

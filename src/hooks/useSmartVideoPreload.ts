import { useState, useEffect, useRef, useCallback } from 'react';
import { EmbyItem } from '../../types';

interface PreloadConfig {
  // 预加载当前视频前后的秒数
  preloadBuffer: number;
  // 预加载下一个视频的前几秒
  nextVideoPreloadSeconds: number;
  // 最大缓存视频数
  maxCachedVideos: number;
  // 是否启用预加载
  enabled: boolean;
}

const DEFAULT_CONFIG: PreloadConfig = {
  preloadBuffer: 10,
  nextVideoPreloadSeconds: 5,
  maxCachedVideos: 3,
  enabled: true
};

interface CachedVideo {
  itemId: string;
  videoElement?: HTMLVideoElement;
  lastUsed: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

export function useSmartVideoPreload(
  videos: EmbyItem[], 
  activeIndex: number,
  config: Partial<PreloadConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [cachedVideos, setCachedVideos] = useState<Map<string, CachedVideo>>(new Map());
  const cacheOrderRef = useRef<string[]>([]);

  // 管理缓存
  const manageCache = useCallback((itemId: string) => {
    if (!mergedConfig.enabled) return;

    setCachedVideos(prev => {
      const newCache = new Map(prev);
      
      // 更新使用时间
      if (newCache.has(itemId)) {
        const existing = newCache.get(itemId)!;
        newCache.set(itemId, { ...existing, lastUsed: Date.now() });
      } else {
        newCache.set(itemId, {
          itemId,
          lastUsed: Date.now(),
          status: 'idle'
        });
      }
      
      // 移除旧的缓存
      if (newCache.size > mergedConfig.maxCachedVideos) {
        const sorted = [...newCache.entries()]
          .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        const toRemove = sorted.slice(0, sorted.length - mergedConfig.maxCachedVideos);
        toRemove.forEach(([id]) => {
          const video = newCache.get(id)?.videoElement;
          if (video) {
            video.pause();
            video.src = '';
            video.load();
          }
          newCache.delete(id);
        });
      }
      
      return newCache;
    });
  }, [mergedConfig]);

  // 预加载相邻视频
  const preloadNeighborVideos = useCallback(() => {
    if (!mergedConfig.enabled) return;

    const neighbors = [
      activeIndex - 1,
      activeIndex,
      activeIndex + 1
    ].filter(i => i >= 0 && i < videos.length);

    neighbors.forEach(index => {
      const item = videos[index];
      if (item) {
        manageCache(item.Id);
      }
    });
  }, [videos, activeIndex, mergedConfig.enabled, manageCache]);

  // 网络状况检测
  const checkNetworkQuality = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        return {
          effectiveType: connection.effectiveType, // 'slow-2g', '2g', '3g', '4g'
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
    }
    return null;
  }, []);

  // 根据网络状况调整预加载策略
  useEffect(() => {
    const network = checkNetworkQuality();
    if (network) {
      if (network.saveData || network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
        // 节省数据模式，减少预加载
        mergedConfig.enabled = false;
      } else if (network.effectiveType === '3g') {
        // 3G 网络，保守预加载
        mergedConfig.maxCachedVideos = 2;
        mergedConfig.nextVideoPreloadSeconds = 3;
      }
    }
  }, [checkNetworkQuality]);

  // 当活跃索引变化时预加载
  useEffect(() => {
    preloadNeighborVideos();
  }, [activeIndex, preloadNeighborVideos]);

  return {
    isPreloaded: (itemId: string) => cachedVideos.has(itemId),
    getCacheStatus: (itemId: string) => cachedVideos.get(itemId)?.status || 'idle',
    config: mergedConfig
  };
}

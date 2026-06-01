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
  lastUsed: number;
  status: 'idle' | 'preparing' | 'ready' | 'error';
}

export function useSmartVideoPreload(
  videos: EmbyItem[], 
  activeIndex: number,
  config: Partial<PreloadConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [cachedVideos, setCachedVideos] = useState<Map<string, CachedVideo>>(new Map());
  const [networkQuality, setNetworkQuality] = useState<'high' | 'medium' | 'low' | 'unknown'>('unknown');
  const currentConfigRef = useRef(mergedConfig);

  // 网络状况检测
  const checkNetworkQuality = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const quality: 'high' | 'medium' | 'low' | 'unknown' = 
          connection.saveData ? 'low' :
          connection.effectiveType === '4g' ? 'high' :
          connection.effectiveType === '3g' ? 'medium' : 'low';
        
        setNetworkQuality(quality);
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          quality
        };
      }
    }
    return { quality: 'unknown' };
  }, []);

  // 根据网络状况调整预加载策略
  useEffect(() => {
    const network = checkNetworkQuality();
    const config = { ...DEFAULT_CONFIG, ...config };
    
    if (network.quality === 'low' || network.quality === 'unknown') {
      config.enabled = false;
    } else if (network.quality === 'medium') {
      config.enabled = true;
      config.maxCachedVideos = 2;
    } else {
      config.enabled = true;
      config.maxCachedVideos = 3;
    }
    
    currentConfigRef.current = config;
  }, [checkNetworkQuality, config]);

  // 管理缓存
  const manageCache = useCallback((itemId: string, status: CachedVideo['status'] = 'idle') => {
    if (!currentConfigRef.current.enabled) return;

    setCachedVideos(prev => {
      const newCache = new Map(prev);
      const now = Date.now();
      
      // 更新使用时间
      if (newCache.has(itemId)) {
        const existing = newCache.get(itemId)!;
        newCache.set(itemId, { 
          ...existing, 
          lastUsed: now,
          status: status !== 'idle' ? status : existing.status
        });
      } else {
        newCache.set(itemId, {
          itemId,
          lastUsed: now,
          status
        });
      }
      
      // 移除旧的缓存
      if (newCache.size > currentConfigRef.current.maxCachedVideos) {
        const sorted = [...newCache.entries()]
          .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        const toRemove = sorted.slice(0, sorted.length - currentConfigRef.current.maxCachedVideos);
        toRemove.forEach(([id]) => {
          newCache.delete(id);
        });
      }
      
      return newCache;
    });
  }, []);

  // 预加载相邻视频
  const preloadNeighborVideos = useCallback(() => {
    if (!currentConfigRef.current.enabled || videos.length === 0) return;

    const neighbors = [
      activeIndex,
      activeIndex + 1,
      activeIndex - 1
    ].filter(i => i >= 0 && i < videos.length);

    neighbors.forEach((index, priority) => {
      const item = videos[index];
      if (item) {
        const status: CachedVideo['status'] = priority === 0 ? 'ready' : 'preparing';
        manageCache(item.Id, status);
      }
    });
  }, [videos, activeIndex, manageCache]);

  // 当活跃索引变化时预加载
  useEffect(() => {
    preloadNeighborVideos();
  }, [activeIndex, preloadNeighborVideos]);

  return {
    isPreloaded: (itemId: string) => cachedVideos.has(itemId) && cachedVideos.get(itemId)?.status === 'ready',
    getCacheStatus: (itemId: string) => cachedVideos.get(itemId)?.status || 'idle',
    networkQuality,
    config: currentConfigRef.current
  };
}

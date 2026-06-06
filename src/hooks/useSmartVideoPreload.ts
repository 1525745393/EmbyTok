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
  enabled: true,
};

interface CachedVideo {
  itemId: string;
  lastUsed: number;
  status: 'idle' | 'preparing' | 'ready' | 'error';
}

// 速度检测相关类型
type ScrollDirection = 'up' | 'down' | 'none';

export function useSmartVideoPreload(
  videos: EmbyItem[],
  activeIndex: number,
  config: Partial<PreloadConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [cachedVideos, setCachedVideos] = useState<Map<string, CachedVideo>>(new Map());
  const [networkQuality, setNetworkQuality] = useState<'high' | 'medium' | 'low' | 'unknown'>(
    'unknown'
  );
  const [scrollSpeed, setScrollSpeed] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');

  const currentConfigRef = useRef(mergedConfig);
  const lastScrollTimeRef = useRef<number>(Date.now());
  const lastScrollPositionRef = useRef<number>(0);
  const scrollSpeedHistoryRef = useRef<number[]>([]);

  // 网络状况检测
  const checkNetworkQuality = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const quality: 'high' | 'medium' | 'low' | 'unknown' = connection.saveData
          ? 'low'
          : connection.effectiveType === '4g' || connection.effectiveType === '5g'
            ? 'high'
            : connection.effectiveType === '3g'
              ? 'medium'
              : 'low';

        setNetworkQuality(quality);
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          quality,
        };
      }
    }
    return { quality: 'unknown' };
  }, []);

  // 检测滚动速度
  const updateScrollSpeed = useCallback((currentPosition: number) => {
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;
    const positionDelta = currentPosition - lastScrollPositionRef.current;

    if (timeDelta > 0) {
      const speed = Math.abs(positionDelta / timeDelta); // 像素/毫秒

      // 保存速度历史用于平滑
      scrollSpeedHistoryRef.current.push(speed);
      if (scrollSpeedHistoryRef.current.length > 5) {
        scrollSpeedHistoryRef.current.shift();
      }

      // 计算平均速度
      const avgSpeed =
        scrollSpeedHistoryRef.current.reduce((a, b) => a + b, 0) /
        scrollSpeedHistoryRef.current.length;
      setScrollSpeed(avgSpeed);

      // 确定方向
      setScrollDirection(positionDelta > 0 ? 'down' : positionDelta < 0 ? 'up' : 'none');
    }

    lastScrollTimeRef.current = now;
    lastScrollPositionRef.current = currentPosition;
  }, []);

  // 根据网络状况和滚动速度动态调整预加载策略
  const getDynamicConfig = useCallback(() => {
    const baseConfig = { ...DEFAULT_CONFIG, ...config };
    const network = checkNetworkQuality();

    // 根据网络质量调整
    switch (network.quality) {
      case 'high':
        baseConfig.enabled = true;
        baseConfig.maxCachedVideos = 4;
        break;
      case 'medium':
        baseConfig.enabled = true;
        baseConfig.maxCachedVideos = 2;
        break;
      case 'low':
      case 'unknown':
        baseConfig.enabled = true;
        baseConfig.maxCachedVideos = 1;
        break;
    }

    // 根据滚动速度进一步调整
    if (scrollSpeed > 2) {
      // 快速滚动 - 减少预加载
      baseConfig.maxCachedVideos = Math.max(1, baseConfig.maxCachedVideos - 1);
    } else if (scrollSpeed < 0.5) {
      // 慢速滚动或停止 - 增加预加载
      baseConfig.maxCachedVideos = Math.min(5, baseConfig.maxCachedVideos + 1);
    }

    return baseConfig;
  }, [config, scrollSpeed, checkNetworkQuality]);

  // 更新配置
  useEffect(() => {
    currentConfigRef.current = getDynamicConfig();
  }, [getDynamicConfig]);

  // 管理缓存
  const manageCache = useCallback((itemId: string, status: CachedVideo['status'] = 'idle') => {
    if (!currentConfigRef.current.enabled) return;

    setCachedVideos((prev) => {
      const newCache = new Map(prev);
      const now = Date.now();

      // 更新使用时间
      if (newCache.has(itemId)) {
        const existing = newCache.get(itemId)!;
        newCache.set(itemId, {
          ...existing,
          lastUsed: now,
          status: status !== 'idle' ? status : existing.status,
        });
      } else {
        newCache.set(itemId, {
          itemId,
          lastUsed: now,
          status,
        });
      }

      // 移除旧的缓存
      if (newCache.size > currentConfigRef.current.maxCachedVideos) {
        const sorted = [...newCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);

        const toRemove = sorted.slice(0, sorted.length - currentConfigRef.current.maxCachedVideos);
        toRemove.forEach(([id]) => {
          newCache.delete(id);
        });
      }

      return newCache;
    });
  }, []);

  // 基于滚动速度和方向智能预加载
  const preloadVideos = useCallback(() => {
    if (!currentConfigRef.current.enabled || videos.length === 0) return;

    const config = currentConfigRef.current;
    const indicesToPreload: number[] = [];

    // 当前视频始终最高优先级
    indicesToPreload.push(activeIndex);

    // 根据滚动方向和速度确定预加载数量
    let preloadCount = 1;
    if (scrollSpeed < 0.5) {
      preloadCount = 2; // 慢速时预加载更多
    } else if (scrollSpeed > 2) {
      preloadCount = 1; // 快速时减少预加载
    }

    // 根据滚动方向预加载
    if (scrollDirection === 'down') {
      // 向下滚动 - 预加载后面的视频
      for (let i = 1; i <= preloadCount; i++) {
        if (activeIndex + i < videos.length) {
          indicesToPreload.push(activeIndex + i);
        }
      }
    } else if (scrollDirection === 'up') {
      // 向上滚动 - 预加载前面的视频
      for (let i = 1; i <= preloadCount; i++) {
        if (activeIndex - i >= 0) {
          indicesToPreload.push(activeIndex - i);
        }
      }
    } else {
      // 无方向 - 预加载两侧
      if (activeIndex + 1 < videos.length) {
        indicesToPreload.push(activeIndex + 1);
      }
      if (activeIndex - 1 >= 0) {
        indicesToPreload.push(activeIndex - 1);
      }
    }

    // 执行预加载
    indicesToPreload.forEach((index, priority) => {
      const item = videos[index];
      if (item) {
        const status: CachedVideo['status'] = priority === 0 ? 'ready' : 'preparing';
        manageCache(item.Id, status);
      }
    });
  }, [videos, activeIndex, scrollSpeed, scrollDirection, manageCache]);

  // 当活跃索引变化时预加载
  useEffect(() => {
    preloadVideos();
  }, [activeIndex, preloadVideos]);

  return {
    isPreloaded: (itemId: string) =>
      cachedVideos.has(itemId) && cachedVideos.get(itemId)?.status === 'ready',
    getCacheStatus: (itemId: string) => cachedVideos.get(itemId)?.status || 'idle',
    networkQuality,
    scrollSpeed,
    scrollDirection,
    updateScrollSpeed,
    config: currentConfigRef.current,
  };
}

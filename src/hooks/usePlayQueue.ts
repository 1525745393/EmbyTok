import { useState, useCallback, useRef, useEffect } from 'react';
import { EmbyItem, PlayQueue, PlayQueueItem, PlayMode } from '../../types';
import { MediaClient } from '../../services/MediaClient';

// 生成唯一ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 播放队列 Hook 返回类型
export interface UsePlayQueueReturn {
  queue: PlayQueueItem[];
  currentIndex: number;
  playMode: PlayMode;
  currentItem: EmbyItem | null;
  addToQueue: (item: EmbyItem) => void;
  removeFromQueue: (itemId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setCurrentIndex: (index: number) => void;
  isInQueue: (itemId: string) => boolean;
  playItem: (item: EmbyItem, queueItems?: EmbyItem[], startIndex?: number) => void;
  preloadNextEpisode: (seriesId: string, currentEpisodeId: string) => Promise<EmbyItem | null>;
}

interface UsePlayQueueOptions {
  client: MediaClient | null;
  autoPlayNext?: boolean;       // 自动播放下一集
  preloadAheadTime?: number;    // 提前预加载时间（秒），默认5秒
  onAutoPlayNext?: (nextItem: EmbyItem) => void;  // 自动播放下一集时的回调
}

/**
 * 播放队列 Hook
 * 管理视频播放队列，支持顺序、随机、循环等播放模式
 */
export function usePlayQueue(options: UsePlayQueueOptions): UsePlayQueueReturn {
  const {
    client,
    autoPlayNext = true,
    preloadAheadTime = 5,
    onAutoPlayNext
  } = options;

  // 播放队列状态
  const [queue, setQueue] = useState<PlayQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.Sequential);

  // 用于检测剧集播放结束的定时器引用
  const preloadTimerRef = useRef<number | null>(null);
  const currentItemRef = useRef<EmbyItem | null>(null);

  // 当前播放项
  const currentItem = queue[currentIndex]?.item || null;

  // 更新当前项引用
  useEffect(() => {
    currentItemRef.current = currentItem;
  }, [currentItem]);

  /**
   * 添加项目到队列
   */
  const addToQueue = useCallback((item: EmbyItem) => {
    const now = Date.now();
    const queueItem: PlayQueueItem = {
      id: generateId(),
      item,
      addedAt: now
    };

    setQueue(prev => [...prev, queueItem]);

    // 如果队列为空，设置当前索引为0
    if (queue.length === 0) {
      setCurrentIndex(0);
    }
  }, [queue.length]);

  /**
   * 从队列移除项目
   */
  const removeFromQueue = useCallback((itemId: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(qi => qi.item.Id !== itemId);

      // 如果移除的是当前播放项之前的项，需要调整索引
      if (currentIndex >= newQueue.length) {
        setCurrentIndex(Math.max(0, newQueue.length - 1));
      }

      return newQueue;
    });
  }, [currentIndex]);

  /**
   * 清空队列
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  /**
   * 播放下一项
   */
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex: number;

    switch (playMode) {
      case PlayMode.Shuffle:
        nextIndex = Math.floor(Math.random() * queue.length);
        break;

      case PlayMode.LoopSingle:
        // 单曲循环时索引不变
        nextIndex = currentIndex;
        break;

      case PlayMode.LoopAll:
        nextIndex = (currentIndex + 1) % queue.length;
        break;

      case PlayMode.Sequential:
      default:
        nextIndex = currentIndex + 1;
        // 顺序播放到最后时停止
        if (nextIndex >= queue.length) {
          nextIndex = queue.length - 1;
        }
        break;
    }

    setCurrentIndex(nextIndex);
  }, [queue.length, currentIndex, playMode]);

  /**
   * 播放上一项
   */
  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    let prevIndex: number;

    if (playMode === PlayMode.LoopAll) {
      prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    } else {
      prevIndex = Math.max(0, currentIndex - 1);
    }

    setCurrentIndex(prevIndex);
  }, [queue.length, currentIndex, playMode]);

  /**
   * 设置播放模式
   */
  const handleSetPlayMode = useCallback((mode: PlayMode) => {
    setPlayMode(mode);
  }, []);

  /**
   * 检查项目是否在队列中
   */
  const isInQueue = useCallback((itemId: string): boolean => {
    return queue.some(qi => qi.item.Id === itemId);
  }, [queue]);

  /**
   * 播放指定项目
   * @param item 要播放的项目
   * @param queueItems 队列中的所有项目（可选）
   * @param startIndex 起始索引（可选）
   */
  const playItem = useCallback((
    item: EmbyItem,
    queueItems?: EmbyItem[],
    startIndex: number = 0
  ) => {
    if (queueItems && queueItems.length > 0) {
      // 从项目列表创建队列
      const now = Date.now();
      const newQueue: PlayQueueItem[] = queueItems.map((qi, index) => ({
        id: generateId(),
        item: qi,
        addedAt: now
      }));

      // 找到当前项目的索引
      const itemIndex = queueItems.findIndex(qi => qi.Id === item.Id);
      const index = itemIndex >= 0 ? itemIndex : startIndex;

      setQueue(newQueue);
      setCurrentIndex(index);
    } else {
      // 单项播放
      const now = Date.now();
      const queueItem: PlayQueueItem = {
        id: generateId(),
        item,
        addedAt: now
      };

      setQueue([queueItem]);
      setCurrentIndex(0);
    }
  }, []);

  /**
   * 预加载下一集
   * @param seriesId 剧集ID
   * @param currentEpisodeId 当前剧集ID
   * @returns 下一集信息
   */
  const preloadNextEpisode = useCallback(async (
    seriesId: string,
    currentEpisodeId: string
  ): Promise<EmbyItem | null> => {
    if (!client) {
      console.warn('[usePlayQueue] MediaClient 未初始化');
      return null;
    }

    try {
      const nextEpisode = await client.getNextEpisode(seriesId, currentEpisodeId);
      return nextEpisode;
    } catch (error) {
      console.error('[usePlayQueue] 预加载下一集失败:', error);
      return null;
    }
  }, [client]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
    };
  }, []);

  return {
    queue,
    currentIndex,
    playMode,
    currentItem,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,
    setPlayMode: handleSetPlayMode,
    setCurrentIndex,
    isInQueue,
    playItem,
    preloadNextEpisode
  };
}

export default usePlayQueue;
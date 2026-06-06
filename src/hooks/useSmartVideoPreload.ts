import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 智能视频预加载Hook
 * 
 * 功能：
 * - 检测用户滑动方向，预测下一个要播放的视频
 * - 提前开始预加载下一个视频（视频流、海报、字幕）
 * - 网络带宽检测和自适应质量策略
 * - 预加载队列管理
 */

export type NetworkType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';

interface PreloadTask {
  videoId: string;
  videoUrl: string;
  blobUrl: string | null;
  status: 'idle' | 'preloading' | 'ready' | 'error' | 'cancelled';
  progress: number;
  createdAt: number;
  element: HTMLVideoElement | null;
}

interface UseSmartPreloadReturn {
  /** 预加载指定视频 */
  preloadNext: (videoId: string, videoUrl: string) => void;
  /** 取消预加载 */
  cancelPreload: (videoId: string) => void;
  /** 获取预加载后的URL */
  getPreloadedUrl: (videoId: string) => string | null;
  /** 检查是否正在预加载 */
  isPreloading: (videoId: string) => boolean;
  /** 获取预加载进度 */
  preloadProgress: (videoId: string) => number;
  /** 当前网络类型 */
  networkType: NetworkType;
  /** 设置自动质量调整 */
  setAutoQuality: (enabled: boolean) => void;
  /** 滑动方向 */
  scrollDirection: 'up' | 'down' | 'none';
  /** 更新滚动方向（供VideoFeed调用） */
  updateScrollDirection: (direction: 'up' | 'down' | 'none') => void;
}

// Network Information API 类型扩展
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithNetwork extends Navigator {
  connection?: NetworkInformation;
}

/** 根据网络类型判断是否预加载视频 */
const shouldPreloadVideo = (networkType: NetworkType): boolean => {
  return networkType === 'wifi' || networkType === '4g';
};

/** 根据网络类型判断是否预加载海报 */
const shouldPreloadPoster = (networkType: NetworkType): boolean => {
  return networkType !== '2g' && networkType !== 'slow-2g' && networkType !== 'unknown';
};

/**
 * 智能视频预加载Hook
 */
export function useSmartVideoPreload(): UseSmartPreloadReturn {
  // 预加载任务映射
  const [preloadTasks, setPreloadTasks] = useState<Map<string, PreloadTask>>(new Map());
  // 当前网络类型
  const [networkType, setNetworkType] = useState<NetworkType>('unknown');
  // 是否启用自动质量调整
  const [autoQualityEnabled, setAutoQualityEnabled] = useState(true);
  // 当前滑动方向
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none');

  // 使用 ref 存储最新状态，避免闭包问题
  const preloadTasksRef = useRef<Map<string, PreloadTask>>(new Map());
  const networkTypeRef = useRef<NetworkType>('unknown');
  const autoQualityRef = useRef(true);

  // 更新 ref
  useEffect(() => {
    preloadTasksRef.current = preloadTasks;
  }, [preloadTasks]);

  useEffect(() => {
    networkTypeRef.current = networkType;
  }, [networkType]);

  useEffect(() => {
    autoQualityRef.current = autoQualityEnabled;
  }, [autoQualityEnabled]);

  /** 检测网络类型 */
  const detectNetworkType = useCallback((): NetworkType => {
    const nav = navigator as NavigatorWithNetwork;
    if (!nav.connection) {
      return 'unknown';
    }

    const connection = nav.connection;
    
    // 如果开启了省流模式，视为低质量网络
    if (connection.saveData) {
      return '3g';
    }

    const effectiveType = connection.effectiveType;
    
    switch (effectiveType) {
      case '4g':
        // 进一步检查带宽来区分WiFi和4G
        if (connection.downlink && connection.downlink >= 10) {
          return 'wifi';
        }
        return '4g';
      case '3g':
        return '3g';
      case '2g':
        return '2g';
      case 'slow-2g':
        return 'slow-2g';
      default:
        return 'unknown';
    }
  }, []);

  /** 更新网络类型 */
  const updateNetworkType = useCallback(() => {
    const type = detectNetworkType();
    setNetworkType(type);
    return type;
  }, [detectNetworkType]);

  // 监听网络变化
  useEffect(() => {
    const nav = navigator as NavigatorWithNetwork;
    if (!nav.connection) return;

    const handleChange = () => {
      updateNetworkType();
    };

    nav.connection.addEventListener?.('change', handleChange);
    return () => {
      nav.connection.removeEventListener?.('change', handleChange);
    };
  }, [updateNetworkType]);

  // 初始化时检测网络
  useEffect(() => {
    updateNetworkType();
  }, [updateNetworkType]);

  /** 预加载视频 */
  const preloadNext = useCallback((videoId: string, videoUrl: string) => {
    const currentNetworkType = networkTypeRef.current;

    // 检查是否应该预加载
    if (!shouldPreloadVideo(currentNetworkType)) {
      return;
    }

    // 如果已经有预加载任务且状态为ready或preloading，跳过
    const existingTask = preloadTasksRef.current.get(videoId);
    if (existingTask && (existingTask.status === 'ready' || existingTask.status === 'preloading')) {
      return;
    }

    // 创建预加载任务
    const task: PreloadTask = {
      videoId,
      videoUrl,
      blobUrl: null,
      status: 'preloading',
      progress: 0,
      createdAt: Date.now(),
      element: null
    };

    setPreloadTasks(prev => {
      const newMap = new Map(prev);
      // 取消之前的预加载（如果有）
      const oldTask = newMap.get(videoId);
      if (oldTask?.element) {
        oldTask.element.src = '';
        oldTask.element.load();
      }
      newMap.set(videoId, task);
      return newMap;
    });

    // 创建隐藏的video元素进行预加载
    const videoElement = document.createElement('video');
    videoElement.preload = 'auto';
    videoElement.muted = true;
    videoElement.setAttribute('aria-hidden', 'true');
    videoElement.style.position = 'absolute';
    videoElement.style.top = '-9999px';
    videoElement.style.left = '-9999px';
    videoElement.style.width = '1px';
    videoElement.style.height = '1px';
    videoElement.style.opacity = '0';
    videoElement.style.pointerEvents = 'none';

    // 监听加载进度
    videoElement.addEventListener('progress', () => {
      if (videoElement.duration && videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const progress = (bufferedEnd / videoElement.duration) * 100;
        
        setPreloadTasks(prev => {
          const newMap = new Map(prev);
          const existingTask = newMap.get(videoId);
          if (existingTask && existingTask.status === 'preloading') {
            newMap.set(videoId, { ...existingTask, progress });
          }
          return newMap;
        });
      }
    });

    // 监听加载完成
    videoElement.addEventListener('canplay', () => {
      // 创建Blob URL
      const blobUrl = URL.createObjectURL(videoElement.src);
      
      setPreloadTasks(prev => {
        const newMap = new Map(prev);
        const existingTask = newMap.get(videoId);
        if (existingTask && existingTask.status === 'preloading') {
          newMap.set(videoId, { 
            ...existingTask, 
            status: 'ready', 
            progress: 100,
            blobUrl,
            element: videoElement
          });
        }
        return newMap;
      });
    });

    // 监听错误
    videoElement.addEventListener('error', () => {
      setPreloadTasks(prev => {
        const newMap = new Map(prev);
        const existingTask = newMap.get(videoId);
        if (existingTask) {
          newMap.set(videoId, { ...existingTask, status: 'error' });
        }
        return newMap;
      });
    });

    videoElement.src = videoUrl;
    videoElement.load();

    // 更新任务中的element引用
    setPreloadTasks(prev => {
      const newMap = new Map(prev);
      const existingTask = newMap.get(videoId);
      if (existingTask) {
        newMap.set(videoId, { ...existingTask, element: videoElement });
      }
      return newMap;
    });

  }, []);

  /** 取消预加载 */
  const cancelPreload = useCallback((videoId: string) => {
    setPreloadTasks(prev => {
      const newMap = new Map(prev);
      const task = newMap.get(videoId);
      
      if (task) {
        // 释放Blob URL
        if (task.blobUrl) {
          URL.revokeObjectURL(task.blobUrl);
        }
        // 停止视频加载
        if (task.element) {
          task.element.src = '';
          task.element.load();
          task.element.remove();
        }
        newMap.set(videoId, { ...task, status: 'cancelled', element: null });
      }
      
      return newMap;
    });
  }, []);

  /** 获取预加载后的URL */
  const getPreloadedUrl = useCallback((videoId: string): string | null => {
    const task = preloadTasksRef.current.get(videoId);
    if (task && task.status === 'ready' && task.blobUrl) {
      return task.blobUrl;
    }
    return null;
  }, []);

  /** 检查是否正在预加载 */
  const isPreloading = useCallback((videoId: string): boolean => {
    const task = preloadTasksRef.current.get(videoId);
    return task?.status === 'preloading';
  }, []);

  /** 获取预加载进度 */
  const preloadProgress = useCallback((videoId: string): number => {
    const task = preloadTasksRef.current.get(videoId);
    return task?.progress ?? 0;
  }, []);

  /** 设置自动质量调整 */
  const setAutoQuality = useCallback((enabled: boolean) => {
    setAutoQualityEnabled(enabled);
  }, []);

  /** 更新滑动方向 */
  const updateScrollDirection = useCallback((direction: 'up' | 'down' | 'none') => {
    setScrollDirection(direction);
  }, []);

  // 组件卸载时清理所有预加载
  useEffect(() => {
    return () => {
      preloadTasksRef.current.forEach(task => {
        if (task.blobUrl) {
          URL.revokeObjectURL(task.blobUrl);
        }
        if (task.element) {
          task.element.src = '';
          task.element.remove();
        }
      });
    };
  }, []);

  return {
    preloadNext,
    cancelPreload,
    getPreloadedUrl,
    isPreloading,
    preloadProgress,
    networkType,
    setAutoQuality,
    scrollDirection,
    updateScrollDirection
  };
}

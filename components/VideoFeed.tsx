
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { EmbyItem, FeedType, SubtitleTrack, SubtitleSettings } from '../types';
import { MediaClient } from '../services/MediaClient';
import VideoCard from './VideoCard';
import { RefreshCw, Film, Shuffle, Infinity } from 'lucide-react';
import { useSmartVideoPreload } from '../src/hooks';

interface VideoFeedProps {
  videos: EmbyItem[];
  client: MediaClient;
  onRefresh?: () => void;
  isLoading?: boolean;
  favoriteIds: Set<string>;
  onToggleFavorite: (itemId: string, isFavorite: boolean) => void;
  isFavoriteFunc?: (itemId: string) => boolean;
  onDelete?: (itemId: string) => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  feedType: FeedType;
  hasMore: boolean;
  onLoadMore: () => void;
  isAutoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  language?: 'zh' | 'en';
  subtitleTracksMap?: Map<string, SubtitleTrack[]>;
  subtitleSettings?: SubtitleSettings;
  onUpdateSubtitleSettings?: (settings: Partial<SubtitleSettings>) => void;
  onAddToWatchHistory?: (item: EmbyItem, currentTime: number, duration: number) => void;
  /** 外部预览状态：当前正在预览的视频ID */
  previewingId?: string | null;
  /** 开始预览回调 */
  onStartPreview?: (videoId: string) => void;
  /** 停止预览回调 */
  onStopPreview?: () => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ 
    videos, 
    client, 
    onRefresh, 
    isLoading,
    favoriteIds,
    onToggleFavorite,
    isFavoriteFunc,
    onDelete = () => {},
    initialIndex = 0,
    onIndexChange,
    isMuted,
    onToggleMute,
    feedType,
    hasMore,
    onLoadMore,
    isAutoPlay = false,
    onToggleAutoPlay = () => {},
    language = 'zh',
    subtitleTracksMap = new Map(),
    subtitleSettings,
    onUpdateSubtitleSettings = () => {},
    onAddToWatchHistory = () => {},
    previewingId = null,
    onStartPreview,
    onStopPreview
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showToast, setShowToast] = useState(false);
  const [isTV, setIsTV] = useState(false);
  const isFirstRender = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 使用智能视频预加载
  const {
    preloadNext,
    getPreloadedUrl,
    isPreloading,
    preloadProgress,
    networkType,
    updateScrollDirection,
    scrollDirection
  } = useSmartVideoPreload();

  // 根据滚动速度动态调整可见视频数量
  const [currentScrollSpeed, setCurrentScrollSpeed] = useState<number>(0);

  // 根据滚动速度动态确定渲染的视频范围
  const visibleIndices = useMemo(() => {
    const indices = new Set<number>();
    let range = 1; // 默认渲染前后各1个
    
    // 根据滚动速度调整范围
    if (currentScrollSpeed < 0.5) {
      range = 2; // 慢速滚动时渲染更多
    } else if (currentScrollSpeed > 2) {
      range = 1; // 快速滚动时减少渲染
    }
    
    // 添加要渲染的索引
    for (let i = -range; i <= range; i++) {
      const idx = activeIndex + i;
      if (idx >= 0 && idx < videos.length) {
        indices.add(idx);
      }
    }
    
    return indices;
  }, [activeIndex, videos.length, currentScrollSpeed]);

  // 记忆化的 toggle favorite 回调
  const createToggleFavorite = useCallback((itemId: string, isFavorite: boolean) => {
    return () => onToggleFavorite(itemId, isFavorite);
  }, [onToggleFavorite]);

  // 记忆化的 delete 回调
  const createDelete = useCallback((itemId: string) => {
    return () => onDelete(itemId);
  }, [onDelete]);

  // 处理滚动事件并更新滚动速度
  const lastScrollPosRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(Date.now());

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const currentPos = containerRef.current.scrollTop;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastScrollTimeRef.current;
      const positionDelta = currentPos - lastScrollPosRef.current;

      // 计算滚动速度
      if (timeDelta > 0) {
        const speed = Math.abs(positionDelta / timeDelta);
        setCurrentScrollSpeed(speed);
      }

      // 判断滑动方向：向上滚动(currentPos减小)为down(下一个视频)，向下滚动(currentPos增大)为up(上一个视频)
      if (positionDelta > 0) {
        updateScrollDirection('up'); // 向下滚动滑到上一个视频
      } else if (positionDelta < 0) {
        updateScrollDirection('down'); // 向上滚动滑到下一个视频
      }

      lastScrollPosRef.current = currentPos;
      lastScrollTimeRef.current = currentTime;
    }
  }, [updateScrollDirection]);

  // 添加滚动监听器
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // 根据滑动方向预加载下一个视频
  useEffect(() => {
    if (!scrollDirection || scrollDirection === 'none') return;

    // 根据滑动方向确定要预加载的视频索引
    const nextIndex = scrollDirection === 'down' ? activeIndex + 1 : activeIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < videos.length) {
      const nextVideo = videos[nextIndex];
      // 获取视频URL - 这里假设VideoCard可以通过某种方式获取视频URL
      // 实际使用时需要从item中获取正确的视频URL
      const videoUrl = nextVideo.MediaSources?.[0]?.Path || nextVideo.key || '';
      
      if (videoUrl) {
        preloadNext(nextVideo.Id, videoUrl);
      }
    }
  }, [scrollDirection, activeIndex, videos, preloadNext]);

  useEffect(() => {
    setIsTV(window.navigator.userAgent.toLowerCase().includes('tv'));
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current && containerRef.current && initialIndex > 0) {
        const windowHeight = window.innerHeight;
        containerRef.current.scrollTop = windowHeight * initialIndex;
        isFirstRender.current = false;
    }
  }, [initialIndex]);

  useEffect(() => {
    if (isAutoPlay) {
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 2000);
        return () => clearTimeout(timer);
    } else {
        setShowToast(false);
    }
  }, [isAutoPlay]);

  const scrollToVideo = useCallback((index: number) => {
    if (containerRef.current && index >= 0 && index < videos.length) {
      containerRef.current.scrollTo({
          top: index * window.innerHeight,
          behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  }, [videos.length]);

  // 优化的键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTV) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex < videos.length - 1) {
            scrollToVideo(activeIndex + 1);
        } else if (hasMore) {
            onLoadMore();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) {
            scrollToVideo(activeIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTV, activeIndex, videos.length, hasMore, scrollToVideo, onLoadMore]);

  // 优化的 Intersection Observer，避免重复创建
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: container,
      rootMargin: '0px',
      threshold: 0.85, 
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setActiveIndex(index);
          if (onIndexChange) onIndexChange(index);
          if (feedType === 'latest' && index >= videos.length - 2 && hasMore && !isLoading) {
              onLoadMore();
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);
    const elements = container.querySelectorAll('.video-card-container');
    elements.forEach((el) => observerRef.current!.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [feedType, hasMore, isLoading, onIndexChange, onLoadMore, videos.length]);

  const handleNextVideo = useCallback(() => {
    if (activeIndex < videos.length - 1) {
        scrollToVideo(activeIndex + 1);
    } else if (hasMore) {
        onLoadMore();
    }
  }, [activeIndex, hasMore, onLoadMore, scrollToVideo, videos.length]);

  // 记忆化渲染的视频卡片，集成预加载状态
  const renderVideoCards = useMemo(() => {
    return videos.map((item, index) => {
      const isVisible = visibleIndices.has(index);
      const preloadedUrl = getPreloadedUrl(item.Id);
      const isPreloadedItem = !!preloadedUrl;
      const isPreloadingItem = isPreloading(item.Id);
      const preloadProgressValue = preloadProgress(item.Id);
      const cacheStatus = isPreloadingItem ? 'preparing' : isPreloadedItem ? 'ready' : 'idle';
      const isFav = isFavoriteFunc ? isFavoriteFunc(item.Id) : favoriteIds.has(item.Id);
      const isCurrentlyPreviewing = previewingId === item.Id;
      
      return (
        <div
          key={item.Id}
          data-index={index}
          className="video-card-container h-[100dvh] w-full snap-center snap-always relative"
        >
          {isVisible ? (
            <VideoCard
              item={item}
              client={client}
              isActive={activeIndex === index}
              isFavorite={isFav}
              onToggleFavorite={createToggleFavorite(item.Id, isFav)}
              onDelete={createDelete(item.Id)}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              isAutoPlay={isAutoPlay}
              onToggleAutoPlay={onToggleAutoPlay}
              onVideoEnd={handleNextVideo}
              language={language}
              isPreloaded={isPreloadedItem}
              cacheStatus={cacheStatus}
              subtitleTracks={subtitleTracksMap.get(item.Id) || []}
              subtitleSettings={subtitleSettings}
              onUpdateSubtitleSettings={onUpdateSubtitleSettings}
              onAddToWatchHistory={onAddToWatchHistory}
              isPreviewMode={!isActive && isVisible}
              isPreviewing={isCurrentlyPreviewing}
              onPreviewStart={onStartPreview}
              onPreviewStop={onStopPreview}
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>
      );
    });
  }, [videos, visibleIndices, client, activeIndex, favoriteIds, isFavoriteFunc, createToggleFavorite, createDelete, isMuted, onToggleMute, isAutoPlay, onToggleAutoPlay, handleNextVideo, language, isPreloaded, getCacheStatus, subtitleTracksMap, subtitleSettings, onUpdateSubtitleSettings, onAddToWatchHistory, previewingId, onStartPreview, onStopPreview]);

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white bg-black pt-20">
        <Film className="w-16 h-16 text-zinc-800 mb-4" />
        <p className="text-lg mb-2 font-bold">未找到视频</p>
        <button onClick={onRefresh} className="px-6 py-3 bg-indigo-600 rounded-full text-sm font-bold">刷新</button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
        {showToast && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in">
                  <Infinity className="w-5 h-5 text-green-400" />
                  <span className="font-bold">自动连播已开启</span>
              </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black scroll-smooth"
        >
          {renderVideoCards}
          
          {feedType === 'random' && videos.length > 0 && (
            <div className="h-[100dvh] w-full snap-center flex flex-col items-center justify-center bg-zinc-900 text-white gap-4">
                <Shuffle className="w-16 h-16 text-zinc-700" />
                <button onClick={onRefresh} className="px-8 py-4 bg-indigo-600 rounded-full text-lg font-bold">换一批</button>
            </div>
          )}
        </div>
    </div>
  );
};

export default React.memo(VideoFeed);

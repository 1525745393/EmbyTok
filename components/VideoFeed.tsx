
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { EmbyItem, FeedType } from '../types';
import { MediaClient } from '../services/MediaClient';
import VideoCard from './VideoCard';
import { RefreshCw, Film, Shuffle, Infinity } from 'lucide-react';

interface VideoFeedProps {
  videos: EmbyItem[];
  client: MediaClient;
  onRefresh?: () => void;
  isLoading?: boolean;
  favoriteIds: Set<string>;
  onToggleFavorite: (itemId: string, isFavorite: boolean) => void;
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
}

const VideoFeed: React.FC<VideoFeedProps> = ({ 
    videos, 
    client, 
    onRefresh, 
    isLoading,
    favoriteIds,
    onToggleFavorite,
    onDelete = () => {},
    initialIndex = 0,
    onIndexChange,
    isMuted,
    onToggleMute,
    feedType,
    hasMore,
    onLoadMore,
    isAutoPlay = false,
    onToggleAutoPlay = () => {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showToast, setShowToast] = useState(false);
  const [isTV, setIsTV] = useState(false);
  const isFirstRender = useRef(true);

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

  // 关键：电视遥控器按键接管
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    const observer = new IntersectionObserver(handleIntersect, options);
    const elements = container.querySelectorAll('.video-card-container');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [videos, onIndexChange, feedType, hasMore, isLoading, onLoadMore]);

  const handleNextVideo = () => {
    if (activeIndex < videos.length - 1) {
        scrollToVideo(activeIndex + 1);
    } else if (hasMore) {
        onLoadMore();
    }
  };

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
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
        >
          {videos.map((item, index) => (
            <div
              key={item.Id}
              data-index={index}
              className="video-card-container h-[100dvh] w-full snap-center snap-always relative"
            >
              {Math.abs(activeIndex - index) <= 1 ? (
                <VideoCard
                  item={item}
                  client={client}
                  isActive={activeIndex === index}
                  isFavorite={favoriteIds.has(item.Id)}
                  onToggleFavorite={() => onToggleFavorite(item.Id, favoriteIds.has(item.Id))}
                  onDelete={() => onDelete(item.Id)}
                  isMuted={isMuted}
                  onToggleMute={onToggleMute}
                  isAutoPlay={isAutoPlay}
                  onToggleAutoPlay={onToggleAutoPlay}
                  onVideoEnd={handleNextVideo}
                />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          ))}
          
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

export default VideoFeed;

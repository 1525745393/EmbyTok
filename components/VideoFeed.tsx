import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { EmbyItem, FeedType } from '../types';
import { MediaClient } from '../services/MediaClient';
import VideoCard from './VideoCard';
import { RefreshCw, Film, Shuffle, Infinity } from 'lucide-react';
import { Translations } from '../src/locales';
import { isTVDevice } from '../utils';

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
  t: Translations;
}

interface VideoCardItemProps {
  item: EmbyItem;
  index: number;
  activeIndex: number;
  client: MediaClient;
  favoriteIds: Set<string>;
  onToggleFavorite: (itemId: string, isFavorite: boolean) => void;
  onDelete?: (itemId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isAutoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  onVideoEnd?: () => void;
  t: Translations['videoCard'];
}

const VideoCardItem = React.memo(
  ({
    item,
    index,
    activeIndex,
    client,
    favoriteIds,
    onToggleFavorite,
    onDelete,
    isMuted,
    onToggleMute,
    isAutoPlay,
    onToggleAutoPlay,
    onVideoEnd,
    t,
  }: VideoCardItemProps) => {
    const shouldRenderCard = Math.abs(activeIndex - index) <= 1;

    const handleToggleFavorite = useCallback(() => {
      onToggleFavorite(item.Id, favoriteIds.has(item.Id));
    }, [item.Id, onToggleFavorite, favoriteIds]);

    const handleDelete = useCallback(() => {
      onDelete?.(item.Id);
    }, [item.Id, onDelete]);

    if (!shouldRenderCard) {
      return <div className="w-full h-full bg-black" />;
    }

    return (
      <VideoCard
        item={item}
        client={client}
        isActive={activeIndex === index}
        isFavorite={favoriteIds.has(item.Id)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        isAutoPlay={isAutoPlay}
        onToggleAutoPlay={onToggleAutoPlay}
        onVideoEnd={onVideoEnd}
        t={t}
      />
    );
  }
);

VideoCardItem.displayName = 'VideoCardItem';

const VideoFeed: React.FC<VideoFeedProps> = React.memo(
  ({
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
    onToggleAutoPlay = () => {},
    t,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [showToast, setShowToast] = useState(false);
    const isTV = useMemo(() => isTVDevice(), []);
    const isFirstRender = useRef(true);

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

    const scrollToVideo = useCallback(
      (index: number) => {
        if (containerRef.current && index >= 0 && index < videos.length) {
          containerRef.current.scrollTo({
            top: index * window.innerHeight,
            behavior: 'smooth',
          });
          setActiveIndex(index);
        }
      },
      [videos.length]
    );

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

    const handleNextVideo = useCallback(() => {
      if (activeIndex < videos.length - 1) {
        scrollToVideo(activeIndex + 1);
      } else if (hasMore) {
        onLoadMore();
      }
    }, [activeIndex, videos.length, scrollToVideo, hasMore, onLoadMore]);

    if (videos.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white bg-black pt-20">
          <Film className="w-16 h-16 text-zinc-800 mb-4" />
          <p className="text-lg mb-2 font-bold">{t.videoFeed.noVideos}</p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-indigo-600 rounded-full text-sm font-bold"
          >
            {t.videoFeed.refresh}
          </button>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full bg-black">
        {showToast && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in">
              <Infinity className="w-5 h-5 text-green-400" />
              <span className="font-bold">{t.videoFeed.autoPlayOn}</span>
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
              <VideoCardItem
                item={item}
                index={index}
                activeIndex={activeIndex}
                client={client}
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete}
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                isAutoPlay={isAutoPlay}
                onToggleAutoPlay={onToggleAutoPlay}
                onVideoEnd={handleNextVideo}
                t={t.videoCard}
              />
            </div>
          ))}

          {feedType === 'random' && videos.length > 0 && (
            <div className="h-[100dvh] w-full snap-center flex flex-col items-center justify-center bg-zinc-900 text-white gap-4">
              <Shuffle className="w-16 h-16 text-zinc-700" />
              <button
                onClick={onRefresh}
                className="px-8 py-4 bg-indigo-600 rounded-full text-lg font-bold"
              >
                {t.videoFeed.shuffle}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoFeed.displayName = 'VideoFeed';

export default VideoFeed;

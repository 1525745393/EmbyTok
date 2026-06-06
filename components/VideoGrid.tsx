import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { EmbyItem, FeedType } from '../types';
import { MediaClient } from '../services/MediaClient';
import {
  PlayCircle,
  Clock,
  RefreshCw,
  Shuffle,
  Layers,
  Folder as FolderIcon,
  History,
} from 'lucide-react';

interface VideoGridProps {
  videos: EmbyItem[];
  client: MediaClient;
  onSelect: (index: number) => void;
  isLoading?: boolean;
  feedType: FeedType;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  currentIndex?: number;
  onNavigate?: (id: string, title: string) => void;
  currentParentId?: string;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  client,
  onSelect,
  isLoading,
  feedType,
  hasMore,
  onLoadMore,
  onRefresh,
  currentIndex = 0,
  onNavigate,
  currentParentId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    setIsTV(window.navigator.userAgent.toLowerCase().includes('tv'));
  }, []);

  const formatTime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes}m`;
  };

  useEffect(() => {
    if (videos.length > 0 && !isLoading) {
      const firstElement = document.getElementById(`grid-item-${currentIndex}`);
      firstElement?.focus();
    }
  }, [videos, isLoading]);

  const handleItemClick = (item: EmbyItem, index: number) => {
    const isNavFolder = [
      'Series',
      'Season',
      'Folder',
      'CollectionFolder',
      'BoxSet',
      'show',
      'season',
    ].includes(item.Type);
    if (isNavFolder && onNavigate) {
      onNavigate(item.Id, item.Name);
    } else {
      onSelect(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: EmbyItem, index: number) => {
    if (e.key === 'Enter') {
      handleItemClick(item, index);
    }
  };

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <p className="mb-4">暂无内容</p>
        <button
          tabIndex={0}
          onClick={onRefresh}
          className="px-6 py-2 bg-zinc-800 rounded-full focus:bg-white/20"
        >
          刷新
        </button>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-auto bg-black p-4 no-scrollbar"
    >
      {/* 优化后的栅格：电视端显示更多，边距更宽 */}
      <div
        className={`grid gap-4 pt-24 pb-20 ${isTV ? 'grid-cols-6 xl:grid-cols-8' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`}
      >
        {videos.map((item, index) => {
          const posterSrc = item.ImageTags?.Primary
            ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
            : undefined;

          const isFolder = [
            'Series',
            'Season',
            'Folder',
            'CollectionFolder',
            'BoxSet',
            'show',
            'season',
          ].includes(item.Type);
          const progress =
            item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
              ? Math.min(
                  Math.round((item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100),
                  100
                )
              : 0;

          return (
            <div
              key={item.Id}
              id={`grid-item-${index}`}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
              onClick={() => handleItemClick(item, index)}
              className="relative aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                focus:ring-8 focus:ring-white focus:scale-110 focus:z-50 focus:shadow-[0_0_40px_rgba(255,255,255,0.3)]
                hover:bg-zinc-800 group"
            >
              {posterSrc ? (
                <img
                  src={posterSrc}
                  alt={item.Name}
                  className="w-full h-full object-cover transition-transform group-focus:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                  {isFolder ? (
                    <FolderIcon className="w-8 h-8 opacity-50" />
                  ) : (
                    <PlayCircle className="w-8 h-8 opacity-50" />
                  )}
                </div>
              )}

              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                  <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white text-[13px] font-bold line-clamp-1 group-focus:line-clamp-none transition-all">
                  {item.Name}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 opacity-60">
                  {item.RunTimeTicks && !isFolder && <span>{formatTime(item.RunTimeTicks)}</span>}
                  {item.ProductionYear && <span>{item.ProductionYear}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div id="load-more-trigger" className="h-20" />
    </div>
  );
};

export default VideoGrid;

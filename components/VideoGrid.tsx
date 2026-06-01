import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { EmbyItem, FeedType } from '../types';
import { MediaClient } from '../services/MediaClient';
import { PlayCircle, Folder as FolderIcon } from 'lucide-react';
import { formatTime, isFolderType, calculatePlaybackProgress, isTVDevice } from '../utils';

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

const VideoGrid: React.FC<VideoGridProps> = React.memo(
  ({
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
    const isTV = useMemo(() => isTVDevice(), []);

    useEffect(() => {
      if (videos.length > 0 && !isLoading) {
        const firstElement = document.getElementById(`grid-item-${currentIndex}`);
        firstElement?.focus();
      }
    }, [videos, isLoading, currentIndex]);

    const handleItemClick = useCallback(
      (item: EmbyItem, index: number) => {
        if (isFolderType(item) && onNavigate) {
          onNavigate(item.Id, item.Name);
        } else {
          onSelect(index);
        }
      },
      [onNavigate, onSelect]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, item: EmbyItem, index: number) => {
        if (e.key === 'Enter') {
          handleItemClick(item, index);
        }
      },
      [handleItemClick]
    );

    const gridClass = useMemo(
      () =>
        `grid gap-4 pt-24 pb-20 ${isTV ? 'grid-cols-6 xl:grid-cols-8' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`,
      [isTV]
    );

    if (videos.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
          <p className="mb-4">暂无内容</p>
          <button
            tabIndex={0}
            onClick={onRefresh}
            className="px-6 py-2 bg-zinc-800 rounded-lg focus:bg-white/20"
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
        <div className={gridClass}>
          {videos.map((item, index) => {
            const posterSrc = useMemo(
              () =>
                item.ImageTags?.Primary
                  ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
                  : undefined,
              [client, item]
            );

            const isFolder = isFolderType(item);
            const progress = calculatePlaybackProgress(
              item.UserData?.PlaybackPositionTicks,
              item.RunTimeTicks
            );

            return (
              <div
                key={item.Id}
                id={`grid-item-${index}`}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, item, index)}
                onClick={() => handleItemClick(item, index)}
                className="relative aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 focus:ring-8 focus:ring-white focus:scale-110 focus:z-50 focus:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:bg-zinc-800 group"
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
  }
);

VideoGrid.displayName = 'VideoGrid';

export default VideoGrid;

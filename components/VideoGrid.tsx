import React, { useEffect, useRef } from 'react';
import { EmbyItem, ServerConfig, FeedType } from '../types';
import { getImageUrl } from '../services/embyService';
import { PlayCircle, Clock, RefreshCw, Shuffle } from 'lucide-react';

interface VideoGridProps {
  videos: EmbyItem[];
  config: ServerConfig;
  onSelect: (index: number) => void;
  isLoading?: boolean;
  
  // Pagination & Refresh
  feedType: FeedType;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
    videos, 
    config, 
    onSelect, 
    isLoading,
    feedType,
    hasMore,
    onLoadMore,
    onRefresh
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const formatTime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes}m`;
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading && feedType === 'latest') {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, isLoading, feedType, onLoadMore]);

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <p className="mb-4">暂无内容</p>
        <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full text-sm hover:bg-zinc-700"
        >
            <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-black p-2 pb-24">
      {/* Grid Layout: 2 cols on mobile, 3-4 cols on larger screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-16">
        {videos.map((item, index) => {
          const posterSrc = item.ImageTags?.Primary
            ? getImageUrl(config.url, item.Id, item.ImageTags.Primary, 'Primary')
            : undefined;

          return (
            <div 
              key={item.Id} 
              onClick={() => onSelect(index)}
              className="relative aspect-[2/3] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-80 transition-opacity group"
            >
              {/* Image */}
              {posterSrc ? (
                <img 
                  src={posterSrc} 
                  alt={item.Name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                   Emby
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

              {/* Play Icon (Shows on Hover/Focus) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-10 h-10 text-white/80 fill-black/50" />
              </div>

              {/* Metadata Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                 <h3 className="text-white text-xs font-bold line-clamp-2 drop-shadow-md mb-1">
                    {item.Name}
                 </h3>
                 <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                    {item.RunTimeTicks && (
                        <>
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(item.RunTimeTicks)}</span>
                        </>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Bottom Controls / Loading State */}
      <div className="w-full py-8 flex flex-col items-center justify-center text-zinc-500 gap-4" ref={loadMoreRef}>
          
          {/* Case 1: Loading */}
          {isLoading && (
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          )}

          {/* Case 2: Random Feed Refresh Button */}
          {!isLoading && feedType === 'random' && (
              <button 
                onClick={onRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white text-sm font-bold transition-all active:scale-95"
              >
                 <Shuffle className="w-4 h-4" /> 换一批
              </button>
          )}

          {/* Case 3: Latest Feed End of List */}
          {!isLoading && feedType === 'latest' && !hasMore && (
              <span className="text-xs">- 到底了 -</span>
          )}
      </div>
    </div>
  );
};

export default VideoGrid;
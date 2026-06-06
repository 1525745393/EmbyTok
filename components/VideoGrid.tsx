import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { VirtuosoGrid, VirtuosoGridProps } from 'react-virtuoso';
import { motion } from 'framer-motion';
import { EmbyItem, FeedType } from '../types';
import { MediaClient } from '../services/MediaClient';
import { PlayCircle, Layers, Folder as FolderIcon } from 'lucide-react';
import { SkeletonGrid } from './Skeleton';
import { useLoadingState } from '../src/hooks';

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

// 网格组件定义 - 需要放在组件外部避免每次渲染重新创建导致网格重挂载
const GridItem = ({ children, ...props }: { children: React.ReactNode }) => (
  <div
    {...props}
    className="aspect-[2/3] p-1"
  >
    {children}
  </div>
);

const GridList = ({ children, ...props }: { children: React.ReactNode }) => (
  <div
    {...props}
    className="flex flex-wrap content-start"
  >
    {children}
  </div>
);

// 底部加载指示器组件
const GridFooter = () => (
  <div className="h-20 flex items-center justify-center w-full">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
    currentParentId
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTV, setIsTV] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const { isInitialLoading, hasLoadedOnce, setTotalCount } = useLoadingState({
    batchSize: 4,
    initialLoadedCount: 0,
  });

  useEffect(() => {
    setIsTV(window.navigator.userAgent.toLowerCase().includes('tv'));
  }, []);

  // 监听容器宽度变化以支持响应式列数
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.offsetWidth - 32); // 减去 padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      setTotalCount(videos.length);
    }
  }, [videos.length, setTotalCount]);

  const formatTime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes}m`;
  };

  const handleItemClick = (item: EmbyItem, index: number) => {
      const isNavFolder = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet', 'show', 'season'].includes(item.Type);
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

  const shouldShowSkeleton = isLoading || (isInitialLoading && !hasLoadedOnce);
  const showSkeleton = shouldShowSkeleton && videos.length === 0;

  // 计算列数
  const columns = useMemo(() => {
    if (isTV) return 6;
    if (containerWidth >= 1280) return 5;
    if (containerWidth >= 1024) return 4;
    if (containerWidth >= 768) return 3;
    if (containerWidth >= 640) return 2;
    return 2;
  }, [isTV, containerWidth]);

  // 视频卡片组件
  const VideoCard = useCallback(({ item, itemIndex }: { item: EmbyItem; itemIndex: number }) => {
    const posterSrc = item.ImageTags?.Primary
      ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
      : undefined;
  
    const isFolder = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet', 'show', 'season'].includes(item.Type);
    const isBoxSet = item.Type === 'BoxSet';
    const progress = (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks) 
      ? Math.min(Math.round((item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100), 100) 
      : 0;

    return (
      <motion.div 
        key={item.Id}
        id={`grid-item-${itemIndex}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, item, itemIndex)}
        onClick={() => handleItemClick(item, itemIndex)}
        className={`relative h-full rounded-xl overflow-hidden cursor-pointer transition-all duration-300
          focus:ring-8 focus:ring-white focus:scale-110 focus:z-50 focus:shadow-[0_0_40px_rgba(255,255,255,0.3)]
          hover:bg-zinc-800 group
          ${isBoxSet ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 ring-2 ring-indigo-500/50' : 'bg-zinc-900'}`}
      >
        {posterSrc ? (
          <img src={posterSrc} alt={item.Name} className="w-full h-full object-cover transition-transform group-focus:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
              {isBoxSet ? <Layers className="w-8 h-8 text-indigo-400 opacity-70" /> : isFolder ? <FolderIcon className="w-8 h-8 opacity-50" /> : <PlayCircle className="w-8 h-8 opacity-50" />}
          </div>
        )}

        {/* BoxSet 徽章 */}
        {isBoxSet && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-600/90 px-2 py-1 rounded-full">
            <Layers className="w-3 h-3 text-white" />
            <span className="text-white text-[10px] font-bold">合集</span>
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
      </motion.div>
    );
  }, [client, onNavigate, onSelect]);

  // 网格组件配置
  const gridComponents = useMemo(() => ({
    List: GridList as any,
    Item: GridItem as any,
    Footer: hasMore ? (GridFooter as any) : undefined,
  }), [hasMore]);

  // 计算每项宽度百分比
  const itemWidthPercent = useMemo(() => {
    return `${100 / columns}%`;
  }, [columns]);

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <p className="mb-4">暂无内容</p>
        <button tabIndex={0} onClick={onRefresh} className="px-6 py-2 bg-zinc-800 rounded-full focus:bg-white/20">刷新</button>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="w-full h-full bg-black p-4 no-scrollbar">
      {showSkeleton && (
        <div className="pt-24">
          <SkeletonGrid count={12} columns={isTV ? 6 : 4} variant="card" />
        </div>
      )}
      
      {videos.length > 0 && (
        <div className="h-full pt-16" style={{ width: `calc(100% + 2rem)` }}>
          <VirtuosoGrid
            data={videos}
            components={gridComponents}
            increaseViewportBy={{ top: 400, bottom: 400 }}
            itemContent={(itemIndex, item) => (
              <VideoCard item={item} itemIndex={itemIndex} />
            )}
            useWindowScroll
            overscan={200}
            endReached={hasMore ? onLoadMore : undefined}
            style={{ height: 'calc(100vh - 120px)' }}
            itemClassName="virtual-grid-item"
          />
        </div>
      )}
      
      {/* 响应式网格样式 */}
      <style>{`
        .virtual-grid-item {
          width: ${itemWidthPercent};
          flex: none;
        }
        @media (min-width: 640px) {
          .virtual-grid-item { width: 50%; }
        }
        @media (min-width: 768px) {
          .virtual-grid-item { width: 33.333%; }
        }
        @media (min-width: 1024px) {
          .virtual-grid-item { width: 25%; }
        }
        @media (min-width: 1280px) {
          .virtual-grid-item { width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default VideoGrid;

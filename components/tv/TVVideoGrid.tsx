import React, { useEffect, useCallback, useRef } from 'react';
import { EmbyItem } from '../../types';
import { MediaClient } from '../../services/MediaClient';

interface TVVideoGridProps {
  videos: EmbyItem[];
  client: MediaClient;
  onSelect: (index: number) => void;
  initialFocusedIndex?: number;
}

const TVVideoGrid: React.FC<TVVideoGridProps> = ({
  videos,
  client,
  onSelect,
  initialFocusedIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 只在 initialFocusedIndex 明确变化时自动聚焦，避免在导航栏选择时触发
    // 移除 videos 依赖，防止切换媒体库时自动聚焦
    const target = document.getElementById(`tv-grid-${initialFocusedIndex}`);
    if (target) {
      target.focus();
      if (initialFocusedIndex < 8) {
        // 第一排：直接把容器滚到最顶端，确保物理占位符可见
        if (containerRef.current) containerRef.current.scrollTop = 0;
      } else {
        target.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [initialFocusedIndex]);

  // 核心：处理焦点滚动
  const handleFocus = useCallback((index: number, e: React.FocusEvent<HTMLElement>) => {
    const isFirstRow = index < 8;

    if (isFirstRow) {
      // 如果是第一排，不再使用 scrollIntoView（它会贴顶），而是让容器回弹到 0
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // 非第一排，保持居中，提供最佳视野
      e.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') onSelect(index);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto no-scrollbar tv-focus-container relative"
    >
      {/* 1. 物理占位符：彻底解决 padding 被滚动忽略的问题，为第一排留出约 48px 空间 */}
      <div className="h-12 w-full shrink-0 pointer-events-none" />

      {/* 2. 视频网格 */}
      <div className="grid grid-cols-8 gap-3 px-4 pb-[50vh]">
        {videos.map((item, index) => {
          const posterSrc = item.ImageTags?.Primary
            ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
            : undefined;

          return (
            <div
              key={item.Id}
              id={`tv-grid-${index}`}
              tabIndex={0}
              onFocus={(e) => handleFocus(index, e)}
              onClick={() => onSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="tv-focusable-card relative aspect-[2/3] bg-zinc-900 rounded-[12px] overflow-hidden cursor-pointer outline-none"
            >
              {posterSrc ? (
                <img
                  src={posterSrc}
                  alt={item.Name}
                  className="w-full h-full object-cover transition-transform duration-700 group-focus:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black text-[8px] text-center p-1 uppercase">
                  {item.Name}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-0 group-focus:opacity-100 transition-opacity duration-500" />

              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-4 opacity-0 group-focus:translate-y-0 group-focus:opacity-100 transition-all duration-500 ease-out">
                <p className="text-white font-black text-[10px] line-clamp-2 leading-tight">
                  {item.Name}
                </p>
                <p className="text-indigo-400 text-[7px] mt-1 font-black uppercase tracking-widest">
                  {item.ProductionYear || 'Content'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TVVideoGrid;

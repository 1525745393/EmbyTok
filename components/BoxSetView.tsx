import React, { useRef, useEffect, useState } from 'react';
import { EmbyItem } from '../types';
import { EmbyClient } from '../services/EmbyClient';
import { Play, ChevronLeft, Layers, Info } from 'lucide-react';

interface BoxSetViewProps {
  boxSet: EmbyItem;
  items: EmbyItem[];
  client: EmbyClient;
  onSelectItem: (item: EmbyItem) => void;
  onBack: () => void;
  onPlayAll?: () => void;
  language?: 'zh' | 'en';
}

// BoxSet海报卡片组件
const BoxSetPosterCard: React.FC<{
  item: EmbyItem;
  client: EmbyClient;
  onSelect: () => void;
  index: number;
}> = ({ item, client, onSelect, index }) => {
  const posterSrc = item.ImageTags?.Primary
    ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
    : undefined;

  const progress = (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks)
    ? Math.min(Math.round((item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100), 100)
    : 0;

  return (
    <div
      id={`boxset-item-${index}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className="relative aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        hover:scale-105 hover:z-10 focus:ring-4 focus:ring-white/50 focus:scale-105 focus:z-10 shrink-0"
      style={{ width: '140px' }}
    >
      {posterSrc ? (
        <img src={posterSrc} alt={item.Name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
          <Play className="w-8 h-8 opacity-50" />
        </div>
      )}

      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 hover:opacity-100 transition-opacity">
        <h4 className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{item.Name}</h4>
      </div>
    </div>
  );
};

const BoxSetView: React.FC<BoxSetViewProps> = ({
  boxSet,
  items,
  client,
  onSelectItem,
  onBack,
  onPlayAll,
  language = 'zh'
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    setIsTV(window.navigator.userAgent.toLowerCase().includes('tv'));
  }, []);

  // 聚焦第一个海报
  useEffect(() => {
    if (items.length > 0) {
      const firstElement = document.getElementById('boxset-item-0');
      firstElement?.focus();
    }
  }, [items.length]);

  // 横向滚动处理
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && scrollContainerRef.current) {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, items.length - 1);
      document.getElementById(`boxset-item-${nextIndex}`)?.focus();
    } else if (e.key === 'ArrowLeft' && scrollContainerRef.current) {
      e.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      document.getElementById(`boxset-item-${prevIndex}`)?.focus();
    }
  };

  const formatTime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes}m`;
  };

  const boxSetImageUrl = boxSet.ImageTags?.Primary
    ? client.getImageUrl(boxSet.Id, boxSet.ImageTags.Primary, 'Primary')
    : boxSet.ImageTags?.Backdrop
      ? client.getImageUrl(boxSet.Id, boxSet.ImageTags.Backdrop, 'Backdrop')
      : undefined;

  const totalDuration = items.reduce((acc, item) => acc + (item.RunTimeTicks || 0), 0);

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">{language === 'zh' ? '返回' : 'Back'}</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span className="text-white/60 text-sm">
            {language === 'zh' ? '合集' : 'Collection'}
          </span>
        </div>
      </div>

      {/* 背景图片 */}
      {boxSetImageUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={boxSetImageUrl}
            alt=""
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      {/* 内容区域 */}
      <div className="relative z-10 flex-1 overflow-y-auto pt-24 pb-8">
        {/* 合集信息 */}
        <div className="px-6 mb-8">
          <div className="flex gap-6 items-start">
            {/* 合集海报 */}
            {boxSetImageUrl && (
              <img
                src={boxSetImageUrl}
                alt={boxSet.Name}
                className="w-40 h-60 object-cover rounded-xl shadow-2xl shrink-0"
              />
            )}
            
            {/* 合集信息 */}
            <div className="flex-1">
              <h1 className="text-white text-3xl font-bold mb-3">{boxSet.Name}</h1>
              
              <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
                <span>{items.length} {language === 'zh' ? '部影片' : 'videos'}</span>
                {totalDuration > 0 && (
                  <span>{formatTime(totalDuration)}</span>
                )}
                {boxSet.ProductionYear && (
                  <span>{boxSet.ProductionYear}</span>
                )}
              </div>

              {/* 播放按钮 */}
              <div className="flex gap-3 mb-4">
                {onPlayAll && items.length > 0 && (
                  <button
                    onClick={onPlayAll}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-colors"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>{language === 'zh' ? '播放全部' : 'Play All'}</span>
                  </button>
                )}
              </div>

              {/* 简介 */}
              {boxSet.Overview && (
                <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                  {boxSet.Overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 横向滚动海报列表 */}
        <div className="px-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            {language === 'zh' ? '包含影片' : 'Included Videos'}
          </h2>
          
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
            onKeyDown={(e) => {
              const focused = document.activeElement;
              const match = focused?.id.match(/boxset-item-(\d+)/);
              if (match) {
                handleKeyDown(e, parseInt(match[1]));
              }
            }}
          >
            {items.map((item, index) => (
              <BoxSetPosterCard
                key={item.Id}
                item={item}
                client={client}
                index={index}
                onSelect={() => onSelectItem(item)}
              />
            ))}
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Info className="w-12 h-12 mb-4 opacity-50" />
              <p>{language === 'zh' ? '暂无影片' : 'No videos found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoxSetView;

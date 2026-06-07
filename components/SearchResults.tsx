import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Play, Search as SearchIcon, Video, Film, Music, Folder } from 'lucide-react';
import { useTranslation } from '../src/hooks';

interface SearchResultsProps {
  results: EmbyItem[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  query: string;
  client: MediaClient | null;
  onSelectVideo: (item: EmbyItem) => void;
  onLoadMore?: () => void;
}

type ItemCategory = 'Movie' | 'Series' | 'Episode' | 'Video' | 'Music' | 'Other';

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  loadingMore = false,
  hasMore = false,
  query,
  client,
  onSelectVideo,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const categorizedItems = useMemo(() => {
    const categories: Record<ItemCategory, EmbyItem[]> = {
      Movie: [],
      Series: [],
      Episode: [],
      Video: [],
      Music: [],
      Other: [],
    };

    results.forEach((item) => {
      let category: ItemCategory = 'Other';

      if (item.Type === 'Movie') {
        category = 'Movie';
      } else if (item.Type === 'Series') {
        category = 'Series';
      } else if (item.Type === 'Episode') {
        category = 'Episode';
      } else if (item.Type === 'Video') {
        category = 'Video';
      } else if (
        item.Type === 'Audio' ||
        item.Type === 'MusicAlbum' ||
        item.Type === 'MusicArtist'
      ) {
        category = 'Music';
      }

      categories[category].push(item);
    });

    return categories;
  }, [results]);

  const getCategoryIcon = (category: ItemCategory) => {
    switch (category) {
      case 'Movie':
      case 'Video':
        return <Video size={20} />;
      case 'Series':
      case 'Episode':
        return <Film size={20} />;
      case 'Music':
        return <Music size={20} />;
      default:
        return <Folder size={20} />;
    }
  };

  const getCategoryLabel = (category: ItemCategory) => {
    switch (category) {
      case 'Movie':
        return '电影';
      case 'Series':
        return '剧集';
      case 'Episode':
        return '单集';
      case 'Video':
        return '视频';
      case 'Music':
        return '音乐';
      default:
        return '其他';
    }
  };

  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, loadingMore]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">{t.search?.searching || '搜索中...'}</p>
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <SearchIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">输入关键词开始搜索</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <SearchIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">
            {t.search?.noResults || '未找到结果'}
          </h3>
          <p className="text-zinc-500">尝试使用其他关键词搜索</p>
        </div>
      </div>
    );
  }

  const renderCategoryItems = (category: ItemCategory, items: EmbyItem[]) => {
    if (items.length === 0) return null;

    return (
      <div key={category} className="mb-6">
        <div className="flex items-center gap-2 mb-4 px-4">
          <div className="text-indigo-400">{getCategoryIcon(category)}</div>
          <h3 className="text-white font-medium">
            {getCategoryLabel(category)} ({items.length})
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {items.map((item) => {
            const imageUrl = client?.getImageUrl(item.Id, item.ImageTags?.Primary || '', 'Primary');

            return (
              <div
                key={item.Id}
                onClick={() => onSelectVideo(item)}
                className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group hover:bg-zinc-800 transition-colors"
              >
                <div className="relative aspect-video">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.Name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Play className="w-10 h-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm truncate">{item.Name}</h3>
                  {item.ProductionYear && (
                    <p className="text-zinc-500 text-xs mt-1">{item.ProductionYear}</p>
                  )}
                  {item.SeriesName && (
                    <p className="text-zinc-500 text-xs mt-1 truncate">{item.SeriesName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <p className="text-zinc-400 text-sm mb-4">
          {t.search?.results || '搜索结果'} ({results.length})
        </p>
      </div>

      {renderCategoryItems('Movie', categorizedItems.Movie)}
      {renderCategoryItems('Series', categorizedItems.Series)}
      {renderCategoryItems('Episode', categorizedItems.Episode)}
      {renderCategoryItems('Video', categorizedItems.Video)}
      {renderCategoryItems('Music', categorizedItems.Music)}
      {renderCategoryItems('Other', categorizedItems.Other)}

      {(hasMore || loadingMore) && (
        <div ref={loadMoreRef} className="p-4 flex items-center justify-center">
          {loadingMore ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-3 border-white/30 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-zinc-500 text-sm">加载更多...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
            >
              加载更多
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchResults);

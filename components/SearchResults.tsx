import React from 'react';
import { EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Play, Search as SearchIcon } from 'lucide-react';
import { useTranslation } from '../src/hooks';

interface SearchResultsProps {
  results: EmbyItem[];
  loading: boolean;
  query: string;
  client: MediaClient | null;
  onSelectVideo: (item: EmbyItem) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  query,
  client,
  onSelectVideo,
}) => {
  const { t } = useTranslation();

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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <p className="text-zinc-400 text-sm mb-4">
          {t.search?.results || '搜索结果'} ({results.length})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((item) => {
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchResults);

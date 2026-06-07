import React, { useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import { useTranslation } from '../src/hooks';
import type { SearchHistoryItem } from '../types';

interface SearchBarProps {
  query: string;
  isFocused: boolean;
  searchHistory: SearchHistoryItem[];
  onQueryChange: (query: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onHistoryItemClick: (query: string) => void;
  onRemoveHistoryItem: (query: string) => void;
  onClearHistory: () => void;
  onClearQuery: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  isFocused,
  searchHistory,
  onQueryChange,
  onFocus,
  onBlur,
  onHistoryItemClick,
  onRemoveHistoryItem,
  onClearHistory,
  onClearQuery,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBlur();
      }
    },
    [onBlur]
  );

  const handleRemoveHistoryItem = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.preventDefault();
      e.stopPropagation();
      onRemoveHistoryItem(query);
    },
    [onRemoveHistoryItem]
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-indigo-500/50 transition-colors">
        <Search size={18} className="text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={t.search?.placeholder || '搜索视频...'}
          className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-sm"
        />
        {query && (
          <button
            onClick={onClearQuery}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isFocused && searchHistory.length > 0 && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-zinc-400 text-sm font-medium">
              {t.search?.recentSearches || '最近搜索'}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearHistory();
              }}
              className="text-zinc-500 text-sm hover:text-white transition-colors"
            >
              {t.search?.clearHistory || '清空'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchHistory.map((item, index) => (
              <div key={index} className="flex items-center group">
                <button
                  onClick={() => onHistoryItemClick(item.query)}
                  className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                >
                  <Clock size={16} className="text-zinc-500 flex-shrink-0" />
                  <span className="text-white text-sm truncate">{item.query}</span>
                </button>
                <button
                  onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                  className="px-4 py-3 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);

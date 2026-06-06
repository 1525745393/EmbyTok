# 搜索功能 Implementation Plan

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现快速搜索功能，包括搜索栏、实时搜索建议、搜索历史、搜索结果展示

**Architecture:**

- 新增自定义 Hook `useSearch` 管理搜索状态和逻辑
- 更新 `EmbyClient` 添加搜索 API 方法
- 新增组件 `SearchBar` 和 `SearchResults`
- 集成到 `StandardRoot` 中

**Tech Stack:** React 18, TypeScript, localStorage, Emby API

---

## 任务分解

### Task 1: 更新类型定义

**Files:**

- Modify: `types.ts`

- [ ] **Step 1: 添加搜索相关类型**

在 types.ts 文件末尾添加：

```typescript
export interface SearchResult {
  items: EmbyItem[];
  totalRecordCount: number;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}
```

- [ ] **Step 2: 验证类型定义**

```bash
npm run build
```

Expected: 无类型错误

---

### Task 2: 更新 EmbyClient 添加搜索方法

**Files:**

- Modify: `services/EmbyClient.ts`

- [ ] **Step 1: 添加搜索 API 方法**

在 EmbyClient 类中添加：

```typescript
async search(query: string, limit: number = 50): Promise&lt;SearchResult&gt; {
  const params = new URLSearchParams({
    SearchTerm: query,
    IncludeItemTypes: 'Video,Movie,Episode',
    Recursive: 'true',
    Limit: limit.toString(),
    Fields: 'PrimaryImageAspectRatio,Overview,ProductionYear,UserData',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Thumb'
  });

  const response = await fetch(
    `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`,
    { headers: this.getHeaders() }
  );

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return {
    items: (data.Items || []).map((item: any) =&gt; ({
      ...item,
      Name: this.formatItemName(item)
    })),
    totalRecordCount: data.TotalRecordCount || 0
  };
}
```

- [ ] **Step 2: 确保 MediaClient 接口包含搜索方法**

检查 `services/MediaClient.ts`，确保接口声明包含搜索方法。

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

---

### Task 3: 创建 useSearch Hook

**Files:**

- Create: `src/hooks/useSearch.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: 创建 useSearch Hook**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { EmbyItem, SearchHistoryItem, SearchResult } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import { useLocalStorageState } from './useLocalStorageState';

const SEARCH_HISTORY_KEY = 'embytok_search_history';
const MAX_HISTORY_ITEMS = 20;
const DEBOUNCE_DELAY = 300;

export function useSearch(client: MediaClient | null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState&lt;SearchResult&gt;({ items: [], totalRecordCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState&lt;string | null&gt;(null);
  const [searchHistory, setSearchHistory] = useLocalStorageState&lt;SearchHistoryItem[]&gt;(
    SEARCH_HISTORY_KEY,
    []
  );
  const [showHistory, setShowHistory] = useState(false);

  const debounceTimerRef = useRef&lt;ReturnType&lt;typeof setTimeout&gt; | null&gt;(null);

  // 防抖搜索
  const debouncedSearch = useCallback((searchQuery: string) =&gt; {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setResults({ items: [], totalRecordCount: 0 });
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () =&gt; {
      if (!client) return;

      setIsLoading(true);
      setError(null);

      try {
        const searchResult = await client.search(searchQuery);
        setResults(searchResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults({ items: [], totalRecordCount: 0 });
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);
  }, [client]);

  // 当查询变化时触发搜索
  useEffect(() =&gt; {
    debouncedSearch(query);

    return () =&gt; {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debouncedSearch]);

  // 添加到搜索历史
  const addToHistory = useCallback((searchQuery: string) =&gt; {
    if (!searchQuery.trim()) return;

    setSearchHistory(prev =&gt; {
      // 移除已存在的相同查询
      const filtered = prev.filter(item =&gt; item.query.toLowerCase() !== searchQuery.toLowerCase());
      // 添加到开头
      const newItem: SearchHistoryItem = {
        query: searchQuery,
        timestamp: Date.now()
      };
      const newHistory = [newItem, ...filtered];
      // 限制数量
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  }, [setSearchHistory]);

  // 从历史中移除
  const removeFromHistory = useCallback((index: number) =&gt; {
    setSearchHistory(prev =&gt; prev.filter((_, i) =&gt; i !== index));
  }, [setSearchHistory]);

  // 清空历史
  const clearHistory = useCallback(() =&gt; {
    setSearchHistory([]);
  }, [setSearchHistory]);

  // 执行搜索（非防抖，用于点击历史记录等）
  const performSearch = useCallback((searchQuery: string) =&gt; {
    setQuery(searchQuery);
    addToHistory(searchQuery);
    setShowHistory(false);
  }, [addToHistory]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    searchHistory,
    showHistory,
    setShowHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    performSearch
  };
}
```

- [ ] **Step 2: 导出新 Hook**

修改 `src/hooks/index.ts`，添加：

```typescript
export { useSearch } from './useSearch';
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

---

### Task 4: 创建 SearchBar 组件

**Files:**

- Create: `components/SearchBar.tsx`

- [ ] **Step 1: 创建 SearchBar 组件**

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Trash2, ChevronRight } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) =&gt; void;
  onSearch: (query: string) =&gt; void;
  searchHistory: Array&lt;{ query: string; timestamp: number }&gt;;
  onRemoveHistory: (index: number) =&gt; void;
  onClearHistory: () =&gt; void;
  isLoading?: boolean;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    placeholder: '搜索视频...',
    recentSearches: '最近搜索',
    clearHistory: '清空历史',
    clearConfirm: '确定要清空搜索历史吗？',
    cancel: '取消',
    clear: '清空'
  },
  en: {
    placeholder: 'Search videos...',
    recentSearches: 'Recent searches',
    clearHistory: 'Clear history',
    clearConfirm: 'Are you sure you want to clear search history?',
    cancel: 'Cancel',
    clear: 'Clear'
  }
};

function formatRelativeTime(timestamp: number, lang: 'zh' | 'en'): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (lang === 'zh') {
    if (minutes &lt; 1) return '刚刚';
    if (minutes &lt; 60) return `${minutes}分钟前`;
    if (hours &lt; 24) return `${hours}小时前`;
    if (days &lt; 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  } else {
    if (minutes &lt; 1) return 'Just now';
    if (minutes &lt; 60) return `${minutes}m ago`;
    if (hours &lt; 24) return `${hours}h ago`;
    if (days &lt; 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US');
  }
}

export function SearchBar({
  query,
  onQueryChange,
  onSearch,
  searchHistory,
  onRemoveHistory,
  onClearHistory,
  isLoading = false,
  language
}: SearchBarProps) {
  const texts = t[language];
  const inputRef = useRef&lt;HTMLInputElement&gt;(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
    const newQuery = e.target.value;
    onQueryChange(newQuery);
    setShowDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) =&gt; {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowDropdown(false);
    }
  };

  const handleClear = () =&gt; {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleHistoryClick = (historyQuery: string) =&gt; {
    onSearch(historyQuery);
    setShowDropdown(false);
  };

  const handleClearHistory = () =&gt; {
    if (confirm(texts.clearConfirm)) {
      onClearHistory();
    }
    setShowClearConfirm(false);
  };

  useEffect(() =&gt; {
    const handleClickOutside = (e: MouseEvent) =&gt; {
      const target = e.target as Node;
      if (inputRef.current &amp;&amp; !inputRef.current.contains(target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =&gt; document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    &lt;div className="relative"&gt;
      &lt;form onSubmit={handleSubmit} className="relative"&gt;
        &lt;div className="relative"&gt;
          &lt;Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" /&gt;
          &lt;input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() =&gt; searchHistory.length &gt; 0 &amp;&amp; setShowDropdown(true)}
            placeholder={texts.placeholder}
            className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-10 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
          /&gt;
          {query &amp;&amp; (
            &lt;button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            &gt;
              &lt;X className="w-5 h-5" /&gt;
            &lt;/button&gt;
          )}
        &lt;/div&gt;
      &lt;/form&gt;

      {showDropdown &amp;&amp; searchHistory.length &gt; 0 &amp;&amp; !query &amp;&amp; (
        &lt;div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-white/10"&gt;
          &lt;div className="flex items-center justify-between px-4 py-3 border-b border-white/10"&gt;
            &lt;span className="text-sm text-white/60"&gt;{texts.recentSearches}&lt;/span&gt;
            &lt;button
              onClick={() =&gt; setShowClearConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300"
            &gt;
              {texts.clearHistory}
            &lt;/button&gt;
          &lt;/div&gt;
          &lt;div className="max-h-64 overflow-y-auto"&gt;
            {searchHistory.map((item, index) =&gt; (
              &lt;div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer group"
              &gt;
                &lt;button
                  onClick={() =&gt; handleHistoryClick(item.query)}
                  className="flex items-center gap-3 flex-1 text-left"
                &gt;
                  &lt;Clock className="w-4 h-4 text-white/40" /&gt;
                  &lt;span className="text-white truncate"&gt;{item.query}&lt;/span&gt;
                  &lt;span className="text-xs text-white/30 ml-auto"&gt;
                    {formatRelativeTime(item.timestamp, language)}
                  &lt;/span&gt;
                &lt;/button&gt;
                &lt;button
                  onClick={(e) =&gt; {
                    e.stopPropagation();
                    onRemoveHistory(index);
                  }}
                  className="p-1 text-white/20 hover:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                &gt;
                  &lt;X className="w-4 h-4" /&gt;
                &lt;/button&gt;
              &lt;/div&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {showClearConfirm &amp;&amp; (
        &lt;div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"&gt;
          &lt;div className="bg-zinc-900 rounded-xl p-6 max-w-sm w-full"&gt;
            &lt;p className="text-white mb-4"&gt;{texts.clearConfirm}&lt;/p&gt;
            &lt;div className="flex gap-3 justify-end"&gt;
              &lt;button
                onClick={() =&gt; setShowClearConfirm(false)}
                className="px-4 py-2 text-white/60 hover:text-white"
              &gt;
                {texts.cancel}
              &lt;/button&gt;
              &lt;button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              &gt;
                {texts.clear}
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
}

export default SearchBar;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 5: 创建 SearchResults 组件

**Files:**

- Create: `components/SearchResults.tsx`

- [ ] **Step 1: 创建 SearchResults 组件**

```typescript
import React from 'react';
import { EmbyItem } from '../types';
import { Search, Film, X } from 'lucide-react';
import VideoGrid from './VideoGrid';
import { MediaClient } from '../services/MediaClient';

interface SearchResultsProps {
  query: string;
  results: EmbyItem[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  client: MediaClient;
  onSelect: (item: EmbyItem, index: number) =&gt; void;
  onClose: () =&gt; void;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    results: '个结果',
    noResults: '未找到相关视频',
    tryDifferent: '尝试其他关键词',
    searching: '搜索中...',
    error: '搜索出错，请重试',
    back: '返回'
  },
  en: {
    results: 'results',
    noResults: 'No videos found',
    tryDifferent: 'Try different keywords',
    searching: 'Searching...',
    error: 'Search error, please try again',
    back: 'Back'
  }
};

export function SearchResults({
  query,
  results,
  totalCount,
  isLoading,
  error,
  client,
  onSelect,
  onClose,
  language
}: SearchResultsProps) {
  const texts = t[language];

  return (
    &lt;div className="h-full bg-black flex flex-col"&gt;
      &lt;div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 p-4 flex items-center gap-3"&gt;
        &lt;button
          onClick={onClose}
          className="p-2 -ml-2 text-white/60 hover:text-white"
        &gt;
          &lt;X className="w-6 h-6" /&gt;
        &lt;/button&gt;
        &lt;div className="flex-1"&gt;
          &lt;h2 className="text-lg font-bold text-white truncate"&gt;"{query}"&lt;/h2&gt;
          {!isLoading &amp;&amp; !error &amp;&amp; (
            &lt;p className="text-sm text-white/50"&gt;
              {totalCount} {texts.results}
            &lt;/p&gt;
          )}
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="flex-1 overflow-y-auto"&gt;
        {isLoading &amp;&amp; (
          &lt;div className="flex flex-col items-center justify-center h-64 text-white/60"&gt;
            &lt;div className="w-8 h-8 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin mb-4" /&gt;
            &lt;p&gt;{texts.searching}&lt;/p&gt;
          &lt;/div&gt;
        )}

        {error &amp;&amp; (
          &lt;div className="flex flex-col items-center justify-center h-64 text-white/60"&gt;
            &lt;Search className="w-12 h-12 text-red-400/50 mb-4" /&gt;
            &lt;p&gt;{texts.error}&lt;/p&gt;
          &lt;/div&gt;
        )}

        {!isLoading &amp;&amp; !error &amp;&amp; results.length === 0 &amp;&amp; (
          &lt;div className="flex flex-col items-center justify-center h-64 text-white/60"&gt;
            &lt;Film className="w-12 h-12 text-white/30 mb-4" /&gt;
            &lt;p className="text-lg mb-2"&gt;{texts.noResults}&lt;/p&gt;
            &lt;p className="text-sm"&gt;{texts.tryDifferent}&lt;/p&gt;
          &lt;/div&gt;
        )}

        {!isLoading &amp;&amp; !error &amp;&amp; results.length &gt; 0 &amp;&amp; (
          &lt;div className="p-4"&gt;
            &lt;VideoGrid
              videos={results}
              client={client}
              isLoading={false}
              feedType="latest"
              hasMore={false}
              onSelect={onSelect}
              onLoadMore={() =&gt; {}}
              onRefresh={() =&gt; {}}
              currentIndex={0}
              onNavigate={() =&gt; {}}
            /&gt;
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

export default SearchResults;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 6: 集成到 StandardRoot

**Files:**

- Modify: `components/standard/StandardRoot.tsx`
- Modify: `src/locales/zh.ts`
- Modify: `src/locales/en.ts`

- [ ] **Step 1: 更新翻译文件**

在 `src/locales/zh.ts` 中添加搜索相关翻译：

```typescript
search: {
  placeholder: '搜索视频...',
  recentSearches: '最近搜索',
  clearHistory: '清空历史',
  clearConfirm: '确定要清空搜索历史吗？',
  results: '个结果',
  noResults: '未找到相关视频',
  tryDifferent: '尝试其他关键词',
  searching: '搜索中...',
  error: '搜索出错，请重试',
  back: '返回'
}
```

在 `src/locales/en.ts` 中添加：

```typescript
search: {
  placeholder: 'Search videos...',
  recentSearches: 'Recent searches',
  clearHistory: 'Clear history',
  clearConfirm: 'Are you sure you want to clear search history?',
  results: 'results',
  noResults: 'No videos found',
  tryDifferent: 'Try different keywords',
  searching: 'Searching...',
  error: 'Search error, please try again',
  back: 'Back'
}
```

- [ ] **Step 2: 导入搜索组件和 Hook**

在 StandardRoot.tsx 顶部添加：

```typescript
import { SearchBar } from '../SearchBar';
import { SearchResults } from '../SearchResults';
import { useSearch } from '../../src/hooks';
```

- [ ] **Step 3: 添加搜索状态和 Hook**

在 StandardRoot 组件内部添加：

```typescript
const {
  query,
  setQuery,
  results,
  isLoading,
  error,
  searchHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  performSearch,
} = useSearch(client);
const [showSearchResults, setShowSearchResults] = useState(false);
```

- [ ] **Step 4: 添加搜索栏到导航区域**

修改顶部导航区域，在菜单按钮旁边添加搜索栏：

```typescript
&lt;div className="min-w-[44px] flex items-center"&gt;
  {navStack.length &gt; 0 ? (
    &lt;button onClick={() =&gt; setNavStack(prev =&gt; prev.slice(0, -1))} className="p-2"&gt;
      &lt;ChevronLeft size={24} /&gt;
    &lt;/button&gt;
  ) : (
    &lt;button onClick={() =&gt; setIsMenuOpen(true)} className="p-2"&gt;
      &lt;Menu size={24} /&gt;
    &lt;/button&gt;
  )}
&lt;/div&gt;

{!showHistory &amp;&amp; (
  &lt;div className="flex-1 max-w-md mx-2"&gt;
    &lt;SearchBar
      query={query}
      onQueryChange={setQuery}
      onSearch={(searchQuery) =&gt; {
        performSearch(searchQuery);
        setShowSearchResults(true);
      }}
      searchHistory={searchHistory}
      onRemoveHistory={removeFromHistory}
      onClearHistory={clearHistory}
      isLoading={isLoading}
      language={language}
    /&gt;
  &lt;/div&gt;
)}
```

- [ ] **Step 5: 添加搜索结果视图**

在内容区域添加搜索结果的条件渲染：

```typescript
{showSearchResults ? (
  &lt;SearchResults
    query={query}
    results={results.items}
    totalCount={results.totalRecordCount}
    isLoading={isLoading}
    error={error}
    client={client}
    onSelect={(item, index) =&gt; {
      const existingIndex = videos.findIndex(v =&gt; v.Id === item.Id);
      if (existingIndex &gt;= 0) {
        setCurrentIndex(existingIndex);
      } else {
        setVideos([item, ...videos]);
        setCurrentIndex(0);
      }
      setShowSearchResults(false);
      setShowHistory(false);
      setViewMode('feed');
    }}
    onClose={() =&gt; {
      setShowSearchResults(false);
      setQuery('');
    }}
    language={language}
  /&gt;
) : showHistory ? (
  &lt;WatchHistory ... /&gt;
) : (
  // 原有内容
  viewMode === 'grid' ? (
    &lt;VideoGrid ... /&gt;
  ) : (
    &lt;VideoFeed ... /&gt;
  )
)}
```

- [ ] **Step 6: 验证集成**

```bash
npm run build
```

Expected: 构建成功

---

### Task 7: 最终测试和验证

**Files:** All modified files

- [ ] **Step 1: 完整构建验证**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 功能测试清单**

- [ ] 搜索栏显示正常
- [ ] 输入关键词后显示搜索结果
- [ ] 搜索历史记录保存和显示正常
- [ ] 点击历史记录可以重新搜索
- [ ] 搜索结果可以正常点击播放
- [ ] 搜索防抖工作正常
- [ ] 清除历史记录功能正常
- [ ] 中英文切换正常
- [ ] 错误状态显示正常
- [ ] 加载状态显示正常

---

## 实施完成检查

- [ ] 所有任务步骤完成
- [ ] 代码已提交
- [ ] 功能已测试验证
- [ ] 文档已更新

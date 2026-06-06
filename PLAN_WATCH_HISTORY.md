# 播放历史功能 Implementation Plan

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的观看历史记录功能，包括观看记录、进度保存、历史列表展示和管理

**Architecture:**

- 新增自定义 Hook `useWatchHistory` 管理历史数据
- 更新 `types.ts` 添加历史数据类型
- 新增组件 `WatchHistory.tsx` 展示历史列表
- 集成到 `VideoCard.tsx` 记录观看行为
- 在 `StandardRoot.tsx` 添加历史导航选项

**Tech Stack:** React 18, TypeScript, localStorage, existing EmbyTok codebase patterns

---

## 任务分解

### Task 1: 更新类型定义

**Files:**

- Modify: `types.ts`

- [ ] **Step 1: 添加 WatchHistory 相关类型到 types.ts**

在 types.ts 文件末尾添加以下类型定义：

```typescript
export interface WatchHistoryItem {
  itemId: string;
  item: EmbyItem;
  lastWatchedAt: number; // timestamp
  watchCount: number;
  lastProgress: number; // seconds
  totalWatchTime: number; // total seconds watched
}

export interface WatchHistory {
  items: WatchHistoryItem[];
  lastUpdated: number;
}

// 更新 FeedType 以包含 history
export type FeedType = 'latest' | 'random' | 'favorites' | 'history';
```

- [ ] **Step 2: 验证类型定义**

运行 TypeScript 编译检查：

```bash
npm run build
```

Expected: 无类型错误

---

### Task 2: 创建 useWatchHistory Hook

**Files:**

- Create: `src/hooks/useWatchHistory.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: 创建 useWatchHistory Hook**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { EmbyItem, WatchHistoryItem, WatchHistory } from '../../types';
import { useLocalStorageState } from './useLocalStorageState';

const WATCH_HISTORY_KEY = 'embytok_watch_history';
const MAX_HISTORY_ITEMS = 200;
const HISTORY_EXPIRY_DAYS = 30;

export function useWatchHistory() {
  const [history, setHistory] = useLocalStorageState&lt;WatchHistory&gt;(
    WATCH_HISTORY_KEY,
    { items: [], lastUpdated: Date.now() }
  );

  // 清理过期记录
  const cleanupExpiredItems = useCallback(() =&gt; {
    const now = Date.now();
    const expiryMs = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    setHistory(prev =&gt; {
      const validItems = prev.items.filter(
        item =&gt; now - item.lastWatchedAt &lt; expiryMs
      );

      // 限制最大数量
      const trimmedItems = validItems.slice(0, MAX_HISTORY_ITEMS);

      return {
        ...prev,
        items: trimmedItems,
        lastUpdated: now
      };
    });
  }, [setHistory]);

  // 记录观看
  const recordWatch = useCallback((item: EmbyItem, progressSeconds: number) =&gt; {
    const now = Date.now();

    setHistory(prev =&gt; {
      const existingIndex = prev.items.findIndex(h =&gt; h.itemId === item.Id);
      let newItems: WatchHistoryItem[];

      if (existingIndex &gt;= 0) {
        // 更新现有记录
        newItems = [...prev.items];
        const existing = newItems[existingIndex];
        newItems[existingIndex] = {
          ...existing,
          lastWatchedAt: now,
          watchCount: existing.watchCount + 1,
          lastProgress: progressSeconds,
          totalWatchTime: existing.totalWatchTime + Math.min(progressSeconds - existing.lastProgress, 300) // 每次最多加5分钟避免异常
        };

        // 移到最前面
        const [updated] = newItems.splice(existingIndex, 1);
        newItems.unshift(updated);
      } else {
        // 新增记录
        const newItem: WatchHistoryItem = {
          itemId: item.Id,
          item: item,
          lastWatchedAt: now,
          watchCount: 1,
          lastProgress: progressSeconds,
          totalWatchTime: Math.min(progressSeconds, 300)
        };
        newItems = [newItem, ...prev.items];
      }

      // 限制数量
      if (newItems.length &gt; MAX_HISTORY_ITEMS) {
        newItems = newItems.slice(0, MAX_HISTORY_ITEMS);
      }

      return {
        items: newItems,
        lastUpdated: now
      };
    });
  }, [setHistory]);

  // 更新播放进度（不增加观看次数）
  const updateProgress = useCallback((itemId: string, progressSeconds: number) =&gt; {
    setHistory(prev =&gt; {
      const existingIndex = prev.items.findIndex(h =&gt; h.itemId === itemId);
      if (existingIndex &lt; 0) return prev;

      const newItems = [...prev.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        lastProgress: progressSeconds,
        lastWatchedAt: Date.now()
      };

      return {
        ...prev,
        items: newItems,
        lastUpdated: Date.now()
      };
    });
  }, [setHistory]);

  // 删除单个记录
  const removeFromHistory = useCallback((itemId: string) =&gt; {
    setHistory(prev =&gt; ({
      ...prev,
      items: prev.items.filter(item =&gt; item.itemId !== itemId),
      lastUpdated: Date.now()
    }));
  }, [setHistory]);

  // 清空全部历史
  const clearHistory = useCallback(() =&gt; {
    setHistory({
      items: [],
      lastUpdated: Date.now()
    });
  }, [setHistory]);

  // 获取某个视频的历史记录
  const getHistoryItem = useCallback((itemId: string) =&gt; {
    return history.items.find(h =&gt; h.itemId === itemId);
  }, [history.items]);

  // 初始化时清理过期记录
  useEffect(() =&gt; {
    cleanupExpiredItems();
  }, [cleanupExpiredItems]);

  return {
    history,
    recordWatch,
    updateProgress,
    removeFromHistory,
    clearHistory,
    getHistoryItem
  };
}
```

- [ ] **Step 2: 导出新 Hook**

修改 `src/hooks/index.ts`，添加导出：

```typescript
export { useWatchHistory } from './useWatchHistory';
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

---

### Task 3: 集成 VideoCard 记录观看历史

**Files:**

- Modify: `components/VideoCard.tsx`

- [ ] **Step 1: 导入 useWatchHistory**

在 VideoCard.tsx 顶部添加导入：

```typescript
import { useWatchHistory } from '../src/hooks';
```

- [ ] **Step 2: 在组件中使用 Hook**

在 VideoCard 组件内部添加：

```typescript
const { recordWatch, updateProgress, getHistoryItem } = useWatchHistory();
const hasRecordedWatch = useRef(false);
const progressUpdateTimer = useRef&lt;ReturnType&lt;typeof setInterval&gt; | null&gt;(null);
```

- [ ] **Step 3: 记录首次观看**

修改播放开始的逻辑，在 handlePlaying 或 useEffect 中添加：

```typescript
// 在播放开始时记录
useEffect(() =&gt; {
  if (isActive &amp;&amp; isPlaying &amp;&amp; !hasRecordedWatch.current) {
    // 只在首次开始播放时记录一次
    recordWatch(item, currentTime);
    hasRecordedWatch.current = true;
  }
}, [isActive, isPlaying, item, currentTime, recordWatch]);

// 组件卸载时重置
useEffect(() =&gt; {
  return () =&gt; {
    hasRecordedWatch.current = false;
  };
}, [item.Id]);
```

- [ ] **Step 4: 定期更新进度**

添加进度更新逻辑：

```typescript
// 定期更新播放进度
useEffect(() =&gt; {
  if (isActive &amp;&amp; isPlaying) {
    progressUpdateTimer.current = setInterval(() =&gt; {
      if (videoRef.current &amp;&amp; !isSeeking) {
        updateProgress(item.Id, videoRef.current.currentTime);
      }
    }, 10000); // 每10秒更新一次
  }

  return () =&gt; {
    if (progressUpdateTimer.current) {
      clearInterval(progressUpdateTimer.current);
      progressUpdateTimer.current = null;
    }
  };
}, [isActive, isPlaying, item.Id, isSeeking, updateProgress]);
```

- [ ] **Step 5: 恢复上次播放进度**

修改 loadProgress 逻辑或添加新的 useEffect：

```typescript
// 在加载元数据时恢复历史进度
const handleLoadedMetadataWithHistory = useCallback(() =&gt; {
  if (videoRef.current) {
    // 先尝试从历史记录恢复
    const historyItem = getHistoryItem(item.Id);
    if (historyItem &amp;&amp; historyItem.lastProgress &gt; 0 &amp;&amp; historyItem.lastProgress &lt; videoRef.current.duration - 10) {
      videoRef.current.currentTime = historyItem.lastProgress;
      setCurrentTime(historyItem.lastProgress);
    } else {
      // 否则使用原有的 localStorage 逻辑
      const savedProgress = loadProgress();
      if (savedProgress &gt; 0 &amp;&amp; savedProgress &lt; videoRef.current.duration - 10) {
        videoRef.current.currentTime = savedProgress;
      }
    }
    setDuration(videoRef.current.duration);
  }
}, [item.Id, getHistoryItem, loadProgress]);

// 修改原有的 handleLoadedMetadata 调用
// 将 onLoadedMetadata 绑定到新函数
```

- [ ] **Step 6: 验证集成**

```bash
npm run build
```

Expected: 构建成功

---

### Task 4: 创建 WatchHistory 组件

**Files:**

- Create: `components/WatchHistory.tsx`

- [ ] **Step 1: 创建 WatchHistory 组件**

```typescript
import React, { useCallback } from 'react';
import { EmbyItem, WatchHistoryItem } from '../types';
import { Clock, Trash2, Play, X } from 'lucide-react';
import { useLazyImage } from '../src/hooks';

interface WatchHistoryProps {
  items: WatchHistoryItem[];
  onSelect: (item: EmbyItem, index: number) =&gt; void;
  onRemove: (itemId: string) =&gt; void;
  onClearAll: () =&gt; void;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    title: '观看历史',
    noHistory: '暂无观看历史',
    continueWatching: '继续观看',
    watched: '已观看',
    times: '次',
    clearAll: '清空历史',
    clearConfirm: '确定要清空全部观看历史吗？',
    removed: '已移除',
    lastWatched: '上次观看'
  },
  en: {
    title: 'Watch History',
    noHistory: 'No watch history yet',
    continueWatching: 'Continue Watching',
    watched: 'Watched',
    times: 'times',
    clearAll: 'Clear All',
    clearConfirm: 'Are you sure you want to clear all watch history?',
    removed: 'Removed',
    lastWatched: 'Last watched'
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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function WatchHistory({ items, onSelect, onRemove, onClearAll, language }: WatchHistoryProps) {
  const texts = t[language];
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleClearAll = useCallback(() =&gt; {
    if (confirm(texts.clearConfirm)) {
      onClearAll();
    }
    setShowClearConfirm(false);
  }, [onClearAll, texts.clearConfirm]);

  const { setRef: setPosterRef } = useLazyImage({ priority: 'medium' });

  if (items.length === 0) {
    return (
      &lt;div className="flex flex-col items-center justify-center h-full bg-black text-white p-4"&gt;
        &lt;Clock className="w-16 h-16 text-white/30 mb-4" /&gt;
        &lt;p className="text-white/60 text-lg"&gt;{texts.noHistory}&lt;/p&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;div className="h-full bg-black text-white overflow-y-auto"&gt;
      &lt;div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 p-4 flex items-center justify-between"&gt;
        &lt;h2 className="text-xl font-bold"&gt;{texts.title}&lt;/h2&gt;
        &lt;button
          onClick={() =&gt; setShowClearConfirm(true)}
          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
        &gt;
          &lt;Trash2 size={16} /&gt;
          {texts.clearAll}
        &lt;/button&gt;
      &lt;/div&gt;

      &lt;div className="p-4 space-y-4"&gt;
        {items.map((historyItem, index) =&gt; (
          &lt;div
            key={historyItem.itemId}
            className="bg-zinc-900 rounded-xl overflow-hidden group"
          &gt;
            &lt;div className="flex"&gt;
              &lt;div className="relative w-32 h-20 flex-shrink-0"&gt;
                {historyItem.item.ImageTags?.Primary &amp;&amp; (
                  &lt;img
                    ref={setPosterRef}
                    data-src={`/emby/Items/${historyItem.itemId}/Images/Primary?maxWidth=200`}
                    alt=""
                    className="w-full h-full object-cover"
                  /&gt;
                )}
                {historyItem.lastProgress &gt; 0 &amp;&amp; (
                  &lt;div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50"&gt;
                    &lt;div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${(historyItem.lastProgress / (historyItem.item.RunTimeTicks ? historyItem.item.RunTimeTicks / 10000000 : 100)) * 100}%`
                      }}
                    /&gt;
                  &lt;/div&gt;
                )}
                &lt;button
                  onClick={() =&gt; onSelect(historyItem.item, index)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                &gt;
                  &lt;Play size={32} className="fill-white" /&gt;
                &lt;/button&gt;
              &lt;/div&gt;

              &lt;div className="flex-1 p-3 flex flex-col justify-between"&gt;
                &lt;div&gt;
                  &lt;h3 className="font-semibold line-clamp-2 text-sm"&gt;
                    {historyItem.item.Name}
                  &lt;/h3&gt;
                  &lt;div className="text-white/50 text-xs mt-1 flex items-center gap-2"&gt;
                    &lt;span&gt;{texts.lastWatched}: {formatRelativeTime(historyItem.lastWatchedAt, language)}&lt;/span&gt;
                    &lt;span&gt;•&lt;/span&gt;
                    &lt;span&gt;{texts.watched} {historyItem.watchCount} {texts.times}&lt;/span&gt;
                  &lt;/div&gt;
                  {historyItem.lastProgress &gt; 0 &amp;&amp; (
                    &lt;div className="text-indigo-400 text-xs mt-1"&gt;
                      {texts.continueWatching}: {formatTime(historyItem.lastProgress)}
                    &lt;/div&gt;
                  )}
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;button
                onClick={() =&gt; onRemove(historyItem.itemId)}
                className="p-3 text-white/30 hover:text-red-400 transition-colors"
              &gt;
                &lt;X size={20} /&gt;
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        ))}
      &lt;/div&gt;

      {showClearConfirm &amp;&amp; (
        &lt;div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"&gt;
          &lt;div className="bg-zinc-900 rounded-xl p-6 max-w-sm w-full"&gt;
            &lt;p className="text-white mb-4"&gt;{texts.clearConfirm}&lt;/p&gt;
            &lt;div className="flex gap-3 justify-end"&gt;
              &lt;button
                onClick={() =&gt; setShowClearConfirm(false)}
                className="px-4 py-2 text-white/60 hover:text-white"
              &gt;
                {language === 'zh' ? '取消' : 'Cancel'}
              &lt;/button&gt;
              &lt;button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              &gt;
                {texts.clearAll}
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
}

export default WatchHistory;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 5: 集成到 StandardRoot

**Files:**

- Modify: `components/standard/StandardRoot.tsx`
- Modify: `src/locales/zh.ts`
- Modify: `src/locales/en.ts` (创建或更新)

- [ ] **Step 1: 更新中文翻译**

在 `src/locales/zh.ts` 中添加：

```typescript
watchHistory: {
  title: '观看历史',
  noHistory: '暂无观看历史',
  continueWatching: '继续观看',
  watched: '已观看',
  times: '次',
  clearAll: '清空历史',
  clearConfirm: '确定要清空全部观看历史吗？',
  history: '历史'
}
```

- [ ] **Step 2: 检查并创建英文翻译**

查看是否存在 `src/locales/en.ts`，如果不存在则创建，添加：

```typescript
export default {
  videoCard: {
    deleteVideo: 'Delete Video',
    deleteWarning: '⚠️ Warning: This will delete the original file from your media library!',
    deleteConfirm: 'Are you sure you want to delete this video?',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
    mediaType: 'Video',
    noOverview: 'No overview available',
    autoPlayOn: 'Auto-play enabled',
    doubleSpeed: '2x Speed',
    videoLoadError: 'Failed to load video',
  },
  login: {
    serverAddress: 'Server Address',
    username: 'Username',
    password: 'Password',
    plexToken: 'X-Plex-Token',
    plexTokenPlaceholder: 'Plex Token',
    submit: 'Connect',
    embyError: 'Connection failed, please check your credentials',
    plexError: 'Plex login failed',
    language: 'Language',
    chinese: '中文',
    english: 'English',
  },
  standardRoot: {
    favorites: 'Favorites',
    random: 'Random',
    latest: 'Latest',
    history: 'History',
    discover: 'Discover',
    deleteFailed: 'Deletion failed, please check permissions',
  },
  // ... 保持其他翻译
  watchHistory: {
    title: 'Watch History',
    noHistory: 'No watch history yet',
    continueWatching: 'Continue Watching',
    watched: 'Watched',
    times: 'times',
    clearAll: 'Clear All',
    clearConfirm: 'Are you sure you want to clear all watch history?',
    history: 'History',
  },
};
```

- [ ] **Step 3: 导入 WatchHistory 组件和 Hook**

在 StandardRoot.tsx 顶部添加：

```typescript
import { WatchHistory } from '../WatchHistory';
import { useWatchHistory } from '../../src/hooks';
```

- [ ] **Step 4: 添加状态管理**

在 StandardRoot 组件内部添加：

```typescript
const { history, removeFromHistory, clearHistory } = useWatchHistory();
const [showHistory, setShowHistory] = useState(false);
```

- [ ] **Step 5: 更新导航选项**

修改导航按钮部分，添加历史选项：

```typescript
{['favorites', 'random', 'latest', 'history'].map(type =&gt; (
  &lt;button
    key={type}
    onClick={() =&gt; {
      if (type === 'history') {
        setShowHistory(true);
      } else {
        setShowHistory(false);
        setFeedType(type as FeedType);
      }
    }}
    className={`transition-all duration-300 relative py-1 text-sm ${
      (type === 'history' &amp;&amp; showHistory) || (feedType === type &amp;&amp; !showHistory)
        ? 'text-white'
        : 'text-white/40'
    }`}
  &gt;
    {type === 'history'
      ? (language === 'zh' ? '历史' : 'History')
      : t[type as keyof typeof t]}
    {((type === 'history' &amp;&amp; showHistory) || (feedType === type &amp;&amp; !showHistory)) &amp;&amp; (
      &lt;div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" /&gt;
    )}
  &lt;/button&gt;
))}
```

- [ ] **Step 6: 添加历史视图渲染**

在内容区域添加条件渲染：

```typescript
{showHistory ? (
  &lt;WatchHistory
    items={history.items}
    onSelect={(item, index) =&gt; {
      // 找到或创建包含该项目的列表
      const existingIndex = videos.findIndex(v =&gt; v.Id === item.Id);
      if (existingIndex &gt;= 0) {
        setCurrentIndex(existingIndex);
      } else {
        // 将项目添加到列表开头
        setVideos([item, ...videos]);
        setCurrentIndex(0);
      }
      setShowHistory(false);
      setViewMode('feed');
    }}
    onRemove={removeFromHistory}
    onClearAll={clearHistory}
    language={language}
  /&gt;
) : (
  // 原有的 VideoFeed/VideoGrid 渲染
  viewMode === 'grid' ? (
    &lt;VideoGrid ... /&gt;
  ) : (
    &lt;VideoFeed ... /&gt;
  )
)}
```

- [ ] **Step 7: 验证集成**

```bash
npm run build
```

Expected: 构建成功

---

### Task 6: 最终测试和验证

**Files:** All modified files

- [ ] **Step 1: 完整构建验证**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 功能测试清单**

- [ ] 观看视频后能在历史列表中看到
- [ ] 再次观看时能恢复上次进度
- [ ] 观看次数正确统计
- [ ] 删除单个历史记录正常工作
- [ ] 清空全部历史正常工作
- [ ] 历史记录按时间倒序排列
- [ ] 中英文切换正常
- [ ] 长时间观看后进度正常更新

---

## 实施完成检查

- [ ] 所有任务步骤完成
- [ ] 代码已提交（至少每个 Task 一个 commit）
- [ ] 功能已测试验证
- [ ] 文档已更新（PRD中已记录）

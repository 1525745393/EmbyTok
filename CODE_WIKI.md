# EmbyTok Code Wiki

> 本文档提供 EmbyTok 项目的完整代码架构和开发参考，供开发者快速了解项目结构、模块职责和关键实现。

---

## 1. 项目概览

### 1.1 项目简介

**EmbyTok** 是一款为 **Emby** 和 **Plex** 媒体服务器设计的竖屏视频浏览客户端，提供类似 TikTok 的体验。它让用户能够以更现代、便捷的方式浏览个人媒体库，支持 Web 端、移动端和电视端。

- **技术栈**：React 18 + TypeScript + Vite + Tailwind CSS + Capacitor（Android）
- **核心功能**：媒体库浏览、竖屏视频流播放、字幕、收藏、观看历史、搜索、自动连播
- **多端适配**：Web/移动端（StandardRoot）+ 智能电视端（TVRoot）+ Android App（Capacitor）

### 1.2 项目版本与构建

- 版本号由 `package.json` 驱动，通过 `import.meta.env.VITE_APP_VERSION` 注入到应用中
- 生产构建使用 `terser` 压缩，自动分包（React vendor、UI vendor、动画 vendor）
- PWA 支持：Workbox 运行时缓存 + 图片缓存策略（CacheFirst，7 天）

### 1.3 核心目录结构

```
/workspace
├── index.html                 # 应用入口 HTML
├── App.tsx                    # 根组件（设备检测 + 模式切换）
├── types.ts                   # 全局类型定义（ServerConfig, EmbyItem, 收藏、历史、字幕等）
├── index.css                  # 全局样式（Tailwind 指令）
├── components/                # React UI 组件层
│   ├── standard/              # 标准/移动端根组件
│   │   └── StandardRoot.tsx
│   ├── tv/                    # 电视端根组件及 UI
│   │   ├── TVRoot.tsx
│   │   ├── TVDashboard.tsx
│   │   ├── TVVideoGrid.tsx
│   │   ├── TVVideoPlayer.tsx
│   │   └── TVSettings.tsx
│   ├── Login.tsx              # 登录 / 连接服务器页面
│   ├── VideoCard.tsx          # 单个视频播放卡片（核心播放逻辑）
│   ├── VideoFeed.tsx          # 竖屏滚动式视频流
│   ├── VideoGrid.tsx          # 栅格化海报视图
│   ├── VideoPlayer.tsx        # 基础视频播放器组件
│   ├── VideoSkeleton.tsx      # 加载占位
│   ├── VideoInfo.tsx          # 视频元信息
│   ├── FavoritesManager.tsx   # 收藏管理
│   ├── WatchHistoryView.tsx   # 观看历史视图
│   ├── SearchBar.tsx          # 搜索框
│   ├── SearchResults.tsx      # 搜索结果
│   ├── SubtitleControls.tsx   # 字幕控制
│   ├── SubtitleRenderer.tsx   # 字幕渲染
│   ├── UpdateNotification.tsx # 更新通知
│   ├── HeartAnimation.tsx     # 双击爱心动画
│   ├── LibrarySelect.tsx      # 媒体库选择菜单
│   └── DeleteConfirmDialog.tsx# 删除确认
├── services/                  # 媒体服务客户端层（Data Access Layer）
│   ├── MediaClient.ts         # 抽象基类（协议规范）
│   ├── EmbyClient.ts          # Emby 服务器 API 实现
│   ├── PlexClient.ts          # Plex 服务器 API 实现
│   ├── clientFactory.ts       # 根据配置创建对应客户端
│   └── embyService.ts         # 辅助服务
├── src/
│   ├── hooks/                 # 自定义 React Hooks（业务逻辑层）
│   │   ├── index.ts           # 统一导出
│   │   ├── useConfig.ts       # 服务器配置管理
│   │   ├── useLibraries.ts    # 媒体库管理
│   │   ├── useVideoList.ts    # 视频列表加载 & 导航
│   │   ├── useFavorites.ts    # 本地收藏管理
│   │   ├── useWatchHistory.ts # 观看历史管理
│   │   ├── useSearch.ts       # 搜索 + 搜索历史
│   │   ├── useSubtitles.ts    # 字幕解析 (VTT)
│   │   ├── useUpdateChecker.ts# GitHub Release 更新检查
│   │   ├── useDeviceDetection.ts  # 设备检测
│   │   ├── useUIState.ts      # UI 状态（静音/全屏/自动连播）
│   │   ├── useLocalStorageState.ts # 通用 localStorage hook
│   │   ├── useSmartVideoPreload.ts # 智能预加载
│   │   ├── useImagePreload.ts # 图片预加载
│   │   ├── useLazyImage.ts    # 图片懒加载
│   │   ├── useGestureControls.ts  # 手势控制
│   │   ├── useVideoControls.ts    # 视频控制
│   │   └── useTranslation.ts      # 多语言翻译
│   └── locales/               # 多语言文件
│       ├── zh.ts
│       └── en.ts
├── utils/                     # 纯函数工具
│   ├── device.ts              # 设备检测、设备 ID
│   ├── media.ts               # 媒体项类型判断、播放进度
│   └── time.ts                # 时间格式化
├── capacitor.config.ts        # Capacitor（Android）配置
├── vite.config.ts             # Vite + PWA 配置
├── tailwind.config.js         # Tailwind 自定义动画（heart-float）
├── tsconfig.json              # TypeScript 配置
├── manifest.json              # PWA 清单
├── sw.js                      # Service Worker
└── android/                   # Android 原生工程
```

---

## 2. 架构设计

### 2.1 整体架构图（分层模型）

```
┌──────────────────────────────────────────────────────┐
│                    Presentation Layer                 │
│                                                      │
│   [App.tsx] ──▶ [StandardRoot / TVRoot]              │
│                      │                                │
│     ┌──────────┬─────┴──────┬──────────┬────────┐   │
│     Login   VideoFeed   VideoGrid   VideoCard  …    │  React UI 组件
│     (components/)                                     │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│                    Business Logic Layer              │
│                                                      │
│       useConfig / useVideoList / useFavorites         │  自定义 Hooks
│       useSearch / useSubtitles / useWatchHistory      │  (src/hooks/)
│       useUIState / useUpdateChecker                  │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│                    Data Access Layer                 │
│                                                      │
│    [clientFactory.ts]  ──▶ [MediaClient 抽象]         │  services/
│           │                 ▲                        │
│     ┌─────┴─────┐           │                        │
│     ▼           ▼           │                        │
│  EmbyClient   PlexClient ───┘                        │
│   (Emby API)   (Plex API)                            │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│                   External Services                  │
│                                                      │
│     Emby Server API    /    Plex Server API          │
│     GitHub Releases API /    Ntfy.sh (TV 扫码登录)    │
└──────────────────────────────────────────────────────┘
```

### 2.2 核心数据流

1. **用户启动应用** → `App.tsx` 检测设备模式（standard / tv）并懒加载对应 Root 组件
2. **未登录** → 显示 `Login.tsx`，用户填写服务器信息 → `ClientFactory.authenticate()`
3. **已登录** → 从 localStorage 读取 `ServerConfig`，创建 `MediaClient` 实例
4. **加载媒体库** → `client.getLibraries()` → 展示在 `LibrarySelect.tsx` 中
5. **加载视频列表** → `client.getVideos()` → 通过 `VideoFeed`（竖屏流）或 `VideoGrid`（海报墙）渲染
6. **播放视频** → `VideoCard` 管理播放状态、手势、字幕；视频 URL 由 `client.getVideoUrl(item, mode)` 提供

### 2.3 状态管理策略

- **无 Redux/ Zustand**：项目采用轻量 Hook 组合方式管理状态
- **服务端数据**：通过 `MediaClient` 实例 + `useEffect/useCallback` 拉取，局部 `useState` 管理
- **持久化状态**：`useLocalStorageState` 抽象统一管理（用户配置、收藏、历史、搜索历史等）
- **组件间状态**：`StandardRoot`/`TVRoot` 作为顶层容器，通过 props 将状态/回调下传给各子组件

---

## 3. 关键类型定义

`types.ts` 是整个项目的类型中枢，定义了所有跨模块共享的数据结构：

| 类型 / 接口 | 用途 |
|---|---|
| `ServerType` | `'emby' \| 'plex'`，区分媒体服务器类型 |
| `ServerConfig` | 登录后保存的配置（url/username/token/userId/serverType） |
| `EmbyLibrary` | 媒体库（Id/Name/CollectionType） |
| `EmbyItem` | 媒体项（视频、剧集、季、文件夹），含 ImageTags、UserData |
| `MediaSource` / `MediaStream` | 媒体源与流信息，供转码/直接播放判断使用 |
| `FeedType` | `'latest' \| 'random' \| 'favorites' \| 'history'`，排序模式 |
| `OrientationMode` | `'vertical' \| 'horizontal' \| 'both'`，按方向过滤视频 |
| `WatchHistoryItem` / `WatchHistory` | 观看历史条目与容器 |
| `FavoriteCollection` / `FavoritesState` | 本地收藏合集与总状态 |
| `SubtitleTrack` / `SubtitleCue` / `SubtitleSettings` | 字幕轨道、时间片、用户设置 |
| `GitHubRelease` / `UpdateCheckResult` | 版本检查所用的 GitHub Release 结构 |

`EmbyItem.UserData` 十分关键：
- `PlaybackPositionTicks`：上次播放位置（100ns 单位）
- `Played`：是否已播放完
- `IsFavorite`：是否在服务器端标记为收藏

---

## 4. 服务层详解（services/）

### 4.1 MediaClient（抽象基类）

[MediaClient.ts](file:///workspace/services/MediaClient.ts) 定义了所有媒体客户端必须实现的合约：

```typescript
abstract class MediaClient {
  config: ServerConfig;
  abstract authenticate(username, password): Promise<ServerConfig>;
  abstract getLibraries(): Promise<EmbyLibrary[]>;
  abstract getResumeItems(): Promise<EmbyItem[]>;  // TV 首页"继续观看"
  abstract getVideos(parentId, library, feedType, skip, limit, orientationMode, includeIds?): Promise<VideoResponse>;
  abstract getVideoUrl(item, mode?): string;         // mode: 'direct' | 'transcode' | 'fallback'
  abstract getImageUrl(itemId, tag?, type?): string;
  abstract getFavorites(libraryName): Promise<Set<string>>;  // 服务端收藏
  abstract toggleFavorite(id, isFavorite, libraryName): Promise<void>;
  abstract deleteItem(id): Promise<void>;
  abstract searchItems(query): Promise<EmbyItem[]>;
  abstract getSubtitleTracks(itemId): Promise<SubtitleTrack[]>;
}
```

**设计要点**：所有客户端实现同一接口，上层（Hooks & 组件）不感知具体服务器类型。

### 4.2 EmbyClient（Emby 服务器实现）

[EmbyClient.ts](file:///workspace/services/EmbyClient.ts) 使用 Emby REST API：

- **认证**：`POST /Users/AuthenticateByName`，返回 `AccessToken` 和 `User.Id`
- **请求头**：`X-Emby-Token`、`X-MediaBrowser-Token`、自定义 `X-Emby-Authorization`（含 DeviceId 与 Version）
- **获取库**：`GET /Users/{userId}/Views`
- **获取视频**：`GET /Users/{userId}/Items`，参数包含：
  - `Recursive`、`SortBy`（random 随机；DateCreated 最新）
  - `ParentId`（库或文件夹 ID）
  - `IncludeItemTypes`（Movie/Video/Episode/Series/Season/Folder/BoxSet…）
- **方向过滤**：在客户端按 `item.Width`/`item.Height` 过滤非横/竖屏视频（`applyOrientationFilter`）
- **剧集命名**：`formatItemName` 对 Episode 类型拼装 `Sxx.Eyy. 标题`
- **视频 URL 策略**：
  - `direct` 模式：找 `MediaSource.SupportsDirectPlay`，拼接 `/Videos/{id}/stream?Static=true&MediaSourceId=...`
  - `transcode` 模式：请求 `/Videos/{id}/master.m3u8`，限制码率/分辨率
  - `fallback` 模式：更保守的转码参数
- **图片 URL**：`/Items/{id}/Images/Primary?maxWidth=800&tag=...&quality=90`
- **服务端收藏**：通过在服务器上创建 `Tok-{libraryName}` 的 Playlist 来实现跨设备同步收藏
- **字幕**：从 `MediaSources.MediaStreams` 中过滤 `Type === 'Subtitle'` 的轨道，外部字幕通过 `/Videos/{id}/{index}/Stream` 拉取

### 4.3 PlexClient（Plex 服务器实现）

[PlexClient.ts](file:///workspace/services/PlexClient.ts) 使用 Plex HTTP API：

- **认证**：简化为 `X-Plex-Token` 方式（直接在登录页填 token 即可），会验证 `/identity` 端点
- **库列表**：`GET /library/sections`
- **视频列表**：`GET /library/sections/{id}/all?sort=addedAt:desc`（或 `random`）
- **播放 URL**：
  - 直接播放：`item._PlexKey`（媒体 part 路径）+ token
  - 转码：`/video/:/transcode/universal/start?path=...`
- **图片 URL**：`/photo/:/transcode?url=...&width=800&height=1200`
- **收藏**：同样用 Playlist（Plex 原生 Playlist），跨设备同步
- **字幕**：从 `Media.Part.Stream` 中挑 `streamType === 3` 的轨道

### 4.4 ClientFactory（工厂）

[clientFactory.ts](file:///workspace/services/clientFactory.ts) 只有两类方法：

- `create(config)`：根据 `config.serverType` 实例化 `EmbyClient` 或 `PlexClient`
- `authenticate(type, url, username, password)`：临时构造客户端并执行认证流程，返回完整 `ServerConfig`

---

## 5. Hooks 层详解（src/hooks/）

> Hooks 是项目的"业务逻辑容器"。所有数据拉取、状态组织、用户行为响应均在这里。

### 5.1 useLocalStorageState（基础抽象）

```typescript
function useLocalStorageState<T>(key, initialValue): [T, Dispatch<SetStateAction<T>>]
```

- 初始化时从 `localStorage` 读 JSON；失败则用 `initialValue`
- 状态每次变化自动 `JSON.stringify` 后写回
- 是所有持久化 hook（useConfig / useLibraries / useFavorites / useWatchHistory / useSearch / useSubtitles / useUIState）的基础

### 5.2 useConfig

```typescript
{ config, setConfig, client, logout }
```

- 读取 `embyConfig`，在变化时创建 `MediaClient` 实例
- `logout()` 清空配置并刷新页面

### 5.3 useLibraries

```typescript
{ libraries, selectedLib, setSelectedLib, hiddenLibIds, hiddenLibIdsSet, toggleHiddenLib, fetchLibraries }
```

- 自动调用 `client.getLibraries()` 填充媒体库列表
- `hiddenLibIds` 持久化在 localStorage，让用户能隐藏不常用的库
- `toggleHiddenLib` 切换单个库的隐藏状态

### 5.4 useVideoList

```typescript
{ videos, loading, hasMore, navStack, favoriteIds, viewMode, setViewMode, currentIndex, setCurrentIndex, loadVideos, toggleFavorite, deleteVideo, navigateTo, navigateBack, selectVideo }
```

- **导航栈** `navStack: NavItem[]` — 用于进入剧集、季等文件夹结构后可逐级返回
- **视图模式** `viewMode` — `feed`（竖屏流式）或 `grid`（海报墙）。进入文件夹时自动切为 grid
- **收藏 Set** `favoriteIds`（服务端收藏 ID 集合），与 `client.toggleFavorite` 双向同步
- `loadVideos(true)` 触发完全重置（清空 + 拉取 + 根据首项类型决定 viewMode）

### 5.5 useFavorites

```typescript
{ collections, createCollection, deleteCollection, renameCollection, addToFavorites, removeFromFavorites, isFavorite, getCollections, getCollection, getItemCollections }
```

- **本地**收藏合集系统，与服务端 Playlist 收藏独立并存
- 数据结构：`collections: FavoriteCollection[]`，每个合集有 `id / name / createdAt / itemIds[]`
- 默认合集 ID 为 `'default'`，对应"收藏"

### 5.6 useWatchHistory

```typescript
{ history, addToHistory, removeFromHistory, clearHistory, getHistoryItem, getProgress }
```

- 每 5 秒由 `VideoCard` 中的 `saveProgressIntervalRef` 触发 `addToHistory`
- 记录 `itemId / positionTicks / totalTicks / watchedAt`
- 最大条目数 `MAX_HISTORY_ITEMS = 100`，超出自动淘汰最旧条目
- `getHistoryItem` 可在 UI 上显示"继续从 xx:xx 播放"

### 5.7 useSearch

```typescript
{ query, results, loading, loadingMore, hasMore, searchHistory, setQuery, debouncedSearch, performSearch, addToHistory, removeFromHistory, clearHistory, loadMore }
```

- 调用 `client.searchItems(query)` 返回 `EmbyItem[]`
- `debouncedSearch` 做 300ms 防抖，避免打字过程频繁请求
- 搜索历史持久化在 `embytok_search_history`

### 5.8 useSubtitles

```typescript
{ settings, cues, currentCue, updateSettings, toggleSubtitles, selectTrack, loadSubtitles, updateTime, parseVTT }
```

- `settings`：启用状态、选中轨道 ID、字号、颜色、背景、位置
- `parseVTT(content)`：手写的轻量 VTT 解析器，把 VTT 文本切成 `{startTime, endTime, text}[]`
- `currentCue` 根据 `updateTime(seconds)` 自动在 cues 中查找当前时间片
- 组件层由 `SubtitleRenderer.tsx` 渲染字幕浮层，`SubtitleControls.tsx` 负责设置

### 5.9 useUpdateChecker

```typescript
{ currentVersion, isChecking, lastCheckTime, checkError, checkForUpdates }
```

- 检查 `https://api.github.com/repos/1525745393/embytok/releases/latest`
- 版本号比较由 `parseVersion` 转为数字数组后逐段比较
- `UpdateNotification.tsx` 在检测到新版本时弹出对话框，展示 Release 信息和下载链接

### 5.10 useUIState

```typescript
{ isMenuOpen, setIsMenuOpen, isMuted, setIsMuted, isFullscreen, isAutoPlay, setIsAutoPlay, orientationMode, setOrientationMode, toggleFullscreen, toggleMute, toggleAutoPlay }
```

- 纯 UI 状态管理，无网络请求
- `orientationMode`（`vertical` / `horizontal` / `both`）持久化，配合 `applyOrientationFilter` 使用
- 监听 `fullscreenchange` 事件同步 `isFullscreen` 状态

### 5.11 useDeviceDetection

```typescript
{ isIOSSafari, isMobile, isLandscape }
```

- 调用 `utils/device.ts` 与 `utils/media.ts` 的纯函数
- `App.tsx` 用来给 iOS Safari 加特殊 CSS class，解决安全区与自动播放限制

---

## 6. 组件层详解（components/）

### 6.1 App.tsx（根组件）

- **设备模式**：读取 localStorage 的 `embyForceDeviceMode`；否则依据 UA 中的 `'tv' / 'googletv' / 'smarttv'` 决定 `TVRoot` 还是 `StandardRoot`
- **代码分割**：`React.lazy(() => import(...))` + `Suspense` 做 Root 级懒加载
- **模式切换按钮**：Standard/TV 互相切换后写入 localStorage 并 `location.reload()`

### 6.2 StandardRoot.tsx（标准/移动/Web 端 Root）

承载整个标准端的 UI 骨架和状态：

```
顶栏（Top Bar）
  ├── 菜单按钮 → 打开 LibrarySelect（媒体库选择 / 设置 / 登出）
  ├── 排序按钮（最新 / 随机 / 收藏）→ feedType
  └── 右侧：搜索 / 历史 / 收藏 / 全屏 / 静音 / 视图切换（feed ⇄ grid）

主体（Main）
  ├── VideoFeed（竖屏流，全屏滑动）
  └── VideoGrid（海报墙，点击可进入文件夹导航或播放）

浮层
  ├── WatchHistoryView（观看历史列表）
  ├── FavoritesManager（本地收藏合集管理）
  ├── SearchBar + SearchResults
  ├── UpdateNotification
  └── LibrarySelect
```

- `StandardRoot` 使用 `useState` + `useCallback` 手动组织状态，直接调用 services 层（`ClientFactory.create`）而非依赖 `useConfig` Hook（两种风格并存：TVRoot 同样手写）
- 它把 `subtitleTracksMap`（itemId → SubtitleTrack[]）存为 ref 以避免在滚动时重渲染

### 6.3 VideoFeed.tsx（竖屏流容器）

- 渲染逻辑：`videos.map → <div className="video-card-container h-[100dvh]"><VideoCard /></div>`
- 容器滚动：`overflow-y-scroll snap-y snap-mandatory`（CSS Scroll Snap 逐屏定位）
- **Intersection Observer**：`threshold: 0.85`，进入 85% 即设为 `activeIndex`，触发该卡片播放，其他暂停
- `visibleIndices`：依据 scroll 速度决定相邻视频是否做预渲染（慢速 scroll 范围更大）
- 播放列表类型：`feedType === 'random'` 时，底部显示"换一批"按钮重新请求

### 6.4 VideoCard.tsx（核心播放组件）

> 业务最复杂的组件，整合了播放控制、手势、字幕、双击点赞、进度保存。

**内部状态要点**：

| 状态 | 类型 | 说明 |
|---|---|---|
| `isPlaying` | boolean | 当前是否在播放，由 IntersectionObserver 自动切换 |
| `hasStarted` | boolean | 是否已播放至少一次，控制海报图淡出 |
| `videoPreload` | `'metadata' \| 'auto' \| 'none'` | active 的视频置为 `auto` |
| `playMode` | `'direct' \| 'transcode' \| 'fallback'` | 失败时自动降级（direct→transcode→fallback） |
| `currentTime / duration` | number | 从 `onTimeUpdate / onLoadedMetadata` 同步 |
| `playbackRate` | number | 默认 1.0；长按或菜单可切换到 0.5x ~ 5x |
| `isSeeking / seekOffset` | boolean / number | 滑动 seek 时临时暂停视频 |
| `isSpeedAdjusting / isTemporarySpeed` | boolean | 区分"临时加速"和"固定倍速" |
| `hearts` | 数组 | 双击爱心动画的短暂记录 |

**播放模式自动降级**：
- 当原生 `<video>` 触发 `error` 且 `playMode !== 'direct'` → 自动切到 `transcode`
- `transcode` 也失败 → 切到 `fallback`（更低的码率/分辨率）
- 再失败 → 显示错误 UI + 手动"尝试转码播放"按钮

**手势识别**：
- **单击** → 显示/隐藏控制面板（底部进度条）
- **双击** → 在点击位置弹出爱心动画；若是"服务端未收藏"状态，同时 `onToggleFavorite`
- **水平滑动** → 拖动时显示 `±xxs` 预览，释放时设置 `video.currentTime`
- **长按** → 临时 2.0 倍速播放，释放恢复；长按时若上下滑动则转为"固定倍速"
- **垂直滑动** → 音量或亮度（TV 端特化逻辑）

**字幕渲染**：
- 调用 `client.getSubtitleTracks(itemId)` 拉轨道列表
- `useSubtitles.loadSubtitles(track)` 解析 VTT 并填充 `cues`
- `SubtitleRenderer` 根据 `settings.position/bgColor/fontSize/textColor` 渲染当前时间片文本

**播放进度持久化**：
- `saveProgressIntervalRef`（5 秒定时器，仅 active + playing 时启用）
- 保存 `embbytok_progress_{itemId}` → `{ time, duration, timestamp }`
- 下次进入同视频 → 在 `onLoadedMetadata` 中恢复 `video.currentTime`

### 6.5 TVRoot.tsx（电视端 Root）

电视端与标准端的核心差异：

| 方面 | Standard | TV |
|---|---|---|
| 导航方式 | 点击 / 触摸滚动 | 方向键（ArrowUp/Down/Left/Right）、Enter、Back |
| 焦点管理 | 无 | 全局 `keydown` 处理 + `findNearest` 根据矩形距离寻找下一个焦点元素 |
| 首页布局 | 竖屏视频流或海报墙 | 左侧 Sidebar + 右侧 `TVDashboard`（"继续观看" + 各媒体库最新内容） |
| 设置入口 | 集成在 `LibrarySelect` 菜单中 | 独立 `TVSettings` 页面，支持方向键操作 |
| 登录 | 手动填账号 | 可选"扫码登录"（TV 显示二维码，手机扫描后推送配置到 ntfy.sh） |

**扫码登录机制**：
- TV 端生成 `deviceId`，订阅 `ntfy.sh/embytok_sync_{deviceId}` 的 SSE JSON 流
- 手机扫描 QR（URL 指向 `https://embytok.vercel.app/setup?id={deviceId}`），填写 url/username/token
- Web setup 页把配置以 JSON 消息 POST 到同一 topic
- TV 收到后自动填入并提交登录表单

**返回键逻辑**：
- Capacitor 的 `backButton` 事件 + 浏览器 `Escape/Backspace`
- 返回层级：`播放中 → 设置/历史/收藏 → 媒体库列表 → Discover Dashboard → 退出`
- 由 `executeBackLogic` + `uiStateRef`（保存当前层级快照）统一处理

### 6.6 TVDashboard / TVVideoGrid / TVVideoPlayer

- `TVDashboard`：显示"继续观看"（由 `client.getResumeItems`）和各库的最新 12 项
- `TVVideoGrid`：更大的海报网格，支持 6/8 列，focus ring 用 `focus:ring-8 focus:ring-white`，焦点缩放动画很关键
- `TVVideoPlayer`：全屏播放 + 方向键控制（← → 切换 ±10s、↑ ↓ 切换集数、Enter 播放/暂停）

### 6.7 其他 UI 组件

| 组件 | 职责 |
|---|---|
| `Login.tsx` | 登录表单、Emby/Plex 切换、语言切换、TV 扫码登录、自动补 http 前缀 |
| `LibrarySelect.tsx` | 媒体库列表、隐藏库切换、登出、更新检查、设备模式切换 |
| `VideoGrid.tsx` | 标准端海报墙，支持 folder 导航、播放进度条 |
| `VideoPlayer.tsx` | 简洁 `<video>` 包装 + 错误降级 + 倍速/进度 UI |
| `SubtitleControls.tsx` | 字幕轨道切换、字体/颜色/位置设置 |
| `SubtitleRenderer.tsx` | 根据 cues + currentTime + settings 渲染覆盖层 |
| `FavoritesManager.tsx` | 创建/重命名/删除合集，在合集间管理视频条目 |
| `WatchHistoryView.tsx` | 观看历史条目的卡片列表，可点击继续播放 |
| `SearchBar.tsx` / `SearchResults.tsx` | 搜索输入（带历史）+ 结果网格 |
| `UpdateNotification.tsx` | 版本更新提示对话框 |
| `HeartAnimation.tsx` | 双击爱心动画（`heart-float` 关键帧） |
| `DeleteConfirmDialog.tsx` | 删除确认（"删除视频将影响原文件"警告） |
| `VideoSkeleton.tsx` | 加载占位（骨架屏） |
| `VideoInfo.tsx` | 视频元信息卡片（标题、年份、简介、时长） |

---

## 7. 工具函数与通用能力（utils/）

### 7.1 device.ts

- `isMobile()`：UA 含 `android / iphone / ipad` 即判定为移动设备
- `isLandscape()`：`window.innerWidth > window.innerHeight`
- `getDeviceId()`：首次调用生成 `embytok-web-xxxxxx` 并存储到 `localStorage`，之后复用
  - 用于 `EmbyClient.getHeaders()` 中的 `DeviceId`，保持 Emby 会话一致

### 7.2 media.ts

- `FOLDER_TYPES = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet', 'show', 'season']`
- `isFolderType(item)`：用于判断点击后是"进入子目录"还是"开始播放"
- `calculatePlaybackProgress(positionTicks, runTimeTicks)`：0-100 的百分比，用于海报底部进度条
- `isTVDevice()`：UA 含 `tv` → 用于 TV 端焦点/布局分支
- `isIOSSafari()`：正则判断 iPad/iPhone/iPod 上的 Safari（排除 Chrome/Firefox 的 iOS 变体）

### 7.3 time.ts

- `formatTimeText(ticks?)`：`"120 分钟"`（中文友好）
- `formatTime(ticks?)`：`"120m"`（紧凑）
- 注意：Emby/Plex 使用 100 纳秒（1e-7s）作为 tick 单位；转换为秒 = `ticks / 10_000_000`

---

## 8. 样式、动画与 PWA 能力

### 8.1 Tailwind 配置（tailwind.config.js）

- `content` 路径覆盖 `index.html`、`App.tsx`、`components/**`、`services/**`、`types.ts`
- 自定义动画 `heart-float`（关键帧：缩放下滑 + 渐隐）

### 8.2 Vite + PWA（vite.config.ts）

- **代码分割**：`react-vendor`、`ui-vendor`（lucide-react）、`motion-vendor`（framer-motion）
- **压缩**：`terser` + `drop_console` + `drop_debugger`
- **PWA manifest**：`orientation: portrait`、`display: standalone`、`theme_color: #000000`
- **运行时缓存**：`CacheFirst` 策略缓存 png/jpg/svg/gif/webp，最大 100 条、7 天过期
- **开发模式**：`server.host: '0.0.0.0'`，允许局域网/移动设备访问

### 8.3 关键 CSS 类

| 类名 | 用途 |
|---|---|
| `h-[100dvh]` | 动态视口高度，避免 iOS 地址栏导致的高度错位 |
| `snap-y snap-mandatory` + `snap-center snap-always` | 视频流逐屏 snap |
| `no-scrollbar` | 隐藏原生滚动条（项目自定义） |
| `ios-safari` | 由 App.tsx 挂到 `<html>` 上，用于 iOS 特殊布局修正 |
| `mode-tv` / `mode-standard` | 由 App.tsx 挂到 `<body>` 上，用于电视端特有样式 |

---

## 9. 项目运行与开发脚本

### 9.1 常用脚本（package.json）

```bash
npm run dev            # 启动 Vite 开发服务器（http://localhost:5173）
npm run build          # 类型检查 + Vite 构建 → dist/
npm run preview        # 本地预览生产构建
npm test               # Vitest 单元测试（交互模式）
npm test:coverage      # Vitest + 覆盖率报告
npm run test:bench     # 基准测试（utils/media.benchmark.ts 等）
npm run test:e2e       # Playwright 端到端测试（需浏览器依赖）
npm run cap:add        # 添加 Android Capacitor 平台（首次）
npm run cap:sync       # 同步 dist/ → android/
npm run build:android  # 先 build 再 sync android（一键 APK 流程）
npm run version:patch  # 升级 package.json patch 版本
npm run version:minor  # 升级 package.json minor 版本
npm version:major      # 升级 package.json major 版本
npm changelog:generate # 从 git 历史提取更新日志
npm release:check      # 发布前自检（版本号、格式、测试）
```

### 9.2 本地开发最小流程

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开 http://localhost:5173
#    → 填 Emby/Plex 服务器地址、账号信息
#    → 进入主界面浏览

# 4. 运行测试
npm test

# 5. 构建生产包
npm run build && npm run preview
```

### 9.3 Android 构建

```bash
npm run build:android       # = tsc && vite build && cap sync android
# 之后在 Android Studio 中打开 android/ 目录构建 APK
```

`capacitor.config.ts` 关键配置：
- `server.androidScheme: 'http'`（内网 http 优先，避免证书问题）
- `server.allowNavigation: ['*']`（允许跳转到任意域名，含自建服务器）
- `plugins.CapacitorHttp.enabled: false`（禁用原生 HTTP，改用 fetch 以便视频流兼容）

---

## 10. 多语言（src/locales/）

- `zh.ts` / `en.ts` 导出同样键名的翻译对象
- `type Translations = typeof zh` 保证两套语言键名完全同构
- `type Language = 'zh' | 'en'`
- `Login.tsx` / `StandardRoot.tsx` / `TVRoot.tsx` / `VideoCard.tsx` 目前各自内置小型双语 `t = { zh:{...}, en:{...} }[language]`，简单够用
- `useTranslation.ts`（已存在于 hooks/）提供更规模化的翻译使用方式，供未来统一

---

## 11. 关键数据流程示例

### 11.1 用户点击播放一个视频（标准端 feed 模式）

```
VideoCard.onClick
  └─▶ VideoCard 切换为 active
       ├─▶ video.preload = 'auto'
       ├─▶ video.src = client.getVideoUrl(item, 'direct')
       ├─▶ video.play()
       │     ├─▶ onPlaying → setIsPlaying(true) + 开始记录进度（每 5s 写 localStorage）
       │     └─▶ onTimeUpdate → 更新 currentTime（驱动字幕渲染）
       ├─▶ 如 MediaSources 里有字幕：client.getSubtitleTracks(itemId)
       │     └─▶ useSubtitles.loadSubtitles(selectedTrack)
       ├─▶ 如播放失败 → onError → playMode 切到 'transcode' 并重载
       └─▶ 用户退出视频 → IntersectionObserver 触发 unmount → 暂停 + 重置 + 保存最后进度
```

### 11.2 从媒体库切换到"随机"模式

```
StandardRoot state.feedType = 'random'
  └─▶ useEffect([feedType])
       └─▶ client.getVideos(undefined, selectedLib, 'random', 0, PAGE_SIZE, orientationMode, ...)
            └─▶ EmbyClient.getVideos → params.append('SortBy', 'Random')
                 └─▶ setVideos(items)
                      └─▶ VideoFeed 重新渲染 items → IntersectionObserver 激活第 0 项播放
```

### 11.3 服务端收藏（Emby 版）

```
用户点击爱心
  └─▶ client.toggleFavorite(item.Id, wasFavorite, libraryName)
        └─▶ GET /Playlists?name=Tok-{libraryName}   ← 查找或创建对应 Playlist
             ├─▶ 若为"加入收藏"：POST /Playlists/{pid}/Items?Ids={itemId}
             └─▶ 若为"取消收藏"：GET Items → 查找对应 entry → DELETE /Playlists/{pid}/Items?EntryIds={eid}
  同步刷新 favoriteIds Set → UI 爱心状态更新
```

---

## 12. 测试结构

项目测试分层：

| 目录/文件 | 覆盖范围 |
|---|---|
| `components/__tests__/*.test.tsx` | 所有 UI 组件的渲染/交互测试 |
| `components/standard/__tests__/` | StandardRoot 特定路径 |
| `components/tv/__tests__/` | TVRoot / TVDashboard / TVSettings / TVVideoGrid / TVVideoPlayer |
| `services/__tests__/EmbyClient.test.ts` | EmbyClient API 调用 mock 测试 |
| `services/__tests__/PlexClient.test.ts` | PlexClient API 调用 mock 测试 |
| `src/hooks/__tests__/*.test.ts` | 所有自定义 Hook 的行为测试 |
| `utils/__tests__/*.test.ts` | 纯函数工具单元测试 |
| `utils/__tests__/media.benchmark.ts` | 工具函数的性能基准 |
| `e2e/*.spec.ts` | Playwright 端到端测试（登录、移动端布局、性能等） |

运行：

```bash
npm test                     # Vitest 监听模式
npm run test:run             # Vitest 单次运行
npm run test:coverage        # 带覆盖率
npm run test:bench           # 基准测试
npm run test:e2e             # Playwright（首次需 `npx playwright install`）
```

---

## 13. 开发者最佳实践与约定

- **组件命名**：`PascalCase.tsx` 文件名与默认导出同名；测试文件 `.test.tsx`
- **Hooks 命名**：`useCamelCase.ts`，一个 hook 一个文件；在 `src/hooks/index.ts` 中统一导出
- **类型**：共享类型一律放入 `types.ts`；组件本地 Props/State 类型写在文件顶部
- **服务调用**：始终通过 `MediaClient` 抽象，不在组件里直接 `fetch` API
- **错误处理**：`try/catch` + 降级逻辑（播放模式自动 fallback、显示错误 UI）
- **性能**：
  - 图片一律 `loading="lazy"` + `decoding="async"`
  - 大量列表使用 `useMemo/useCallback` + IntersectionObserver 做虚拟渲染（`visibleIndices`）
  - 视频 preload 策略在非 active 时降为 `metadata`，避免带宽浪费
  - `React.memo` + 自定义 `arePropsEqual` 用于 `VideoCard` 等高频渲染组件
- **可访问性**：所有交互元素 `tabIndex=0`，TV 端依赖方向键导航，`focus:ring` 视觉反馈必须显著
- **持久化 Key 前缀**：`embytok_` 或 `embbytok_progress_`，避免与其他应用在 `localhost` 下冲突
- **提交信息**：遵循项目 `docs/GIT_COMMIT_GUIDE.md` 规范
- **发布前检查**：`npm run release:check` 做版本号、测试、lint 预检

---

## 14. 关键扩展点（下一步可做）

1. **字幕格式扩展**：`useSubtitles.parseVTT` 支持 SRT → 可添加 `parseSRT` 与编码检测
2. **转码参数用户可配置**：当前 EmbyClient 的 bitrate / width 为硬编码
3. **统一 Hook 化 StandardRoot**：目前 StandardRoot/TVRoot 仍用"手搓"状态管理，后续可抽取成 `useStandardAppState` 等组合 Hook，提高可测试性
4. **TV 端语音搜索**：Android TV `SpeechRecognizer` + Capacitor plugin
5. **离线观看**：利用 PWA 缓存策略保存常看视频的转码流（`sw.js` 已提供 Workbox 基础）

---

*本 Wiki 基于项目当前代码自动整理，建议在架构显著变更后同步更新。*

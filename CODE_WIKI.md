# EmbyTok 项目代码维基文档

## 1. 项目概述

### 1.1 项目简介
**EmbyTok** 是一个为 Emby 和 Plex 媒体服务器设计的垂直视频浏览客户端，提供类似 TikTok 的用户体验。它允许用户以更现代化和便捷的方式浏览个人媒体库，支持多种视图模式、设备模式和丰富的交互功能。

### 1.2 核心特性
- 📱 **TikTok 风格浏览**：全屏垂直视频浏览，上下滑动切换视频
- 🎵 **音频控制**：一键静音/取消静音，直观的音量图标反馈
- ❤️ **收藏功能**：喜欢并保存喜爱视频，支持收藏夹浏览
- 🔍 **搜索功能**：支持搜索视频、剧集等内容
- ⏰ **观看历史**：记录观看进度，支持续播
- 📄 **字幕支持**：支持多字幕轨道选择和设置
- 📁 **媒体库管理**：支持浏览、选择和隐藏多个媒体库
- 🌐 **响应式设计**：适配移动设备和桌面设备，自动调整布局
- ⏩ **手势控制**：支持单击播放/暂停、双击点赞、左右滑动调整进度等
- 📦 **Android 应用**：通过 Capacitor 构建为原生 Android 应用
- 📱 **视图切换**：支持一键切换视频流视图和网格视图
- 📐 **方向过滤**：可选择只显示垂直、水平或两者都显示
- 🖥️ **全屏模式**：支持进入/退出全屏播放
- 🎯 **自动布局**：根据屏幕方向和视频内容方向自动调整最佳显示
- ♾️ **无限播放模式**：无限播放 + 纯净模式，自动连续播放视频
- ⚡ **多倍速播放**：支持 0.5x 到 5.0x 的播放速度调节
- 📺 **电视模式**：为智能电视和大屏设备优化的界面

### 1.3 版本与技术栈
- **版本**：1.9.5
- **技术栈**：
  - React 18
  - TypeScript
  - Vite (构建工具)
  - Tailwind CSS
  - Capacitor (Android 应用)
  - Lucide React (图标库)
  - Framer Motion (动画库)
  - PWA 支持
- **支持的媒体服务器**：
  - Emby
  - Plex

### 1.4 支持平台
- Web 浏览器（PWA 支持）
- Android 应用（通过 Capacitor）
- 智能电视/大屏设备（电视模式）

---

## 2. 项目架构

### 2.1 整体架构设计
EmbyTok 采用分层架构设计，主要分为：
- **UI 层**：负责渲染用户界面，包括多种设备模式（标准/移动/电视）
- **组件层**：可复用的 UI 组件（视频流、视频网格、视频播放器等）
- **服务层**：负责与媒体服务器通信的抽象和实现
- **类型层**：TypeScript 类型定义
- **Hook 层**：可复用的自定义钩子，封装业务逻辑

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层 (UI)                          │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ StandardRoot │  │  TVRoot    │  │ MobileRoot │              │
│  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘              │
└─────────┼──────────────────┼──────────────┼─────────────────────┘
          │                  │              │
┌─────────▼──────────────────▼──────────────▼─────────────────────┐
│                       组件层 (Components)                        │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────┐     │
│  │VideoFeed │ │ VideoGrid │ │ VideoPlayer  │ │  Login   │     │
│  └──────────┘ └───────────┘ └──────────────┘ └──────────┘     │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────┐     │
│  │ Search   │ │ Favorites │ │ WatchHistory │ │  ...     │     │
│  └──────────┘ └───────────┘ └──────────────┘ └──────────┘     │
└──────────────┬───────────────────┬─────────────────────────────┘
               │                   │
┌──────────────▼───────────────────▼─────────────────────────────┐
│                        服务层 (Services)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐          │
│  │ EmbyClient  │ │ PlexClient  │ │  ClientFactory  │          │
│  └──────┬──────┘ └──────┬──────┘ └─────────────────┘          │
│         └───────────────┼───────────────┘                      │
│                 ┌───────▼────────┐                            │
│                 │ MediaClient    │                            │
│                 │ (抽象基类)     │                            │
│                 └────────────────┘                            │
└──────────────────────┬─────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────┐
│                        类型定义 (Types)                         │
│                      (types.ts)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
/workspace
├── components/               # 组件目录
│   ├── mobile/              # 移动端特定组件
│   │   └── MobileRoot.tsx
│   ├── standard/            # 标准模式组件
│   │   └── StandardRoot.tsx
│   ├── tv/                  # 电视模式组件
│   │   ├── TVRoot.tsx
│   │   ├── TVDashboard.tsx
│   │   ├── TVVideoGrid.tsx
│   │   ├── TVVideoPlayer.tsx
│   │   └── TVSettings.tsx
│   ├── Login.tsx            # 登录组件
│   ├── LibrarySelect.tsx    # 媒体库选择组件
│   ├── VideoFeed.tsx        # 视频流组件
│   ├── VideoGrid.tsx        # 视频网格组件
│   ├── VideoPlayer.tsx      # 视频播放器组件
│   ├── SearchBar.tsx        # 搜索栏组件
│   ├── SearchResults.tsx    # 搜索结果组件
│   ├── WatchHistoryView.tsx # 观看历史组件
│   ├── FavoritesManager.tsx # 收藏管理组件
│   ├── SubtitleControls.tsx # 字幕控制组件
│   ├── SpeedControlPanel.tsx# 速度控制面板
│   └── ...                  # 其他组件
├── services/                # 服务层
│   ├── MediaClient.ts       # 抽象媒体客户端基类
│   ├── EmbyClient.ts        # Emby 客户端实现
│   ├── PlexClient.ts        # Plex 客户端实现
│   ├── clientFactory.ts     # 客户端工厂
│   └── embyService.ts
├── src/
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useSearch.ts
│   │   ├── useFavorites.ts
│   │   ├── useWatchHistory.ts
│   │   ├── useSubtitles.ts
│   │   ├── useUpdateChecker.ts
│   │   ├── usePlaybackSpeed.ts
│   │   ├── useBuffering.ts
│   │   ├── useGestureControls.ts
│   │   └── ...
│   └── locales/             # 多语言支持
│       ├── en.ts
│       ├── zh.ts
│       └── index.ts
├── utils/                   # 工具函数
│   ├── device.ts
│   ├── media.ts
│   ├── time.ts
│   └── index.ts
├── public/                  # 静态资源
├── scripts/                 # 构建脚本
├── android/                 # Android 项目（Capacitor）
├── types.ts                 # 类型定义
├── App.tsx                  # 应用根组件
├── index.tsx                # React 渲染入口
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
├── capacitor.config.ts      # Capacitor 配置
├── docker-compose.yml       # Docker Compose 配置
├── Dockerfile               # Docker 镜像构建文件
├── package.json
└── README.md
```

### 2.3 设计模式

#### 2.3.1 工厂模式
在 `services/clientFactory.ts` 中实现，用于根据配置创建相应的媒体客户端（Emby 或 Plex）。

#### 2.3.2 策略模式
通过 `MediaClient` 抽象类定义统一接口，由 `EmbyClient` 和 `PlexClient` 分别实现具体策略。

#### 2.3.3 组件组合模式
通过多个可复用组件组合构建复杂界面，支持代码分割和懒加载。

#### 2.3.4 自定义 Hooks
将业务逻辑抽取为可复用的自定义 Hooks，提高代码复用性和可维护性。

---

## 3. 核心模块说明

### 3.1 应用入口 ([App.tsx](file:///workspace/App.tsx))

#### 职责
- 检测设备类型并选择对应的根组件（标准模式或电视模式）
- 管理设备模式切换
- 提供组件懒加载和 Suspense 加载状态

#### 关键功能
- 自动检测设备模式（通过 localStorage 或 user-agent）
- 支持强制模式切换并持久化到 localStorage
- 应用代码分割，优化加载性能

#### 核心代码片段
```typescript
// 设备模式状态管理
const [deviceMode, setDeviceMode] = useState<'standard' | 'tv'>(() => {
  try {
    const forcedMode = localStorage.getItem('embyForceDeviceMode');
    if (forcedMode === 'tv' || forcedMode === 'standard') return forcedMode;
    const userAgent = navigator.userAgent.toLowerCase();
    const isTV = userAgent.includes('tv') || userAgent.includes('googletv') || userAgent.includes('smarttv');
    return isTV ? 'tv' : 'standard';
  } catch (e) {
    return 'standard';
  }
});
```

### 3.2 服务层抽象与工厂模式

#### 3.2.1 媒体客户端抽象类 ([MediaClient.ts](file:///workspace/services/MediaClient.ts))

##### 职责
- 定义所有媒体客户端必须实现的抽象接口
- 提供统一的媒体服务抽象，便于扩展新的媒体服务器支持

##### 主要抽象方法
```typescript
abstract authenticate(username: string, password: string): Promise<ServerConfig>;
abstract getLibraries(): Promise<EmbyLibrary[]>;
abstract getResumeItems(): Promise<EmbyItem[]>;
abstract getVideos(
    navParentId: string | undefined, 
    library: EmbyLibrary | null, 
    feedType: FeedType, 
    skip: number, 
    limit: number,
    orientationMode: OrientationMode,
    includeIds?: string
): Promise<VideoResponse>;
abstract getVideoUrl(item: EmbyItem): string;
abstract getImageUrl(itemId: string, tag?: string, type?: 'Primary' | 'Backdrop'): string;
abstract getFavorites(libraryName: string): Promise<Set<string>>;
abstract toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>;
abstract deleteItem(itemId: string): Promise<void>;
abstract searchItems(query: string): Promise<EmbyItem[]>;
abstract getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]>;
```

#### 3.2.2 客户端工厂 ([clientFactory.ts](file:///workspace/services/clientFactory.ts))

##### 职责
- 根据服务器类型创建对应的客户端实例
- 处理认证流程

##### 核心代码
```typescript
export class ClientFactory {
    static create(config: ServerConfig): MediaClient {
        if (config.serverType === 'plex') {
            return new PlexClient(config);
        }
        return new EmbyClient(config);
    }

    static async authenticate(type: ServerType, url: string, username: string, password: string): Promise<ServerConfig> {
        const dummyConfig: ServerConfig = { url, username: '', token: '', userId: '', serverType: type };
        const client = this.create(dummyConfig);
        return client.authenticate(username, password);
    }
}
```

#### 3.2.3 Emby 客户端 ([EmbyClient.ts](file:///workspace/services/EmbyClient.ts))

##### 职责
- 实现与 Emby 服务器的通信
- 提供完整的 Emby API 集成

##### 核心功能
- **用户认证**：通过 `AuthenticateByName` API 进行认证
- **获取媒体库**：获取用户可访问的媒体库列表
- **获取视频列表**：支持多种排序和过滤方式（最新、随机、收藏）
- **视频流 URL 生成**：直接获取原始文件，避免转码
- **收藏管理**：使用 Emby 播放列表功能实现收藏（格式 `Tok-{libraryName}`）
- **视频删除**：删除媒体库中的项目
- **搜索功能**：搜索视频、剧集等内容
- **字幕支持**：获取视频的字幕轨道列表

##### 关键实现细节
- 使用 `X-Emby-Token` 和 `X-Emby-Authorization` 头进行认证
- 支持方向过滤（垂直/水平/两者）
- 支持递归浏览文件夹、剧集、季、集
- 直接流模式，优先使用原始文件播放

#### 3.2.4 Plex 客户端 ([PlexClient.ts](file:///workspace/services/PlexClient.ts))

##### 职责
- 实现与 Plex 服务器的通信
- 提供完整的 Plex API 集成

##### 核心功能
- 与 EmbyClient 类似的功能集，但适配 Plex 特定接口
- 使用 Plex 的 API 格式和认证方式

### 3.3 标准模式根组件 ([StandardRoot.tsx](file:///workspace/components/standard/StandardRoot.tsx))

#### 职责
- 标准模式的主要界面管理
- 处理视频浏览体验和状态管理

#### 主要功能
- 用户登录状态管理
- 媒体库选择与管理
- 视频浏览与网格视图切换
- 视频浏览模式切换（最新/随机/收藏/历史）
- 视频方向过滤（垂直/水平/两者）
- 播放控制（静音/全屏/自动连播）
- 搜索功能集成
- 观看历史管理
- 收藏管理
- 字幕设置
- 更新检查

#### 主要状态管理
```typescript
// 服务器配置
const [config, setConfig] = useState<ServerConfig | null>(...);

// 媒体库相关
const [libraries, setLibraries] = useState<EmbyLibrary[]>([]);
const [selectedLib, setSelectedLib] = useState<EmbyLibrary | null>(null);

// 视频相关
const [videos, setVideos] = useState<EmbyItem[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);

// UI 控制
const [feedType, setFeedType] = useState<FeedType>('latest');
const [viewMode, setViewMode] = useState<ViewMode>('feed');
const [isMuted, setIsMuted] = useState(true);
const [isAutoPlay, setIsAutoPlay] = useState(false);

// 功能模块显示
const [showSearch, setShowSearch] = useState(false);
const [showWatchHistory, setShowWatchHistory] = useState(false);
const [showFavoritesManager, setShowFavoritesManager] = useState(false);
```

#### 自定义 Hooks 使用
- `useSearch`：搜索功能
- `useWatchHistory`：观看历史管理
- `useFavorites`：收藏管理
- `useSubtitles`：字幕设置
- `useUpdateChecker`：更新检查

### 3.4 电视模式根组件 ([TVRoot.tsx](file:///workspace/components/tv/TVRoot.tsx))

#### 职责
- 电视模式的主要界面管理
- 遥控器导航与大屏优化

#### 主要功能
- 侧边栏导航菜单
- 首页仪表盘
- 视频网格展示
- 视频播放器
- 遥控器按键处理
- 设置页面
- 多语言支持

#### 遥控器导航实现
电视模式实现了完整的键盘导航处理，支持：
- 方向键导航
- 返回/退出键
- 自动寻找最近的可聚焦元素
- 侧边栏和内容区域的焦点管理

### 3.5 视频流组件 ([VideoFeed.tsx](file:///workspace/components/VideoFeed.tsx))

#### 职责
- 提供垂直视频流体验（TikTok 风格）
- 处理滚动与视频切换

#### 核心功能
- 全屏垂直滚动
- 视频卡片渲染与切换
- 自动预加载
- 电视遥控器支持
- 自动连播功能
- 手势控制
- 播放速度调节
- 字幕显示

### 3.6 自定义 Hooks 模块

#### 3.6.1 useSearch ([src/hooks/useSearch.ts](file:///workspace/src/hooks/useSearch.ts))
- 提供搜索功能
- 搜索历史管理
- 防抖搜索

#### 3.6.2 useWatchHistory ([src/hooks/useWatchHistory.ts](file:///workspace/src/hooks/useWatchHistory.ts))
- 观看历史记录
- 播放进度保存
- 历史管理（添加/删除/清空）

#### 3.6.3 useFavorites ([src/hooks/useFavorites.ts](file:///workspace/src/hooks/useFavorites.ts))
- 本地收藏管理（独立于服务器）
- 收藏夹创建、删除、重命名
- 项目添加/删除

#### 3.6.4 useSubtitles ([src/hooks/useSubtitles.ts](file:///workspace/src/hooks/useSubtitles.ts))
- 字幕设置管理
- 字幕轨道选择
- 字幕样式配置

#### 3.6.5 usePlaybackSpeed ([src/hooks/usePlaybackSpeed.ts](file:///workspace/src/hooks/usePlaybackSpeed.ts))
- 播放速度控制（0.5x - 5.0x）
- 速度预设选项

#### 3.6.6 useGestureControls ([src/hooks/useGestureControls.ts](file:///workspace/src/hooks/useGestureControls.ts))
- 单击播放/暂停
- 双击点赞
- 左右滑动调整进度
- 长按倍速

#### 3.6.7 useUpdateChecker ([src/hooks/useUpdateChecker.ts](file:///workspace/src/hooks/useUpdateChecker.ts))
- 检查 GitHub 发布更新
- 显示更新通知

#### 3.6.8 useCache ([src/hooks/useCache.ts](file:///workspace/src/hooks/useCache.ts))
- **功能**：本地缓存管理，使用 IndexedDB
- **主要方法**：
  - `cacheVideoMetadata()` - 缓存视频元数据
  - `getCachedMetadata()` - 获取缓存的元数据
  - `cacheImage()` - 缓存图片
  - `clearCache()` - 清理缓存
- **缓存策略**：LRU 淘汰，最大 100MB

#### 3.6.9 useVideoPreview ([src/hooks/useVideoPreview.ts](file:///workspace/src/hooks/useVideoPreview.ts))
- **功能**：短视频预览控制
- **主要方法**：
  - 预览触发逻辑（500ms 停留）
  - 3 秒无声预览
- **预览窗口**：小窗口叠加在缩略图上

#### 3.6.10 useSmartVideoPreload ([src/hooks/useSmartVideoPreload.ts](file:///workspace/src/hooks/useSmartVideoPreload.ts))
- **功能**：智能视频预加载
- **主要方法**：
  - `preloadNext()` - 预加载下一个视频
  - 网络带宽检测
  - 滑动方向预测
- **网络自适应**：WiFi/4G 预加载，3G 仅预加载海报

#### 3.6.11 usePlayQueue ([src/hooks/usePlayQueue.ts](file:///workspace/src/hooks/usePlayQueue.ts))
- **功能**：播放队列管理
- **主要方法**：
  - `addToQueue()` - 添加到队列
  - `playNext()` - 播放下一个
  - 播放模式（顺序、随机、循环）

#### 3.6.12 useMultiUser ([src/hooks/useMultiUser.ts](file:///workspace/src/hooks/useMultiUser.ts))
- **功能**：多用户快速切换
- **主要方法**：
  - `addUser()` - 添加用户
  - `switchUser()` - 切换用户
  - 用户配置隔离

---

## 4. 核心类型定义 ([types.ts](file:///workspace/types.ts))

### 4.1 主要类型

#### 服务器相关
```typescript
type ServerType = 'emby' | 'plex';

interface ServerConfig {
    url: string;
    username: string;
    token: string;
    userId: string;
    serverType: ServerType;
}
```

#### 媒体库相关
```typescript
interface EmbyLibrary {
    Id: string;
    Name: string;
    CollectionType?: string;
}
```

#### 媒体项相关
```typescript
interface EmbyItem {
    Id: string;
    Name: string;
    Type: string;
    MediaType: string;
    Overview?: string;
    ProductionYear?: number;
    Width?: number;
    Height?: number;
    RunTimeTicks?: number;
    MediaSources?: MediaSource[];
    ImageTags?: {
        Primary?: string;
        Logo?: string;
        Thumb?: string;
        Backdrop?: string;
    };
    UserData?: {
        IsFavorite: boolean;
        PlaybackPositionTicks: number;
        PlayCount: number;
        Played: boolean;
        LastPlayedDate?: string;
    };
    _PlexKey?: string;  // Plex 内部使用
}

interface MediaSource {
    Id: string;
    Container: string;
    Path: string;
    Protocol: string;
    SupportsDirectPlay?: boolean;
    SupportsDirectStream?: boolean;
    SupportsTranscoding?: boolean;
}
```

#### 浏览相关
```typescript
type FeedType = 'latest' | 'random' | 'favorites' | 'history';
type OrientationMode = 'vertical' | 'horizontal' | 'both';

interface VideoResponse {
    items: EmbyItem[];
    nextStartIndex: number;
    totalCount: number;
}
```

#### 观看历史相关
```typescript
interface WatchHistoryItem {
    id: string;
    itemId: string;
    name: string;
    imageUrl?: string;
    positionTicks: number;
    totalTicks: number;
    watchedAt: number;
    libraryId?: string;
}

interface WatchHistory {
    items: WatchHistoryItem[];
    lastUpdated: number;
}
```

#### 搜索相关
```typescript
interface SearchResult {
    items: EmbyItem[];
    totalRecordCount: number;
}

interface SearchHistoryItem {
    query: string;
    timestamp: number;
}
```

#### 收藏相关
```typescript
interface FavoriteCollection {
    id: string;
    name: string;
    createdAt: number;
    itemIds: string[];
}

interface FavoritesState {
    collections: FavoriteCollection[];
    defaultCollectionId: string;
}
```

#### 字幕相关
```typescript
interface SubtitleTrack {
    id: string;
    label: string;
    language: string;
    isDefault: boolean;
    codec?: string;
    isExternal?: boolean;
    url?: string;
}

interface SubtitleCue {
    startTime: number;
    endTime: number;
    text: string;
}

interface SubtitleSettings {
    enabled: boolean;
    selectedTrackId?: string;
    fontSize: 'small' | 'medium' | 'large';
    textColor: string;
    backgroundColor: string;
    position: 'bottom' | 'top';
}
```

#### 播放相关
```typescript
type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0;

interface PlaybackSpeedOption {
    value: PlaybackSpeed;
    label: string;
}

interface BufferingState {
    isBuffering: boolean;
    bufferedPercent: number;
    waitingForData: boolean;
}
```

---

## 5. 关键类与函数

### 5.1 EmbyClient 核心方法

#### authenticate() - 用户认证
```typescript
async authenticate(username: string, password: string): Promise<ServerConfig>
```
- 调用 Emby 的 AuthenticateByName API
- 返回包含用户信息和访问令牌的配置

#### getVideos() - 获取视频列表
```typescript
async getVideos(
    navParentId: string | undefined, 
    library: EmbyLibrary | null, 
    feedType: FeedType, 
    skip: number, 
    limit: number, 
    orientationMode: OrientationMode,
    includeIds?: string
): Promise<VideoResponse>
```
- 根据不同参数获取过滤和排序视频
- 支持方向过滤
- 支持收藏模式（使用播放列表）
- 支持递归浏览

#### toggleFavorite() - 切换收藏
```typescript
async toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>
```
- 使用 Emby 播放列表管理收藏功能
- 播放列表命名格式：`Tok-{libraryName}`

#### getVideoUrl() - 获取视频 URL
```typescript
getVideoUrl(item: EmbyItem): string
```
- 优先获取可以直接播放的媒体源
- 使用直接流方式，避免转码
- 添加 `Static=true` 参数确保原始文件播放

#### searchItems() - 搜索项目
```typescript
async searchItems(query: string): Promise<EmbyItem[]>
```
- 支持搜索电影、视频、剧集、系列
- 返回格式化后的结果

#### getSubtitleTracks() - 获取字幕轨道
```typescript
async getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]>
```
- 从媒体源中提取字幕流信息
- 支持内部和外部字幕

### 5.2 StandardRoot 关键函数

#### loadVideos() - 加载视频
```typescript
const loadVideos = async (reset: boolean = true, overrideParentId?: string)
```
- 重置或追加视频列表
- 处理媒体库选择
- 应用方向过滤

#### handleAddToWatchHistory() - 添加到观看历史
```typescript
const handleAddToWatchHistory = useCallback((item: EmbyItem, currentTime: number, duration: number)
```
- 保存播放进度
- 记录观看时间

#### loadSubtitleTracksForItem() - 加载字幕轨道
```typescript
const loadSubtitleTracksForItem = useCallback(async (itemId: string)
```
- 为当前视频加载字幕轨道
- 缓存已加载的轨道

### 5.3 TVRoot 导航处理

TVRoot 实现了自定义的键盘导航处理，支持遥控器操作：
- `findNearest()`：寻找最近的可聚焦元素
- `handleKeyDown()`：处理方向键、返回键等
- `executeBackLogic()`：处理返回逻辑，根据当前状态返回上一级

---

## 6. 数据流程

### 6.1 登录流程

```
用户输入服务器信息
    ↓
选择服务器类型 (Emby/Plex)
    ↓
ClientFactory.authenticate()
    ↓
对应客户端实现认证
    ↓
保存配置到 localStorage
    ↓
进入主界面
```

### 6.2 视频加载流程

```
StandardRoot/TVRoot 触发 loadVideos()
    ↓
通过 ClientFactory.create() 获取对应客户端
    ↓
客户端调用 getVideos() API
    ↓
应用方向过滤（如需要）
    ↓
格式化视频项数据
    ↓
更新状态
    ↓
渲染视频流或网格展示
```

### 6.3 视频播放流程

```
用户选择视频
    ↓
VideoFeed/VideoPlayer 渲染视频
    ↓
获取视频 URL (getVideoUrl)
    ↓
加载字幕轨道（如启用）
    ↓
应用用户设置（音量、速度等）
    ↓
播放控制（播放/暂停/进度调整）
    ↓
保存观看历史
```

### 6.4 收藏流程

**服务器端收藏**：
```
用户点击收藏
    ↓
EmbyClient.toggleFavorite()
    ↓
添加/移除播放列表项
    ↓
更新本地收藏状态
```

**本地收藏**：
```
用户添加到收藏夹
    ↓
useFavorites Hook 处理
    ↓
保存到 localStorage
    ↓
更新 UI
```

---

## 7. 关键特性实现

### 7.1 收藏功能

#### 双收藏系统
1. **服务器端收藏**：
   - 使用 Emby/Plex 的播放列表功能
   - 格式：`Tok-{libraryName}`
   - 在 EmbyClient 和 PlexClient 中实现

2. **本地收藏**：
   - 使用 localStorage 存储
   - 支持创建多个收藏夹
   - 由 useFavorites Hook 管理

### 7.2 方向过滤

- 根据视频宽高比过滤视频
- 支持三种模式：
  - `vertical`：只显示垂直视频（高 ≥ 宽 * 0.8）
  - `horizontal`：只显示水平视频（宽 > 高）
  - `both`：显示所有视频
- 在 EmbyClient.getVideos() 中实现

### 7.3 无限连播

- 当视频结束时自动播放下一个
- AutoPlay 模式启用时隐藏 UI 元素
- 提供纯净观看体验

### 7.4 手势与快捷键

- **电视模式**：支持遥控器导航
- **标准模式**：支持键盘操作
- **全屏观看**：手势控制：
  - 单击：播放/暂停
  - 双击：点赞
  - 左右滑动：调整进度
  - 长按：倍速播放

### 7.5 多语言支持

- 支持中文（zh）和英文（en）
- 使用 useTranslation Hook（或简单对象映射）
- 语言设置持久化到 localStorage

### 7.6 更新检查

- 检查 GitHub Releases 的最新版本
- 显示更新通知对话框
- 由 useUpdateChecker Hook 实现

---

## 8. 依赖关系

### 8.1 主要依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^18.2.0 | UI 框架 |
| react-dom | ^18.2.0 | React DOM |
| typescript | ^5.2.2 | 类型系统 |
| vite | ^5.1.4 | 构建工具 |
| tailwindcss | ^3.4.1 | CSS 框架 |
| lucide-react | ^0.344.0 | 图标库 |
| framer-motion | ^12.36.0 | 动画库 |
| @capacitor/core | ^6.0.0 | Capacitor 核心 |
| @capacitor/android | ^6.0.0 | Android 平台支持 |
| vite-plugin-pwa | ^0.19.2 | PWA 支持 |

### 8.2 开发依赖

| 依赖 | 用途 |
|------|------|
| @vitejs/plugin-react | Vite React 插件 |
| autoprefixer | CSS 前缀自动添加 |
| postcss | CSS 处理 |
| sharp | 图像处理（构建脚本） |

### 8.3 模块依赖关系图

```
App.tsx
├── StandardRoot.tsx
│   ├── Login.tsx
│   ├── VideoFeed.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── VideoCard.tsx
│   │   └── ...
│   ├── VideoGrid.tsx
│   ├── LibrarySelect.tsx
│   ├── SearchBar.tsx, SearchResults.tsx
│   ├── WatchHistoryView.tsx
│   ├── FavoritesManager.tsx
│   └── services/clientFactory.ts
│       └── services/MediaClient.ts
│           ├── services/EmbyClient.ts
│           └── services/PlexClient.ts
└── TVRoot.tsx
    ├── TVDashboard.tsx
    ├── TVVideoGrid.tsx
    ├── TVVideoPlayer.tsx
    └── TVSettings.tsx
```

---

## 9. 项目运行与构建

### 9.1 开发环境

#### 安装依赖
```bash
npm install
```

#### 启动开发服务器
```bash
npm run dev
```
- 服务器将运行在 `http://localhost:5173`（或可用端口）
- 支持 HMR（热模块替换）

#### 类型检查
```bash
tsc --noEmit
```

### 9.2 生产构建

#### 构建 Web 应用
```bash
npm run build
```
- 输出目录：`dist/`
- 构建优化包括：
  - 代码分割
  - 压缩
  - Tree Shaking
  - PWA 支持

#### 预览生产构建
```bash
npm run preview
```

### 9.3 Docker 部署

#### 官方 Docker 镜像
- 镜像名：`aidedaijiayang/embytok`
- 支持架构：AMD64 和 ARM64

#### 快速启动
```bash
docker run -d --name embytok-web --restart unless-stopped -p 8080:80 aidedaijiayang/embytok:latest
```

#### 使用 Docker Compose
```bash
# 简单部署
docker-compose -f docker-compose.simple.yml up -d

# 完整部署
docker-compose up -d
```

### 9.4 Android 应用构建

#### 前置要求
- Android Studio
- Android SDK
- JDK 17+

#### 构建步骤
```bash
# 1. 添加 Android 平台（首次）
npm run cap:add

# 2. 同步项目
npm run cap:sync

# 3. 构建 Android 应用
# 使用 Android Studio 打开 android/ 目录并构建
# 或使用提供的脚本
./build-android.sh
```

---

## 10. 配置与存储

### 10.1 localStorage 使用

应用使用 localStorage 存储以下配置：

| 键 | 用途 | 类型 |
|----|------|------|
| `embyConfig` | 服务器配置 | ServerConfig |
| `embyHiddenLibs` | 隐藏的媒体库 ID 列表 | string[] |
| `embyOrientationMode` | 方向过滤模式 | OrientationMode |
| `embyForceDeviceMode` | 强制设备模式 | 'standard' \| 'tv' |
| `embyLanguage` | 语言设置 | 'zh' \| 'en' |
| `watchHistory` | 观看历史 | WatchHistory |
| `favorites` | 本地收藏 | FavoritesState |
| `subtitleSettings` | 字幕设置 | SubtitleSettings |

### 10.2 环境变量

在 `vite.config.ts` 中定义：
- `VITE_APP_VERSION`：应用版本（从 package.json 读取）

---

## 11. 重要文件索引

### 核心文件
- [App.tsx](file:///workspace/App.tsx)：应用根组件
- [types.ts](file:///workspace/types.ts)：类型定义
- [index.tsx](file:///workspace/index.tsx)：React 入口
- [vite.config.ts](file:///workspace/vite.config.ts)：Vite 配置

### 服务层
- [MediaClient.ts](file:///workspace/services/MediaClient.ts)：媒体客户端抽象
- [EmbyClient.ts](file:///workspace/services/EmbyClient.ts)：Emby 客户端
- [PlexClient.ts](file:///workspace/services/PlexClient.ts)：Plex 客户端
- [clientFactory.ts](file:///workspace/services/clientFactory.ts)：客户端工厂

### 组件层
- [StandardRoot.tsx](file:///workspace/components/standard/StandardRoot.tsx)：标准模式根组件
- [TVRoot.tsx](file:///workspace/components/tv/TVRoot.tsx)：电视模式根组件
- [VideoFeed.tsx](file:///workspace/components/VideoFeed.tsx)：视频流组件
- [VideoGrid.tsx](file:///workspace/components/VideoGrid.tsx)：视频网格组件
- [VideoPlayer.tsx](file:///workspace/components/VideoPlayer.tsx)：视频播放器组件
- [Login.tsx](file:///workspace/components/Login.tsx)：登录组件
- [LibrarySelect.tsx](file:///workspace/components/LibrarySelect.tsx)：媒体库选择

### Hooks 层
- [src/hooks/](file:///workspace/src/hooks/)：所有自定义 Hooks
- [src/hooks/index.ts](file:///workspace/src/hooks/index.ts)：Hooks 导出

### 配置文件
- [tailwind.config.js](file:///workspace/tailwind.config.js)：Tailwind CSS 配置
- [tsconfig.json](file:///workspace/tsconfig.json)：TypeScript 配置
- [capacitor.config.ts](file:///workspace/capacitor.config.ts)：Capacitor 配置
- [docker-compose.yml](file:///workspace/docker-compose.yml)：Docker Compose 配置
- [Dockerfile](file:///workspace/Dockerfile)：Docker 镜像构建

---

## 12. 开发指南

### 12.1 添加新功能

#### 示例：添加新的浏览模式

1. 在 [types.ts](file:///workspace/types.ts) 中更新 `FeedType` 类型
2. 在 [MediaClient.ts](file:///workspace/services/MediaClient.ts) 中确保接口支持
3. 在 [EmbyClient.ts](file:///workspace/services/EmbyClient.ts) 和 [PlexClient.ts](file:///workspace/services/PlexClient.ts) 中实现
4. 在 [StandardRoot.tsx](file:///workspace/components/standard/StandardRoot.tsx) 中添加 UI 选项
5. 在 [TVRoot.tsx](file:///workspace/components/tv/TVRoot.tsx) 中添加电视模式支持
6. 测试功能

### 12.2 代码风格

- 使用 TypeScript 类型安全
- 使用 Tailwind CSS 进行样式
- 组件采用函数式组件和 Hooks
- 服务层使用面向对象设计模式
- 多语言支持（中文/英文）
- 使用 Prettier 格式化代码

### 12.3 组件开发最佳实践

1. **代码分割**：使用 `React.lazy()` 和 `Suspense` 进行懒加载
2. **类型安全**：为所有组件 props 定义 TypeScript 接口
3. **可访问性**：添加适当的 ARIA 属性和键盘支持
4. **性能优化**：使用 `useMemo`、`useCallback` 避免不必要的重渲染
5. **响应式设计**：使用 Tailwind 的响应式类适配不同屏幕

### 12.4 提交规范

- 使用有意义的提交信息
- 按功能模块分组提交
- 确保代码通过类型检查和格式化

---

## 13. 性能优化

### 13.1 构建优化

- **代码分割**：Vite 配置中配置了手动分包
- **Tree Shaking**：自动移除未使用代码
- **压缩**：使用 Terser 压缩，移除 console 和 debugger
- **PWA 缓存**：使用 Service Worker 缓存静态资源和图片

### 13.2 运行时优化

- **图片懒加载**：使用 `useLazyImage` Hook
- **视频预加载**：智能预加载策略
- **虚拟列表**：大量视频项使用虚拟滚动
- **防抖**：搜索等操作使用防抖

### 13.3 网络优化

- **直接流播放**：避免转码，直接播放原始文件
- **图片缓存**：Service Worker 缓存图片
- **分页加载**：视频列表分页获取

---

## 14. 故障排除

### 14.1 常见问题

#### 视频无法播放
- 检查服务器连接
- 确认视频格式是否受浏览器支持
- 检查网络权限

#### 无法连接到服务器
- 验证服务器地址和端口
- 检查防火墙设置
- 确认用户名和密码/令牌正确

#### 字幕不显示
- 检查字幕轨道是否存在
- 确认字幕格式支持（SRT/VTT）
- 检查字幕设置是否启用

#### 电视模式遥控器不工作
- 确保焦点在正确的元素上
- 检查键盘事件是否被阻止
- 尝试刷新页面

---

## 15. 参考资源

### 15.1 外部文档

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vite 官方文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Emby API 文档](https://swagger.emby.media/)
- [Plex API 文档](https://github.com/Arcanemagus/plex-api/wiki)
- [Capacitor 文档](https://capacitorjs.com/docs)

### 15.2 项目相关文档

- [README.md](file:///workspace/README.md)：项目说明
- [README_CN.md](file:///workspace/README_CN.md)：中文项目说明
- [FEATURES_PRD.md](file:///workspace/FEATURES_PRD.md)：功能需求文档
- [PERFORMANCE_ANALYSIS.md](file:///workspace/PERFORMANCE_ANALYSIS.md)：性能分析
- [ANDROID_BUILD.md](file:///workspace/ANDROID_BUILD.md)：Android 构建指南
- [SYNOLOGY_DEPLOY.md](file:///workspace/SYNOLOGY_DEPLOY.md)：群晖部署指南
- [本地构建指南.md](file:///workspace/本地构建指南.md)：本地构建指南

---

*文档版本：1.9.5*  
*最后更新：2026-06-06*

---

## 16. 新增组件

### 16.1 VideoPreview
- **文件**：`components/VideoPreview.tsx`
- **功能**：短视频预览组件
- **特性**：无声播放、3秒预览、自动循环

### 16.2 BoxSetView
- **文件**：`components/BoxSetView.tsx`
- **功能**：BoxSet/Collection 视图
- **特性**：横向滚动海报、播放全部

### 16.3 Skeleton
- **文件**：`components/Skeleton.tsx`
- **功能**：骨架屏组件
- **特性**：分片加载、渐变动画

### 16.4 UserSwitcher
- **文件**：`components/UserSwitcher.tsx`
- **功能**：用户切换组件
- **特性**：快速切换、添加/删除用户

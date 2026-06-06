# API 文档

本文档描述了 EmbyTok 项目中的主要 API 和服务接口。

## 目录

- [媒体客户端](#媒体客户端)
- [EmbyClient](#embyclient)
- [PlexClient](#plexclient)
- [自定义 Hooks](#自定义-hooks)
- [工具函数](#工具函数)

## 媒体客户端

### MediaClient 抽象类

位置: [services/MediaClient.ts](file:///workspace/services/MediaClient.ts)

所有媒体服务器客户端的基类，定义了通用接口。

```typescript
abstract class MediaClient {
  constructor(config: ServerConfig);

  abstract authenticate(username: string, password: string): Promise<ServerConfig>;
  abstract getLibraries(): Promise<EmbyLibrary[]>;
  abstract getVideos(...): Promise<VideoResponse>;
  abstract getVideoUrl(item: EmbyItem): string;
  abstract getImageUrl(...): string;
  abstract getFavorites(libraryName: string): Promise<Set<string>>;
  abstract toggleFavorite(...): Promise<void>;
  abstract deleteItem(itemId: string): Promise<void>;
  abstract searchItems(query: string): Promise<EmbyItem[]>;
  abstract getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]>;
}
```

## EmbyClient

位置: [services/EmbyClient.ts](file:///workspace/services/EmbyClient.ts)

Emby 媒体服务器的客户端实现。

### 构造函数

```typescript
constructor(config: ServerConfig)
```

**参数:**

- `config`: 服务器配置对象
  - `url`: 服务器地址
  - `username`: 用户名
  - `token`: 访问令牌
  - `userId`: 用户 ID
  - `serverType`: 服务器类型 ('emby')

### 方法

#### authenticate

```typescript
async authenticate(username: string, password: string): Promise<ServerConfig>
```

使用用户名和密码认证 Emby 服务器。

**参数:**

- `username`: 用户名
- `password`: 密码

**返回:** 包含用户信息和访问令牌的 ServerConfig 对象

**抛出:** 当认证失败时抛出错误

---

#### getLibraries

```typescript
async getLibraries(): Promise<EmbyLibrary[]>
```

获取用户有权访问的所有媒体库。

**返回:** 媒体库数组

---

#### getVideos

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

获取视频列表，支持多种过滤和排序选项。

**参数:**

- `navParentId`: 导航父级 ID（用于文件夹/剧集浏览）
- `library`: 选中的媒体库
- `feedType`: 视频源类型 ('latest' | 'random' | 'favorites' | 'history')
- `skip`: 跳过的项目数
- `limit`: 返回的项目数
- `orientationMode`: 视频方向过滤 ('vertical' | 'horizontal' | 'both')
- `includeIds`: 包含的库 ID（逗号分隔）

**返回:** 包含视频列表和分页信息的 VideoResponse 对象

---

#### getVideoUrl

```typescript
getVideoUrl(item: EmbyItem): string
```

获取视频播放 URL。

**参数:**

- `item`: 视频项对象

**返回:** 视频流 URL

---

#### getImageUrl

```typescript
getImageUrl(
  itemId: string,
  tag?: string,
  type: 'Primary' | 'Backdrop' = 'Primary'
): string
```

获取图片 URL。

**参数:**

- `itemId`: 项目 ID
- `tag`: 图片标签（用于缓存）
- `type`: 图片类型

**返回:** 图片 URL

---

#### getFavorites

```typescript
async getFavorites(libraryName: string): Promise<Set<string>>
```

获取收藏的视频 ID 集合。

**参数:**

- `libraryName`: 媒体库名称

**返回:** 收藏的视频 ID 集合

---

#### toggleFavorite

```typescript
async toggleFavorite(
  itemId: string,
  isFavorite: boolean,
  libraryName: string
): Promise<void>
```

切换视频的收藏状态。

**参数:**

- `itemId`: 视频 ID
- `isFavorite`: 当前是否已收藏
- `libraryName`: 媒体库名称

---

#### deleteItem

```typescript
async deleteItem(itemId: string): Promise<void>
```

删除媒体项目。

**参数:**

- `itemId`: 项目 ID

---

#### searchItems

```typescript
async searchItems(query: string): Promise<EmbyItem[]>
```

搜索媒体项目。

**参数:**

- `query`: 搜索查询

**返回:** 匹配的项目数组

---

#### getSubtitleTracks

```typescript
async getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]>
```

获取视频的字幕轨道。

**参数:**

- `itemId`: 视频 ID

**返回:** 字幕轨道数组

## PlexClient

位置: [services/PlexClient.ts](file:///workspace/services/PlexClient.ts)

Plex 媒体服务器的客户端实现，接口与 EmbyClient 类似。

## 客户端工厂

位置: [services/clientFactory.ts](file:///workspace/services/clientFactory.ts)

创建适当媒体客户端的工厂函数。

```typescript
function createClient(config: ServerConfig): MediaClient;
```

**参数:**

- `config`: 服务器配置

**返回:** 对应的 MediaClient 实例

## 自定义 Hooks

### useConfig

位置: [src/hooks/useConfig.ts](file:///workspace/src/hooks/useConfig.ts)

管理应用配置和认证状态的 Hook。

```typescript
function useConfig(): {
  config: ServerConfig | null;
  setConfig: (config: ServerConfig | null) => void;
  isLoggedIn: boolean;
  logout: () => void;
};
```

### useVideoList

位置: [src/hooks/useVideoList.ts](file:///workspace/src/hooks/useVideoList.ts)

管理视频列表、收藏、导航等功能的核心 Hook。

```typescript
function useVideoList(options: UseVideoListOptions): {
  videos: EmbyItem[];
  loading: boolean;
  hasMore: boolean;
  navStack: NavItem[];
  favoriteIds: Set<string>;
  viewMode: 'feed' | 'grid';
  currentIndex: number;
  setViewMode: (mode: 'feed' | 'grid') => void;
  setCurrentIndex: (index: number) => void;
  loadVideos: (reset?: boolean, overrideParentId?: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  deleteVideo: (itemId: string) => Promise<void>;
  navigateTo: (id: string, title: string) => void;
  navigateBack: () => void;
  selectVideo: (index: number) => void;
};
```

### useVideoControls

位置: [src/hooks/useVideoControls.ts](file:///workspace/src/hooks/useVideoControls.ts)

管理视频播放器控制的 Hook。

```typescript
function useVideoControls(options: UseVideoControlsOptions): {
  isPlaying: boolean;
  isMuted: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  hasStarted: boolean;
  isUserPaused: boolean;
  error: string | undefined;
  togglePlay: () => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  seek: (time: number) => void;
  // ... 更多控制方法
};
```

### useFavorites

位置: [src/hooks/useFavorites.ts](file:///workspace/src/hooks/useFavorites.ts)

管理收藏功能的 Hook。

### useLibraries

位置: [src/hooks/useLibraries.ts](file:///workspace/src/hooks/useLibraries.ts)

管理媒体库的 Hook。

### useSearch

位置: [src/hooks/useSearch.ts](file:///workspace/src/hooks/useSearch.ts)

管理搜索功能的 Hook。

### useSubtitles

位置: [src/hooks/useSubtitles.ts](file:///workspace/src/hooks/useSubtitles.ts)

管理字幕功能的 Hook。

### useWatchHistory

位置: [src/hooks/useWatchHistory.ts](file:///workspace/src/hooks/useWatchHistory.ts)

管理观看历史的 Hook。

### useSmartVideoPreload

位置: [src/hooks/useSmartVideoPreload.ts](file:///workspace/src/hooks/useSmartVideoPreload.ts)

智能预加载视频的 Hook，根据网络状况和滚动行为动态调整预加载策略。

### useGestureControls

位置: [src/hooks/useGestureControls.ts](file:///workspace/src/hooks/useGestureControls.ts)

处理触摸手势控制的 Hook。

### useDeviceDetection

位置: [src/hooks/useDeviceDetection.ts](file:///workspace/src/hooks/useDeviceDetection.ts)

检测设备类型和浏览器特征的 Hook。

### useLazyImage

位置: [src/hooks/useLazyImage.ts](file:///workspace/src/hooks/useLazyImage.ts)

图片懒加载的 Hook。

### useImagePreload

位置: [src/hooks/useImagePreload.ts](file:///workspace/src/hooks/useImagePreload.ts)

图片预加载的 Hook。

### useTranslation

位置: [src/hooks/useTranslation.ts](file:///workspace/src/hooks/useTranslation.ts)

国际化翻译 Hook。

### useUIState

位置: [src/hooks/useUIState.ts](file:///workspace/src/hooks/useUIState.ts)

管理 UI 状态的 Hook。

### useUpdateChecker

位置: [src/hooks/useUpdateChecker.ts](file:///workspace/src/hooks/useUpdateChecker.ts)

检查应用更新的 Hook。

## 工具函数

### 时间工具

位置: [utils/time.ts](file:///workspace/utils/time.ts)

时间相关的工具函数。

### 媒体工具

位置: [utils/media.ts](file:///workspace/utils/media.ts)

媒体相关的工具函数。

#### isFolderType

```typescript
function isFolderType(item: EmbyItem): boolean;
```

判断项目是否为文件夹类型。

#### calculatePlaybackProgress

```typescript
function calculatePlaybackProgress(playbackPositionTicks?: number, runTimeTicks?: number): number;
```

计算视频播放进度百分比。

### 设备工具

位置: [utils/device.ts](file:///workspace/utils/device.ts)

设备检测相关的工具函数。

#### isTVDevice

```typescript
function isTVDevice(): boolean;
```

判断设备是否为电视。

#### isIOSSafari

```typescript
function isIOSSafari(): boolean;
```

判断是否为 iOS Safari 浏览器。

## 类型定义

完整的类型定义请参考 [types.ts](file:///workspace/types.ts)。

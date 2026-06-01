# EmbyTok 项目代码维基文档

## 1. 项目概述

**EmbyTok** 是一个为 Emby 和 Plex 媒体服务器设计的垂直视频浏览客户端，提供类似 TikTok 的用户体验。它允许用户以更现代化和便捷的方式浏览个人媒体库。

- **版本:** 1.2.4
- **技术栈:** React 18, TypeScript, Vite, Tailwind CSS
- **支持平台:** Web浏览器、Android应用（基于 Capacitor）、TV 大屏设备

## 2. 项目架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层 (UI) │
│  ┌───────────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Standard   │  │  TV Root  │  │  Mobile   │ │
│  │    Root    │  │           │  │  Root   │ │
│  └──────┬────┘  └─────┬──────┘  └─────┬────┘ │
└─────────┼───────────────┼───────────────┼──────────────────┘
          │               │               │
┌─────────▼───────────────▼───────────────▼──────────────────┐
│                  组件层 (Components) │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │Video │ │ Video  │ │  │   │ │Login   │ │
│  │ Feed │ │ Grid  │ │ Card  │ │  │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
└──────────────┬────────────────────────┬────────────────────────┘
               │                        │
┌──────────────▼────────────────────────▼────────────────┐
│                服务层 (Services) │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Emby │ │  Plex   │ │  │Media    │
│  │ Client │ │  Client │ │ │ │ │Client   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│              │ Client Factory  │
└──────────────┬────────────────────────┬────────────────────────┘
               │                        │
┌──────────────▼────────────────────────▼────────────────┐
│                 类型定义 (Types) │
│              (types.ts)  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
/workspace
├── components/             # 组件目录
│   ├── mobile/        # 移动端特定组件
│   │   └── MobileRoot.tsx
│   ├── standard/    # 标准模式组件
│   │   └── StandardRoot.tsx
│   ├── tv/          # 电视模式组件
│   │   ├── TVRoot.tsx
│   │   ├── TVDashboard.tsx
│   │   ├── TVVideoGrid.tsx
│   │   ├── TVVideoPlayer.tsx
│   │   └── TVSettings.tsx
│   ├── LibrarySelect.tsx
│   ├── Login.tsx
│   ├── VideoCard.tsx
│   ├── VideoFeed.tsx
│   └── VideoGrid.tsx
├── services/           # 服务层
│   ├── MediaClient.ts   # 抽象媒体客户端
│   ├── EmbyClient.ts  # Emby 客户端实现
│   ├── PlexClient.ts  # Plex 客户端实现
│   ├── clientFactory.ts # 客户端工厂
│   └── embyService.ts
├── public/             # 静态资源
├── scripts/            # 构建脚本
├── types.ts            # 类型定义
├── App.tsx            # 应用入口组件
├── index.tsx          # React 渲染入口
└── 配置文件
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── capacitor.config.ts
```

## 3. 核心模块说明

### 3.1 应用入口 ([App.tsx](file:///workspace/App.tsx)

**职责**:

- 检测设备类型并选择对应的根组件
- 支持在标准模式和电视模式间切换

**关键功能**:

- 自动检测设备模式（通过 localStorage 或 user-agent）
- 保存设备模式切换功能
- 应用根组件渲染

```typescript
// 核心代码
const [deviceMode, setDeviceMode] = useState<'standard' | 'tv'>(() => {
  try {
    const forcedMode = localStorage.getItem('embyForceDeviceMode');
    if (forcedMode === 'tv' || forcedMode === 'standard') return forcedMode;
    const userAgent = navigator.userAgent.toLowerCase();
    const isTV =
      userAgent.includes('tv') || userAgent.includes('googletv') || userAgent.includes('smarttv');
    return isTV ? 'tv' : 'standard';
  } catch (e) {
    return 'standard';
  }
});
```

### 3.2 服务层抽象与工厂模式

#### 3.2.1 媒体客户端抽象类 ([MediaClient.ts](file:///workspace/services/MediaClient.ts))

**职责**:

- 定义了所有媒体客户端必须实现的抽象接口
- 提供统一的媒体服务抽象

**主要抽象方法**:

```typescript
abstract authenticate(username: string, password: string): Promise<ServerConfig>;
abstract getLibraries(): Promise<EmbyLibrary[]>;
abstract getResumeItems(): Promise<EmbyItem[]>;
abstract getVideos(parentId, library, feedType, skip, limit, orientationMode, includeIds?): Promise<VideoResponse>;
abstract getVideoUrl(item: EmbyItem): string;
abstract getImageUrl(itemId: string, tag?: string, type?: 'Primary' | 'Backdrop'): string;
abstract getFavorites(libraryName: string): Promise<Set<string>>;
abstract toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>;
abstract deleteItem(itemId: string): Promise<void>;
```

#### 3.2.2 客户端工厂 ([clientFactory.ts](file:///workspace/services/clientFactory.ts))

**职责**:

- 根据服务器类型创建对应的客户端实例
- 处理认证流程

```typescript
export class ClientFactory {
  static create(config: ServerConfig): MediaClient {
    if (config.serverType === 'plex') {
      return new PlexClient(config);
    }
    return new EmbyClient(config);
  }

  static async authenticate(
    type: ServerType,
    url: string,
    username: string,
    password: string
  ): Promise<ServerConfig>;
}
```

#### 3.2.3 Emby 客户端 ([EmbyClient.ts](file:///workspace/services/EmbyClient.ts))

**职责**:

- 实现与 Emby 服务器的通信
- 提供完整的 Emby API 集成

**核心功能**:

- 用户认证
- 获取媒体库
- 获取视频列表
- 获取视频流 URL
- 收藏管理（使用 Emby 播放列表）
- 视频删除

#### 3.2.4 Plex 客户端 ([PlexClient.ts](file:///workspace/services/PlexClient.ts))

**职责**:

- 实现与 Plex 服务器的通信
- 提供完整的 Plex API 集成

**核心功能**:

- 与 EmbyClient 类似，但适配 Plex 特定接口

### 3.3 标准模式根组件 ([StandardRoot.tsx](file:///workspace/components/standard/StandardRoot.tsx)

**职责**:

- 标准模式的主要界面管理
- 处理视频浏览体验

**主要功能**:

- 用户登录状态管理
- 媒体库选择与管理
- 视频浏览与网格视图切换
- 视频浏览模式切换（最新/随机/收藏）
- 视频方向过滤（垂直/水平/两者）
- 播放控制（静音/全屏/自动连播）

### 3.4 电视模式根组件 ([TVRoot.tsx](file:///workspace/components/tv/TVRoot.tsx))

**职责**:

- 电视模式的主要界面管理
- 遥控器导航与大屏优化

**主要功能**:

- 侧边栏导航菜单
- 首页仪表盘
- 视频网格展示
- 视频播放
- 遥控器按键处理
- 设置界面

### 3.5 视频流组件 ([VideoFeed.tsx](file:///workspace/components/VideoFeed.tsx))

**职责**:

- 提供垂直视频流体验
- 处理滚动与视频切换

**核心功能**:

- 全屏垂直滚动
- 视频卡片渲染与切换
- 自动加载更多视频
- 电视遥控器支持
- 自动连播功能

### 3.6 视频网格组件 ([VideoGrid.tsx](file:///workspace/components/VideoGrid.tsx))

**职责**:

- 以网格形式展示视频列表

## 4. 核心类型定义 ([types.ts](file:///workspace/types.ts))

### 4.1 主要类型

```typescript
// 服务器类型
type ServerType = 'emby' | 'plex';

// 服务器配置
interface ServerConfig {
  url: string;
  username: string;
  token: string;
  userId: string;
  serverType: ServerType;
}

// 媒体库
interface EmbyLibrary {
  Id: string;
  Name: string;
  CollectionType?: string;
}

// 媒体项
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
  ImageTags?: { Primary?: string; Logo?: string; Thumb?: string; Backdrop?: string };
  UserData?: {
    IsFavorite: boolean;
    PlaybackPositionTicks: number;
    PlayCount: number;
    Played: boolean;
    LastPlayedDate?: string;
  };
  _PlexKey?: string;
}

// 浏览类型
type FeedType = 'latest' | 'random' | 'favorites';

// 方向模式
type OrientationMode = 'vertical' | 'horizontal' | 'both';
```

## 5. 关键类与函数

### 5.1 EmbyClient 类核心方法

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

#### toggleFavorite() - 切换收藏

```typescript
async toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>
```

- 使用 Emby 播放列表管理收藏功能

### 5.2 StandardRoot 组件主要状态

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
```

### 5.3 TVRoot 组件导航处理

TVRoot 实现了自定义的键盘导航处理，支持遥控器操作。

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // 处理返回键
  if (e.key === 'Backspace' || e.key === 'Escape') { ... }

  // 处理方向键
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    // 计算最近元素并聚焦
    // 使用 findNearest() 函数
  }
}
```

## 6. 数据流程

### 6.1 登录流程

1. 用户在登录界面选择服务器类型（Emby/Plex）
2. 输入服务器地址和凭据
3. ClientFactory.authenticate() 调用
4. 保存配置到 localStorage
5. 进入主界面

### 6.2 视频加载流程

1. StandardRoot/TVRoot 触发 loadVideos()
2. 通过 ClientFactory.create() 获取对应客户端
3. 客户端调用 getVideos() API
4. 处理响应并更新状态
5. 渲染视频流或网格展示

## 7. 关键特性实现

### 7.1 收藏功能

- 使用服务器的播放列表功能实现收藏
- 格式为 `Tok-{libraryName}`
- 在 EmbyClient 和 PlexClient 中都有实现

### 7.2 方向过滤

- 根据视频宽高比过滤视频
- 支持垂直/水平/两者模式

### 7.3 无限连播

- 当视频结束时自动下一个
- AutoPlay 模式开启

### 7.4 手势与快捷键

- 电视模式支持遥控器导航
- 支持键盘操作
- 全屏观看时手势控制

## 8. 依赖关系

### 8.1 主要依赖

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React（图标库）
- Framer Motion
- Capacitor（移动应用）

### 8.2 构建工具

- Vite 作为构建工具
- TypeScript 类型检查
- Tailwind CSS 样式

## 9. 项目运行与构建

### 9.1 开发

```bash
npm install
npm run dev
```

### 9.2 生产构建

```bash
npm run build
```

### 9.3 Docker 部署

支持 Docker 镜像：

- 官方镜像：`aidedaijiayang/embytok`
- 阿里云镜像（更新可能延迟）
- 支持 AMD64 和 ARM64 架构

```bash
docker run -d --name embytok-web --restart unless-stopped -p 8080:80 aidedaijiayang/embytok:latest
```

### 9.4 Android 应用构建

```bash
npm run cap:add
npm run cap:sync
./build-apk.sh
```

## 10. 配置与存储

### 10.1 localStorage 使用

- `embyConfig` - 服务器配置
- `embyHiddenLibs` - 隐藏的媒体库
- `embyOrientationMode` - 方向过滤模式
- `embyForceDeviceMode` - 强制设备模式
- `embyLanguage` - 语言设置

## 11. 重要文件索引

### 核心文件

- [App.tsx](file:///workspace/App.tsx) - 应用根组件
- [types.ts](file:///workspace/types.ts) - 类型定义
- [index.tsx](file:///workspace/index.tsx) - React 入口

### 服务层

- [MediaClient.ts](file:///workspace/services/MediaClient.ts) - 媒体客户端抽象
- [EmbyClient.ts](file:///workspace/services/EmbyClient.ts) - Emby 客户端
- [PlexClient.ts](file:///workspace/services/PlexClient.ts) - Plex 客户端
- [clientFactory.ts](file:///workspace/services/clientFactory.ts) - 客户端工厂

### 组件层

- [StandardRoot.tsx](file:///workspace/components/standard/StandardRoot.tsx) - 标准模式根组件
- [TVRoot.tsx](file:///workspace/components/tv/TVRoot.tsx) - 电视模式根组件
- [VideoFeed.tsx](file:///workspace/components/VideoFeed.tsx) - 视频流组件
- [VideoGrid.tsx](file:///workspace/components/VideoGrid.tsx) - 视频网格组件
- [VideoCard.tsx](file:///workspace/components/VideoCard.tsx) - 视频卡片组件
- [Login.tsx](file:///workspace/components/Login.tsx) - 登录组件
- [LibrarySelect.tsx](file:///workspace/components/LibrarySelect.tsx) - 媒体库选择

## 12. 开发指南

### 12.1 添加新功能

1. 在 types.ts 中定义类型（如需要）
2. 在 MediaClient 抽象类添加方法
3. 在 EmbyClient 和 PlexClient 实现对应实现
4. 在对应组件（StandardRoot/TVRoot）中集成
5. 构建并测试

### 12.2 代码风格

- 使用 TypeScript 类型安全
- 使用 Tailwind CSS 进行样式
- 组件采用函数式组件和 Hooks
- 服务层使用面向对象设计模式
- 多语言支持（中文/英文）

---

*文档版本: 1.0
*最后更新: 2026-05-31

# 架构设计文档

本文档描述了 EmbyTok 项目的整体架构设计、技术选型和核心模块说明。

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [整体架构](#整体架构)
- [核心模块](#核心模块)
- [数据流](#数据流)
- [组件层次结构](#组件层次结构)
- [状态管理](#状态管理)
- [性能优化策略](#性能优化策略)
- [扩展指南](#扩展指南)

## 项目概述

EmbyTok 是一个垂直视频浏览客户端，为 Emby 和 Plex 媒体服务器提供类似 TikTok 的用户体验。项目支持多种设备：桌面、移动端和智能电视。

### 核心特性

- 垂直视频流浏览（上下滑动切换）
- 多设备支持（标准/电视模式）
- 收藏和观看历史
- 视频搜索
- 字幕支持
- 多视图模式（流视图/网格视图）
- 响应式设计

## 技术栈

### 前端框架

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库
- **Lucide React** - 图标库

### 构建与部署

- **Vite** - 开发服务器和构建工具
- **Capacitor** - 原生应用包装（Android）
- **Docker** - 容器化部署
- **Nginx** - Web 服务器（生产环境）

### 服务端集成

- Emby API
- Plex API

### PWA 支持

- Vite Plugin PWA
- Service Worker
- 离线缓存

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  标准模式    │  │  电视模式    │  │  移动模式    │      │
│  │ StandardRoot │  │   TVRoot     │  │ MobileRoot   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      组件层 (components/)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ VideoPlayer, VideoFeed, VideoGrid, VideoControls...  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    自定义 Hooks (src/hooks/)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useConfig, useVideoList, useVideoControls...         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   服务层 (services/)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MediaClient (抽象)                                    │  │
│  │   ├── EmbyClient                                      │  │
│  │   └── PlexClient                                      │  │
│  │ clientFactory                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      工具层 (utils/)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ media, time, device...                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    外部服务                                   │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Emby Server     │  │  Plex Server     │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 设备模式系统

位置: [App.tsx](file:///workspace/App.tsx)

应用支持多种设备模式，通过用户代理检测或用户选择来决定：

- **标准模式** (`StandardRoot`): 桌面和移动设备
- **电视模式** (`TVRoot`): 智能电视，支持遥控器导航

```typescript
// 设备检测逻辑
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

使用 React.lazy 进行代码分割，只在需要时加载对应模式的组件。

### 2. 媒体客户端抽象

位置: [services/](file:///workspace/services/)

使用抽象基类 `MediaClient` 统一不同媒体服务器的接口：

```typescript
abstract class MediaClient {
  abstract authenticate(...): Promise<ServerConfig>;
  abstract getVideos(...): Promise<VideoResponse>;
  // ... 其他抽象方法
}

class EmbyClient extends MediaClient { /* Emby 实现 */ }
class PlexClient extends MediaClient { /* Plex 实现 */ }
```

通过 `clientFactory` 根据服务器类型创建对应客户端实例。

### 3. 视频列表管理

位置: [src/hooks/useVideoList.ts](file:///workspace/src/hooks/useVideoList.ts)

核心 Hook，管理：

- 视频数据加载
- 收藏功能
- 导航栈（支持文件夹/剧集深度浏览）
- 视图模式切换（流/网格）
- 当前视频索引

### 4. 视频播放系统

位置: [components/VideoPlayer.tsx](file:///workspace/components/VideoPlayer.tsx) 和 [src/hooks/useVideoControls.ts](file:///workspace/src/hooks/useVideoControls.ts)

- HTML5 Video 元素封装
- 播放控制（播放/暂停、音量、进度、倍速）
- 手势支持（点击、双击、长按、滑动）
- 字幕渲染

### 5. 智能预加载系统

位置: [src/hooks/useSmartVideoPreload.ts](file:///workspace/src/hooks/useSmartVideoPreload.ts)

根据多种因素动态调整预加载策略：

- 网络状况（通过 Network Information API）
- 滚动速度和方向
- 当前视频索引

## 数据流

### 认证流程

```
用户输入服务器信息
    │
    ▼
Login 组件
    │
    ▼
useConfig Hook
    │
    ▼
clientFactory 创建客户端
    │
    ▼
MediaClient.authenticate()
    │
    ▼
保存配置到 localStorage
    │
    ▼
进入应用
```

### 视频加载流程

```
用户操作（选择库/切换源）
    │
    ▼
useVideoList.loadVideos()
    │
    ▼
MediaClient.getVideos()
    │
    ├─ 应用方向过滤
    │
    ▼
更新状态: videos, loading, etc.
    │
    ▼
组件重新渲染
    │
    ▼
useSmartVideoPreload 根据需要预加载
```

### 播放控制流程

```
用户交互
    │
    ▼
VideoControls/手势处理器
    │
    ▼
useVideoControls 方法
    │
    ▼
更新内部状态
    │
    ▼
通过 ref 操作 video 元素
    │
    ▼
video 事件触发回调
    │
    ▼
更新 UI
```

## 组件层次结构

### 标准模式组件树

```
App
└── Suspense
    └── StandardRoot
        ├── Login (未登录时)
        └── (已登录)
            ├── LibrarySelect
            ├── HeaderControls
            ├── VideoFeed / VideoGrid
            │   ├── VideoCard (网格)
            │   └── VideoPlayer (流)
            │       ├── SubtitleRenderer
            │       ├── VideoControls
            │       └── VideoInfo
            ├── FavoritesManager
            ├── SearchBar / SearchResults
            └── UpdateNotification
```

### 电视模式组件树

```
App
└── Suspense
    └── TVRoot
        ├── Login (未登录时)
        └── (已登录)
            ├── TVDashboard
            │   ├── TVSettings
            │   ├── LibraryNav
            │   └── TVVideoGrid
            │       └── VideoCard
            └── TVVideoPlayer
                └── TVControls
```

## 状态管理

### 本地存储 (localStorage)

应用使用 localStorage 持久化以下数据：

- 服务器配置 (`embyConfig`)
- 强制设备模式 (`embyForceDeviceMode`)
- 观看历史
- 隐藏库设置
- UI 偏好

### React 状态

主要使用 React Hooks 管理组件状态：

- `useState` - 本地状态
- `useReducer` - 复杂状态逻辑（如播放器控制）
- `useContext` - 全局状态（如配置、语言）
- 自定义 Hooks - 封装复杂逻辑

### 状态设计原则

1. **最小化状态**: 只存储必要数据，衍生数据通过计算获得
2. **状态提升**: 共享状态提升到最近的共同祖先
3. **不可变更新**: 使用不可变方式更新状态
4. **性能优化**: 使用 `useMemo`、`useCallback` 避免不必要的重新渲染

## 性能优化策略

### 1. 代码分割

使用 React.lazy 和 Suspense 进行路由级别的代码分割：

```typescript
const StandardRoot = lazy(() => import('./components/standard/StandardRoot'));
const TVRoot = lazy(() => import('./components/tv/TVRoot'));
```

### 2. 组件优化

- 使用 `React.memo` 包裹纯组件
- 列表使用 key 属性
- 避免内联对象和函数作为 props

### 3. 资源优化

- 图片懒加载（`useLazyImage`）
- 智能视频预加载（`useSmartVideoPreload`）
- 根据网络状况调整图片质量

### 4. 构建优化

[Vite 配置](file:///workspace/vite.config.ts) 中的优化：

- 手动代码块分割（manualChunks）
- 生产构建压缩
- Tree Shaking
- CSS 代码分割

## 扩展指南

### 添加新的媒体服务器支持

1. 在 [services/](file:///workspace/services/) 中创建新客户端类，继承 `MediaClient`
2. 实现所有抽象方法
3. 在 `clientFactory` 中添加对应 case
4. 在 [types.ts](file:///workspace/types.ts) 中更新 `ServerType` 类型

### 添加新的组件

1. 在 [components/](file:///workspace/components/) 中创建组件文件
2. 根据目标设备模式放在相应子目录
3. 使用 TypeScript 定义 props 类型
4. 导出组件

### 添加新的自定义 Hook

1. 在 [src/hooks/](file:///workspace/src/hooks/) 中创建文件
2. 命名约定: `useXXX`
3. 在 [src/hooks/index.ts](file:///workspace/src/hooks/index.ts) 中导出
4. 添加文档注释

### 添加新的语言支持

1. 在 [src/locales/](file:///workspace/src/locales/) 中创建新的语言文件
2. 参照现有语言文件格式
3. 在 [src/locales/index.ts](file:///workspace/src/locales/index.ts) 中注册

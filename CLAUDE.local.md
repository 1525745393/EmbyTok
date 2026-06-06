# CLAUDE.local.md - 本地开发环境 Claude 配置

本文档描述了在 EmbyTok 项目本地开发环境中使用 Claude AI 助手的配置和最佳实践。

## 项目概述

EmbyTok 是一个为 Emby 和 Plex 媒体服务器设计的竖屏视频浏览客户端，提供类似 TikTok 的体验，让用户能够以更现代、便捷的方式浏览个人媒体库。

## 本地开发环境设置

### 1. 系统要求

- Node.js (v14 或更高版本)
- npm 或 yarn
- Git
- 代码编辑器 (推荐 VS Code)
- Android Studio (如需要构建 Android 应用)

### 2. 项目初始化

```bash
# 克隆仓库
git clone <repository-url>
cd embytok

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 本地开发配置

#### Vite 配置

项目使用 Vite 作为构建工具，主要配置文件：

- [vite.config.ts](file:///workspace/vite.config.ts) - 生产环境配置
- [vite.config.local.ts](file:///workspace/vite.config.local.ts) - 本地开发配置

#### TypeScript 配置

- [tsconfig.json](file:///workspace/tsconfig.json) - TypeScript 编译配置

#### 代码格式化和 linting

- [.prettierrc](file:///workspace/.prettierrc) - Prettier 格式化配置
- [.prettierignore](file:///workspace/.prettierignore) - Prettier 忽略文件
- [eslint.config.js](file:///workspace/eslint.config.js) - ESLint 配置 (如有)

### 4. 本地开发工作流

#### 开发模式

```bash
# 启动开发服务器
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动（默认端口）。

#### 构建和测试

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
tsc
```

#### Android 开发

```bash
# 添加 Android 平台
npm run cap:add

# 同步项目到 Android
npm run cap:sync

# 构建 Android 应用
npm run build:android
```

### 5. 项目结构详解

```
/workspace
├── components/              # React 组件目录
│   ├── mobile/             # 移动端专用组件
│   │   └── MobileRoot.tsx
│   ├── standard/           # 标准端组件
│   │   └── StandardRoot.tsx
│   ├── tv/                 # 电视端组件
│   │   ├── TVDashboard.tsx
│   │   ├── TVRoot.tsx
│   │   ├── TVSettings.tsx
│   │   ├── TVVideoGrid.tsx
│   │   └── TVVideoPlayer.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── FavoritesManager.tsx
│   ├── HeartAnimation.tsx
│   ├── LibrarySelect.tsx
│   ├── Login.tsx
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   ├── SubtitleControls.tsx
│   ├── SubtitleRenderer.tsx
│   ├── UpdateNotification.tsx
│   ├── VideoCard.tsx
│   ├── VideoControls.tsx
│   ├── VideoFeed.tsx
│   ├── VideoGrid.tsx
│   ├── VideoInfo.tsx
│   ├── VideoPlayer.tsx
│   ├── VideoSkeleton.tsx
│   └── WatchHistoryView.tsx
├── services/                # 媒体服务客户端
│   ├── EmbyClient.ts       # Emby 服务器客户端
│   ├── MediaClient.ts      # 媒体客户端接口
│   ├── PlexClient.ts       # Plex 服务器客户端
│   ├── clientFactory.ts    # 客户端工厂
│   └── embyService.ts      # Emby 服务
├── src/                     # 源代码目录
│   ├── hooks/              # 自定义 React Hooks
│   │   ├── index.ts
│   │   ├── useConfig.ts
│   │   ├── useDeviceDetection.ts
│   │   ├── useFavorites.ts
│   │   ├── useGestureControls.ts
│   │   ├── useImagePreload.ts
│   │   ├── useLazyImage.ts
│   │   ├── useLibraries.ts
│   │   ├── useLocalStorageState.ts
│   │   ├── useSearch.ts
│   │   ├── useSmartVideoPreload.ts
│   │   ├── useSubtitles.ts
│   │   ├── useTranslation.ts
│   │   ├── useUIState.ts
│   │   ├── useUpdateChecker.ts
│   │   ├── useVideoControls.ts
│   │   ├── useVideoList.ts
│   │   └── useWatchHistory.ts
│   └── locales/            # 国际化文件
│       ├── en.ts
│       ├── index.ts
│       └── zh.ts
├── utils/                   # 工具函数
│   ├── device.ts
│   ├── index.ts
│   ├── media.ts
│   └── time.ts
├── scripts/                 # 构建和工具脚本
│   ├── convert-format.mjs
│   ├── generate-android-banner.mjs
│   ├── generate-android-icons-proper.mjs
│   ├── generate-android-icons-simple.mjs
│   ├── generate-android-icons.mjs
│   ├── generate-banner-from-png.mjs
│   ├── generate-favicon.mjs
│   ├── generate-icons.mjs
│   ├── generate-mobile-icons.mjs
│   ├── generate-multiple-sizes.mjs
│   ├── generate-social-media.mjs
│   ├── generic-logo-scripts.md
│   └── optimize-images.mjs
├── android/                 # Android 平台代码
│   ├── app/
│   │   └── src/
│   │       ├── androidTest/
│   │       ├── main/
│   │       │   ├── java/com/embytok/app/MainActivity.java
│   │       │   └── res/
│   │       └── test/
│   ├── gradle/
│   └── build.gradle
├── public/                  # 静态资源
│   ├── icons/
│   ├── icon.svg
│   └── index.local.html
├── icons/                   # 图标资源
│   ├── banner-template.svg
│   └── icon-192x192.svg
├── tmp/                     # 临时文件和图片
├── App.tsx                  # 应用主组件
├── index.tsx                # 应用入口
├── index.css                # 全局样式
├── tailwind.config.js       # Tailwind CSS 配置
├── postcss.config.js        # PostCSS 配置
├── package.json             # 项目依赖和脚本
├── package-lock.json        # 依赖锁文件
├── types.ts                 # TypeScript 类型定义
├── manifest.json            # PWA 清单文件
├── sw.js                    # Service Worker
├── nginx.conf               # Nginx 配置
├── Dockerfile               # Docker 构建文件
├── Dockerfile.android       # Android Docker 构建文件
├── docker-compose.yml       # Docker Compose 配置
├── docker-compose.synology.yml  # Synology Docker Compose 配置
├── docker-compose.simple.yml    # 简单版 Docker Compose 配置
├── docker-daemon.json       # Docker 守护进程配置
├── capacitor.config.ts      # Capacitor 配置
├── build-android.sh         # Android 构建脚本
├── release.sh               # 发布脚本
├── push-all.ps1             # PowerShell 推送脚本
├── favicon.ico              # 网站图标
├── icon.svg                 # 图标
└── 本地构建指南.md          # 本地构建指南
```

### 6. 关键文件说明

#### 核心入口文件

- [index.tsx](file:///workspace/index.tsx) - React 应用入口
- [App.tsx](file:///workspace/App.tsx) - 应用根组件
- [index.css](file:///workspace/index.css) - 全局样式

#### 配置文件

- [package.json](file:///workspace/package.json) - 项目依赖和脚本
- [tsconfig.json](file:///workspace/tsconfig.json) - TypeScript 配置
- [vite.config.ts](file:///workspace/vite.config.ts) - Vite 构建配置
- [tailwind.config.js](file:///workspace/tailwind.config.js) - Tailwind CSS 配置
- [capacitor.config.ts](file:///workspace/capacitor.config.ts) - Capacitor 配置

### 7. 本地开发最佳实践

#### 代码编辑

1. 使用 VS Code 或其他支持 TypeScript 的编辑器
2. 安装相关插件（ESLint、Prettier、Tailwind CSS IntelliSense 等）
3. 保持代码格式化一致

#### Git 工作流

1. 创建功能分支进行开发
2. 小步提交，保持提交历史清晰
3. 编写有意义的提交信息

#### 调试技巧

1. 使用浏览器开发者工具进行调试
2. 利用 React DevTools 检查组件状态
3. 使用 console.log 或 debugger 语句进行调试

#### 性能优化

1. 使用 React DevTools Profiler 分析渲染性能
2. 检查网络请求和资源加载
3. 验证视频预加载和懒加载效果

### 8. 常见问题解决

#### 依赖安装问题

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

#### 开发服务器问题

```bash
# 停止并重新启动开发服务器
# 检查端口是否被占用
lsof -ti:5173 | xargs kill -9
```

#### TypeScript 错误

1. 检查类型定义是否正确
2. 运行 `tsc` 进行完整类型检查
3. 查看 [types.ts](file:///workspace/types.ts) 了解项目类型定义

### 9. 相关文档

- [README.md](file:///workspace/README.md) - 项目主文档
- [README_CN.md](file:///workspace/README_CN.md) - 中文文档
- [AGENTS.md](file:///workspace/AGENTS.md) - AI 代理角色说明
- [CLAUDE.md](file:///workspace/CLAUDE.md) - Claude 使用说明
- [ANDROID_BUILD.md](file:///workspace/ANDROID_BUILD.md) - Android 构建指南
- [CODE_REVIEW_CHECKLIST.md](file:///workspace/CODE_REVIEW_CHECKLIST.md) - 代码审查清单
- [CODE_REVIEW_PROCESS.md](file:///workspace/CODE_REVIEW_PROCESS.md) - 代码审查流程
- [CODE_REVIEW_STANDARDS.md](file:///workspace/CODE_REVIEW_STANDARDS.md) - 代码审查标准
- [CODE_WIKI.md](file:///workspace/CODE_WIKI.md) - 代码维基
- [SYNOLOGY_DEPLOY.md](file:///workspace/SYNOLOGY_DEPLOY.md) - Synology 部署指南
- [本地构建指南.md](file:///workspace/本地构建指南.md) - 本地构建指南

### 10. 本地开发注意事项

- 所有开发工作应在本地开发环境完成
- 提交前确保代码能正常构建和运行
- 遵循项目的代码规范和最佳实践
- 使用中文进行代码注释和文档编写
- 为关键逻辑添加简明的中文注释
- 代码超过 20 行时考虑适当的抽象和聚合

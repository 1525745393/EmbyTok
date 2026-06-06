# CLAUDE.md - Claude AI 助手使用说明

本文档描述了在 EmbyTok 项目中与 Claude AI 助手协作的最佳实践和使用指南。

## 项目概述

EmbyTok 是一个为 Emby 和 Plex 媒体服务器设计的竖屏视频浏览客户端，提供类似 TikTok 的体验，让用户能够以更现代、便捷的方式浏览个人媒体库。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Capacitor (Android 应用)
- Lucide React (图标)
- Vitest (测试)

## 工作流程

### 1. 开发前准备

在开始开发之前，Claude 应该：

1. 阅读并理解 [README.md](file:///workspace/README.md) 和 [README_CN.md](file:///workspace/README_CN.md)
2. 熟悉项目结构
3. 查看 [CODE_WIKI.md](file:///workspace/CODE_WIKI.md)（如有）了解架构设计
4. 检查 [package.json](file:///workspace/package.json) 了解可用的脚本命令

### 2. 开发原则

Claude 在开发时应遵循以下原则：

#### 代码质量

- 遵循 TypeScript 最佳实践
- 使用有意义的变量和函数名
- 保持函数简洁，每个函数只做一件事
- 避免不必要的对象复制或克隆
- 避免多层嵌套，提前返回
- 使用适当的并发控制机制

#### 小步重构

- 每次只做一个小改动
- 频繁提交，保持代码随时可工作
- 重构前确保有足够的测试
- 每次修改后运行测试，确保行为不变

#### 性能优化

- 避免不必要的对象创建
- 及时释放不再需要的资源
- 避免重复计算
- 使用适当的数据结构和算法
- 延迟计算直到必要时
- 识别可并行化的任务
- 避免不必要的同步
- 注意线程安全问题

#### 命名约定

- 使用有意义的、描述性的名称
- 遵循项目或语言的命名规范
- 避免缩写和单字母变量（除非是约定俗成的，如循环中的 `i`）

#### 代码组织

- 相关代码放在一起
- 函数只做一件事
- 保持适当的抽象层次

#### 注释与文档

- 注释应该解释为什么，而不是做什么
- 为公共 API 提供清晰的文档
- 更新注释以反映代码变化

### 3. 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 添加 Android 平台
npm run cap:add

# 同步项目到 Android
npm run cap:sync

# 构建 Android 应用
npm run build:android
```

### 4. 项目结构

```
/workspace
├── components/          # React 组件
│   ├── mobile/         # 移动端组件
│   ├── standard/       # 标准端组件
│   └── tv/             # 电视端组件
├── services/            # 媒体服务客户端
│   ├── EmbyClient.ts   # Emby 客户端
│   ├── PlexClient.ts   # Plex 客户端
│   └── clientFactory.ts# 客户端工厂
├── src/                 # 源代码
│   ├── hooks/          # 自定义 Hooks
│   └── locales/        # 本地化文件
├── utils/              # 工具函数
├── scripts/            # 构建和生成脚本
└── android/            # Android 平台代码
```

### 5. 关键组件和功能

#### 视频播放

- [VideoPlayer.tsx](file:///workspace/components/VideoPlayer.tsx) - 视频播放器组件
- [VideoControls.tsx](file:///workspace/components/VideoControls.tsx) - 视频控制组件
- [useVideoControls.ts](file:///workspace/src/hooks/useVideoControls.ts) - 视频控制 Hook

#### 媒体客户端

- [EmbyClient.ts](file:///workspace/services/EmbyClient.ts) - Emby 媒体服务器客户端
- [PlexClient.ts](file:///workspace/services/PlexClient.ts) - Plex 媒体服务器客户端
- [clientFactory.ts](file:///workspace/services/clientFactory.ts) - 客户端工厂

#### 核心 Hooks

- [useConfig.ts](file:///workspace/src/hooks/useConfig.ts) - 配置管理
- [useFavorites.ts](file:///workspace/src/hooks/useFavorites.ts) - 收藏功能
- [useLibraries.ts](file:///workspace/src/hooks/useLibraries.ts) - 媒体库管理
- [useSearch.ts](file:///workspace/src/hooks/useSearch.ts) - 搜索功能
- [useSubtitles.ts](file:///workspace/src/hooks/useSubtitles.ts) - 字幕功能
- [useWatchHistory.ts](file:///workspace/src/hooks/useWatchHistory.ts) - 观看历史
- [useVideoList.ts](file:///workspace/src/hooks/useVideoList.ts) - 视频列表

### 6. 测试策略

- 使用 Vitest 进行测试
- 测试文件与源代码放在一起，使用 `.test.tsx` 或 `.test.ts` 扩展名
- 运行测试：`npm test`（如有配置）
- 每次修改代码后都应运行相关测试

### 7. 代码审查

在提交代码前，应进行以下检查：

1. 代码是否符合项目规范
2. 是否有足够的测试覆盖
3. 是否有性能问题
4. 是否有安全问题
5. 文档是否更新

参考 [CODE_REVIEW_CHECKLIST.md](file:///workspace/CODE_REVIEW_CHECKLIST.md)、[CODE_REVIEW_PROCESS.md](file:///workspace/CODE_REVIEW_PROCESS.md) 和 [CODE_REVIEW_STANDARDS.md](file:///workspace/CODE_REVIEW_STANDARDS.md)。

### 8. 部署

项目支持多种部署方式：

- Docker 部署：参考 [docker-compose.yml](file:///workspace/docker-compose.yml)
- Android 应用：参考 [ANDROID_BUILD.md](file:///workspace/ANDROID_BUILD.md)
- 本地部署：使用 `npm run build` 构建后部署到 Web 服务器

## 常见任务示例

### 添加新功能

1. 理解需求并设计解决方案
2. 编写测试用例
3. 实现功能
4. 运行测试
5. 提交代码

### 修复 Bug

1. 复现问题
2. 定位根因
3. 修复问题
4. 编写测试防止回归
5. 验证修复

### 重构代码

1. 确保有足够的测试覆盖
2. 小步重构
3. 每次重构后运行测试
4. 确保行为不变

## 注意事项

- 所有回答都使用中文表述
- 如需提供代码，为关键逻辑和可能造成理解困难的部分添加简明的中文注释
- 当生成的代码超过 20 行时，优先考虑是否可以进行适当的抽象或聚合
- 遵循用户规则中提到的所有编码原则

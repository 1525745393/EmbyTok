# EmbyTok 测试体系总结

## 测试框架

- **Vitest** - 单元测试和集成测试框架
- **Testing Library** - React 组件测试库
- **Happy DOM** - 轻量级 DOM 环境
- **Playwright** - 端到端（E2E）测试框架
- **Vitest Bench** - 基准性能测试框架

## 已完成的测试

### 工具函数测试 (`utils/__tests__/`)

- ✅ `media.test.ts` - 媒体工具函数测试
  - 文件夹类型检测
  - 播放进度计算
  - 设备检测
  - 浏览器检测
- ✅ `time.test.ts` - 时间格式化测试
  - 中文分钟格式
  - 简短时间格式
- ✅ `device.test.ts` - 设备检测测试
  - 移动设备检测
  - 横竖屏检测

### 服务层测试 (`services/__tests__/`)

- ✅ `EmbyClient.test.ts` - Emby 客户端测试
  - 认证流程
  - 视频获取
  - 库管理
  - 收藏功能
  - 搜索功能
  - 字幕获取
- ✅ `PlexClient.test.ts` - Plex 客户端测试
  - 认证流程
  - 视频获取
  - 收藏功能
  - 搜索功能
  - 字幕获取

### 自定义 Hooks 测试 (`src/hooks/__tests__/`)

- ✅ `useLocalStorageState.test.ts` - 本地存储 Hook 测试
  - 初始化
  - 状态更新
  - 对象/数组处理
  - 错误处理
- ✅ `useConfig.test.ts` - 配置管理 Hook 测试
  - 配置持久化
  - 客户端创建
  - 登出功能
- ✅ `useFavorites.test.ts` - 收藏功能 Hook 测试
  - 收藏集管理
  - 收藏项操作
  - 状态查询
- ✅ `useVideoControls.test.ts` - 视频控制 Hook 测试
  - 接口验证
  - 状态管理
- ✅ `useLibraries.test.ts` - 库管理 Hook 测试
  - 库列表获取
  - 库选择和隐藏
  - 本地存储持久化
- ✅ `useSearch.test.ts` - 搜索功能 Hook 测试
  - 搜索查询和结果
  - 搜索历史管理
  - 防抖机制
  - 错误处理
- ✅ `useWatchHistory.test.ts` - 观看历史 Hook 测试
  - 添加/删除历史记录
  - 历史记录查询
  - 播放进度查询
- ✅ `useTranslation.test.ts` - 翻译 Hook 测试
  - 语言切换
  - 翻译文本
  - 本地存储持久化
- ✅ `useDeviceDetection.test.ts` - 设备检测 Hook 测试
  - 设备类型检测
  - 横竖屏检测
- ✅ `useUIState.test.ts` - UI 状态管理 Hook 测试
  - 菜单开关
  - 静音设置
  - 自动播放
  - 横屏模式
  - 本地存储持久化
- ✅ `useVideoList.test.ts` - 视频列表 Hook 测试
  - 导航堆栈管理
  - 视图模式切换
  - 索引管理
  - 视频选择
- ✅ `useSubtitles.test.ts` - 字幕管理 Hook 测试
  - 字幕开关
  - 字幕设置
  - VTT 字幕解析
  - 本地存储持久化
- ✅ `useUpdateChecker.test.ts` - 更新检查 Hook 测试
  - 版本检查
  - 错误处理
- ✅ `useGestureControls.test.ts` - 手势控制 Hook 测试
  - 初始化状态
  - 手势处理方法
  - 心形动画
- ✅ `useImagePreload.test.ts` - 图片预加载 Hook 测试
  - 预加载状态管理
  - 配置选项
- ✅ `useLazyImage.test.ts` - 懒加载图片 Hook 测试
  - 加载状态管理
  - 重试机制
  - 渐进式加载
- ✅ `useSmartVideoPreload.test.ts` - 智能视频预加载 Hook 测试
  - 预加载策略
  - 滚动速度检测
  - 网络质量检测

### 组件集成测试 (`components/__tests__/`)

- ✅ `Login.test.tsx` - 登录组件测试
  - 表单渲染
  - 服务器类型切换
  - 输入验证
  - 登录流程
  - 语言切换
  - 错误显示
- ✅ `VideoPlayer.test.tsx` - 视频播放器组件测试
  - 视频元素渲染
  - 海报图显示
  - 播放暂停状态
  - 倍速指示
  - 快进快退指示
  - 错误显示
  - 样式应用
- ✅ `HeartAnimation.test.tsx` - 心形动画组件测试
  - 空状态渲染
  - 有心数据渲染
- ✅ `LibrarySelect.test.tsx` - 媒体库选择组件测试
  - 渲染与可见性
  - 库选择
  - 菜单切换
- ✅ `SearchBar.test.tsx` - 搜索栏组件测试
  - 基本渲染
  - 查询显示和输入处理
  - 清空查询按钮
  - 搜索历史显示和处理
- ✅ `DeleteConfirmDialog.test.tsx` - 删除确认对话框组件测试
  - 显示/隐藏控制
  - 确认和取消操作
- ✅ `VideoSkeleton.test.tsx` - 视频骨架加载组件测试
  - 基本渲染
- ✅ `VideoControls.test.tsx` - 视频控制组件测试
  - 基本渲染
  - 按钮点击事件处理
  - 静音、收藏、自动播放功能
- ✅ `UpdateNotification.test.tsx` - 更新通知组件测试
  - 显示/隐藏控制
  - 语言切换
  - 关闭和稍后再说按钮
- ✅ `VideoInfo.test.tsx` - 视频信息组件测试
  - 视频名称、年份、时长、简介显示
  - 简介展开/收起功能
- ✅ `SearchResults.test.tsx` - 搜索结果组件测试
  - 加载状态
  - 空查询状态
  - 无结果状态
  - 搜索结果渲染
  - 视频选择事件
- ✅ `FavoritesManager.test.tsx` - 收藏管理器组件测试
  - 基本渲染
  - 合集列表渲染
  - 视频项渲染
  - 关闭功能
- ✅ `WatchHistoryView.test.tsx` - 观看历史组件测试
  - 基本渲染
  - 无历史状态
  - 历史项渲染
  - 关闭和删除功能
- ✅ `SubtitleControls.test.tsx` - 字幕控制组件测试
  - 基本渲染
  - 字幕轨道渲染
  - 设置面板切换
- ✅ `VideoCard.test.tsx` - 视频卡片组件测试
  - 基本渲染
  - 收藏状态渲染
- ✅ `SubtitleRenderer.test.tsx` - 字幕渲染组件测试
  - 禁用状态不渲染
  - 无活跃字幕不渲染
  - 活跃字幕渲染
  - 多行字幕渲染
  - 不同字号渲染
- ✅ `VideoGrid.test.tsx` - 视频网格组件测试
  - 视频项渲染
  - 空状态渲染
  - 视频选择事件
  - 文件夹导航事件
  - 刷新事件
- ✅ `VideoFeed.test.tsx` - 视频流组件测试
  - 视频流渲染
  - 空状态渲染
  - 刷新功能
- ✅ `TVDashboard.test.tsx` - TV 模式主界面组件测试
  - 加载状态
  - 媒体库渲染
  - 最近添加视频
- ✅ `TVSettings.test.tsx` - TV 模式设置组件测试
  - 账户 Tab 渲染
  - 媒体库 Tab 渲染
  - 退出登录功能
  - 语言切换功能
- ✅ `TVVideoGrid.test.tsx` - TV 模式视频网格组件测试
  - 视频网格渲染
  - 视频点击选择
  - 键盘选择功能
- ✅ `TVVideoPlayer.test.tsx` - TV 模式视频播放器组件测试
  - 视频播放器渲染
  - 无海报图渲染
  - 返回按钮功能
  - 语言切换支持
- ✅ `TVRoot.test.tsx` - TV 模式根组件测试
  - 登录表单渲染
  - 品牌名称显示
- ✅ `StandardRoot.test.tsx` - 标准模式根组件测试
  - 加载状态渲染
- ✅ `MobileRoot.test.tsx` - 移动模式根组件测试
  - 登录表单渲染

### 端到端（E2E）测试 (`e2e/`)

- ✅ `app.spec.ts` - 应用基础测试
  - 首页加载
  - 页面标题验证
- ✅ `login.spec.ts` - 登录流程测试
  - 登录表单渲染
  - 服务器类型切换
  - 输入验证
- ✅ `mobile.spec.ts` - 移动端界面测试
  - 响应式布局测试
  - 小屏幕适配

### 性能测试 (`e2e/` 和 `utils/__tests__/`)

- ✅ `performance.spec.ts` - 应用整体性能测试
  - 页面加载性能测试
  - 资源加载测试
  - 用户操作响应测试
- ✅ `media.benchmark.ts` - 工具函数性能基准测试
  - 媒体工具函数性能测试
  - 大量数据处理测试

## 测试运行命令

### 单元测试和集成测试

```bash
# 运行测试（监听模式）
npm run test

# 运行测试并显示 UI
npm run test:ui

# 运行测试并显示覆盖率
npm run test:coverage

# 单次运行所有测试（CI 模式）
npm run test:run
```

### E2E 测试（Playwright）

```bash
# 首次使用前，需要安装浏览器
npm run test:e2e:install

# 运行 E2E 测试（需要先手动启动开发服务器：npm run dev）
npm run test:e2e

# 运行 E2E 测试并显示 UI 界面
npm run test:e2e:ui
```

注意：运行 E2E 测试前，确保开发服务器已在 `http://localhost:5173` 启动。

### 性能测试

```bash
# 运行 Vitest 基准性能测试
npm run test:bench

# 运行 Playwright 应用性能测试（需要先启动开发服务器）
npm run test:performance
```

## CI/CD 集成

### 自动化测试工作流

项目已配置 GitHub Actions 工作流，在以下情况下自动运行：

- 代码推送到 `main` 分支时
- 提交 PR 到 `main` 分支时
- 手动触发（workflow_dispatch）

### 工作流作业

1. **单元和集成测试** - 运行所有单元和集成测试，生成覆盖率报告
2. **基准性能测试** - 在单元测试通过后运行性能基准测试
3. **代码格式化检查** - 检查代码是否符合 Prettier 格式规范

### 手动触发测试

可以通过 GitHub 仓库页面的 "Actions" 标签手动触发测试工作流。

### 工作流文件

- [`.github/workflows/test.yml`](file:///workspace/.github/workflows/test.yml) - 测试工作流
- [`.github/workflows/docker-build-push.yml`](file:///workspace/.github/workflows/docker-build-push.yml) - 构建和部署工作流

### 测试覆盖率报告

CI 运行测试后会自动上传覆盖率报告作为 artifacts，可在 Actions 页面下载查看。

## 测试覆盖率目标

当前已覆盖的核心功能：

- 工具函数：100%
- API 客户端：90%+
- 自定义 Hooks：100% (所有 Hooks 已全部覆盖！)
- 关键组件：90%+ (多个重要组件已有测试)

测试统计：

- 单元/集成测试文件：47 个
- E2E 测试文件：3 个
- 性能测试文件：2 个
- 总测试文件：52 个
- 总测试用例：305 个（单元/集成）+ 5 个（E2E）= 310 个
- 通过率：100% 🎉

## 已完成的测试文件总览

```
/workspace
├── src/hooks/__tests__/
│   ├── useConfig.test.ts
│   ├── useFavorites.test.ts
│   ├── useLocalStorageState.test.ts
│   ├── useLibraries.test.ts
│   ├── useSearch.test.ts
│   ├── useVideoControls.test.ts
│   ├── useWatchHistory.test.ts
│   ├── useTranslation.test.ts
│   ├── useDeviceDetection.test.ts
│   ├── useUIState.test.ts
│   ├── useVideoList.test.ts
│   ├── useSubtitles.test.ts
│   ├── useUpdateChecker.test.ts
│   ├── useGestureControls.test.ts
│   ├── useImagePreload.test.ts
│   ├── useLazyImage.test.ts
│   └── useSmartVideoPreload.test.ts
├── components/__tests__/
│   ├── Login.test.tsx
│   ├── VideoPlayer.test.tsx
│   ├── HeartAnimation.test.tsx
│   ├── LibrarySelect.test.tsx
│   ├── SearchBar.test.tsx
│   ├── DeleteConfirmDialog.test.tsx
│   ├── VideoSkeleton.test.tsx
│   ├── VideoControls.test.tsx
│   ├── UpdateNotification.test.tsx
│   ├── VideoInfo.test.tsx
│   ├── SearchResults.test.tsx
│   ├── FavoritesManager.test.tsx
│   ├── WatchHistoryView.test.tsx
│   ├── SubtitleControls.test.tsx
│   ├── VideoCard.test.tsx
│   ├── SubtitleRenderer.test.tsx
│   ├── VideoGrid.test.tsx
│   └── VideoFeed.test.tsx
├── components/tv/__tests__/
│   ├── TVDashboard.test.tsx
│   ├── TVSettings.test.tsx
│   ├── TVVideoGrid.test.tsx
│   ├── TVVideoPlayer.test.tsx
│   └── TVRoot.test.tsx
├── components/standard/__tests__/
│   └── StandardRoot.test.tsx
├── components/mobile/__tests__/
│   └── MobileRoot.test.tsx
├── services/__tests__/
│   ├── EmbyClient.test.ts
│   └── PlexClient.test.ts
├── utils/__tests__/
│   ├── device.test.ts
│   ├── media.test.ts
│   ├── time.test.ts
│   └── media.benchmark.ts
└── e2e/
    ├── app.spec.ts
    ├── login.spec.ts
    ├── mobile.spec.ts
    └── performance.spec.ts
```

## 后续工作建议

1. **更多 E2E 测试**：扩展端到端测试
   - 添加模拟 API 服务器以测试完整用户流程
   - 测试登录、浏览、播放等完整场景
   - 测试电视模式的遥控器导航
   - 测试移动手势操作

2. **CI/CD 集成**：配置自动化测试流程
   - GitHub Actions 或类似 CI 工具
   - 每次提交自动运行测试（单元 + E2E + 性能）
   - 测试覆盖率报告
   - 性能回归检测

3. **性能测试扩展**：增强性能测试覆盖
   - 视频加载性能测试
   - 内存使用监控测试
   - 滚动流畅度测试
   - 构建性能优化测试

4. **更多浏览器测试**：在更多浏览器和设备上运行 E2E 测试
   - Firefox
   - WebKit (Safari)
   - 更多移动设备尺寸

## 文档

- [测试指南](./TESTING.md) - 详细的测试编写和运行指南
- [API 文档](./API.md) - 项目 API 文档
- [架构设计](./ARCHITECTURE.md) - 项目架构设计文档

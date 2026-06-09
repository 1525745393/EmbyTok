# Changelog
## [1.10.20] - 2026-06-09

### Removed
- 移除横屏视频底部的"全屏观看"按钮功能

### Fixed
- 修复因全屏按钮导致的不必要 UI 元素加载
- 简化横屏视频显示逻辑，与竖屏视频保持一致的播放体验

## [1.10.19] - 2026-06-07

### Added
- **横屏视频全屏观看功能**：在横屏视频底部居中显示仿抖音风格的"全屏观看"按钮，点击后自动进入全屏并锁定横屏方向
- **搜索功能分页加载**：支持分页显示搜索结果，每页20条，滚动到底部自动加载更多
- **搜索结果按类型分类**：搜索结果按电影、剧集、单集、视频、音乐、其他分类显示
- **单个搜索历史项删除**：可以单独删除某个搜索历史记录，而无需清空所有历史
- 新增 "watchFullscreen" 翻译文案支持中英文

### Changed
- 优化 useSearch Hook：添加 loadingMore、hasMore 状态管理，支持分页加载
- 重构 SearchResults 组件：实现分类显示和无限滚动加载
- 改进 SearchBar 组件：添加单个历史项删除按钮和 hover 效果
- 在 types.ts 中为 EmbyItem 添加 SeriesName 可选属性

### Deprecated

### Removed

### Fixed
- 修复 SearchResults 组件的类型问题
- 修复 StandardRoot 中变量名冲突问题
- 修复 VideoCard 组件全屏功能的错误处理

### Security


## [1.10.18] - 2026-06-07

### Fixed
- **修复设备 ID 每次刷新重新生成的问题**：创建设备 ID 管理工具，使用 localStorage 持久化保存设备 ID
- **修复 MobileRoot 和 TVRoot 硬编码版本号问题**：统一从环境变量读取真实版本号
- 优化视频播放控制性能，避免频繁状态更新

### Changed
- 重构设备 ID 管理：创建 utils/device.ts 共享工具函数
- 统一 EmbyClient 和 embyService 使用相同的设备 ID 源
- 添加对 localStorage 不可用情况的错误处理

## [1.10.17] - 2026-06-07

### Fixed
- 修复长按触发加速播放后，上下滑动调整速度不能固定的问题
- 区分临时加速和用户固定速度模式
- **修复 .ts 格式视频不能播放的问题**：自动检测 .ts 容器并使用转码模式

### Changed
- 增加播放速度档位：从6档扩展为11档
- 新增速度选项：0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 1.75x, 2.0x, 2.5x, 3.0x, 4.0x, 5.0x

## [1.10.16] - 2026-06-07

### Added
- 新增三种视频播放模式：直接播放、转码播放、备用模式
- 添加播放模式切换按钮和菜单
- 支持自动降级：当直接播放失败时自动尝试转码，再失败则使用备用模式

### Changed
- 改进EmbyClient.ts的视频URL生成逻辑，支持多种播放策略

### Fixed
- 解决部分视频无法播放的问题

### Security

## [1.10.15] - 2026-06-07

### Added

### Changed

### Deprecated

### Removed

### Fixed
- 修复GitHub Actions中Android keystore解码失败导致整个构建失败的问题
- 让Android签名变成可选的，即使签名失败也能构建Debug版本

### Security

## [1.10.14] - 2026-06-07

### Added

### Changed
- 将 CHANGELOG.md 添加到 .prettierignore，避免格式检查导致 CI 失败

### Deprecated

### Removed

### Fixed
- 修复 CHANGELOG.md 格式导致的 CI lint 检查失败问题

### Security


## [1.10.12] - 2026-06-07

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.10.11] - 2026-06-07

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

所有重要的项目变更都会记录在此文件中。

本格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.10.10] - 2026-06-07

### Added

- 新增 create-release 任务统一管理 Release 创建
- 新增诊断报告文档

### Fixed

- 修复 GitHub Actions 工作流中 Release 创建冲突问题
- 修复矩阵构建中多任务同时尝试创建 Release 的冲突
- 使用官方的 softprops/action-gh-release 替代 svenstaro/upload-release-action

## [1.10.9] - 2026-06-07

### Added

- 生成 AGENTS.md、CLAUDE.md 和 CLAUDE.local.md 文档
- 完整的发布流程配置验证系统
- 发布助手功能，引导用户完成完整发布流程

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.10.8] - 2026-06-06

### Added

- 完整的自动化发布流程
- 版本管理工具（支持 patch/minor/major 升级）
- CHANGELOG 提取工具
- 发布前检查工具
- GitHub Actions 工作流

### Changed

- 优化工作流：测试通过后才执行构建和发布
- 防重复发布：自动检查标签是否存在
- 灵活配置：可选择是否创建 Release、推送 Docker、构建 APK
- 多平台支持：Docker 镜像支持 linux/amd64 和 linux/arm64
- Android 签名支持：同时提供 Debug 和 Release 版本的 APK

# Changelog

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

## [1.10.7] - 2026-06-06

## [1.10.6] - 2026-06-06

## [1.10.5] - 2026-06-06

## [1.10.4] - 2026-06-06

## [1.10.3] - 2026-06-06

## [1.10.2] - 2026-06-06

## [1.10.1] - 2026-06-06

### Added
- 完整的自动化发布流程
- 版本管理工具：自动管理版本号，支持 patch/minor/major 升级
- CHANGELOG 提取工具：自动从 CHANGELOG 提取发布说明
- 发布前检查工具：全面的质量检查
- GitHub Actions 工作流：完整的 CI/CD 流程

### Changed
- 工作流优化：测试通过后才执行构建和发布
- 防重复发布：自动检查标签是否存在
- 灵活配置：可选择是否创建 Release、推送 Docker、构建 APK
- 多平台支持：Docker 镜像支持 linux/amd64 和 linux/arm64
- Android 签名支持：同时提供 Debug 和 Release 版本的 APK

## [1.10.0] - 2026-06-06

### Added
- 完整测试体系建设（单元测试、组件集成测试、E2E 端到端测试、性能基准测试）
- CI/CD 自动化集成（GitHub Actions 工作流）
- 项目质量与工程化（测试覆盖统计、代码质量保障、性能监控）

### Changed
- 测试框架升级：Vitest 配置优化、Playwright 端到端测试集成、性能基准测试集成
- 项目结构优化：测试文件统一组织、E2E 测试独立目录、基准测试文件集中管理
- 文档完善：更新 TESTING_SUMMARY.md 完整测试总结、添加 CI/CD 使用说明

## [1.9.5] - 2026-06-05

### Changed
- 关于页面全面升级：全新视觉设计，添加应用 Logo 区域
- 功能特性展示采用图标+文字的卡片形式
- 新增一键复制版本号功能
- 添加技术栈标签展示
- 快速链接区域（GitHub 项目和赞助）
- 优化页脚版权信息展示

## [1.9.4] - 2026-06-05

### Added
- 自动检查更新：集成 GitHub Releases API 获取最新版本
- 版本号自动比较和检测更新
- 友好的更新通知对话框
- 显示更新内容（Changelog）
- APK 下载链接自动提取和跳转
- 支持中英文双语界面

## [1.9.3] - 2026-06-05

### Fixed
- Android 签名配置：生成固定签名密钥文件 embytok-release.keystore
- 配置 Gradle 自动签名，避免安装签名不兼容问题
- 添加 build-android.sh 自动化构建脚本

## [1.9.2] - 2026-06-05

### Added
- 播放历史：完整的观看历史记录管理、自动记录播放进度和时间戳
- 搜索功能：实时视频搜索（防抖 300ms）、搜索历史记录
- 收藏分类管理：创建多个收藏合集、重命名和删除合集
- 字幕支持：字幕开关控制、字幕轨道选择、字幕样式自定义

## [1.9.1] - 2026-06-05

### Fixed
- 搜索功能：正确集成 useSearch Hook
- 字幕支持：完善字幕轨道获取和渲染
- 收藏分类：正确集成 useFavorites Hook
- 播放历史：完善组件传递链

## [1.9.0] - 2026-06-05

### Added
- 播放历史：完整的观看历史记录管理
- 搜索功能：实时视频搜索（防抖 300ms）
- 收藏分类管理：创建多个收藏合集
- 字幕支持：字幕开关控制、字幕轨道选择、字幕样式自定义

## [1.8.0] - 2026-06-05

### Added
- 智能视频预加载策略
- 图片加载优化（响应式图片加载、渐进式图片加载、图片懒加载）
- 虚拟滚动优化升级

### Changed
- React组件性能优化（React.memo、useMemo/useCallback）
- 构建优化（代码分割、依赖分包、生产环境深度压缩）

## [1.6.3] - 2026-06-05

### Added
- 完善进度条拖动快进功能
- 支持触摸拖动和鼠标拖动
- 实时更新视频播放位置

## [1.6.2] - 2026-06-05

### Changed
- 进度条显示/隐藏优化：默认隐藏进度条，播放时双击显示
- 5秒无操作自动隐藏
- 与用户交互时重置隐藏计时器

## [1.6.1] - 2026-06-05

### Fixed
- Android登录问题修复：添加网络安全配置支持HTTP明文流量
- 支持自签名SSL证书
- 修复Android应用无法连接服务器问题

## [1.6.0] - 2026-06-04

### Added
- 记忆播放进度：自动保存视频播放进度到localStorage
- 播放失败重试机制：最多自动重试3次
- 更好的错误提示：网络错误提示、文件不存在提示
- 播放速度调节：支持0.5x-5.0x倍速调节

## [1.5.0]

### Added
- 基础TikTok式浏览体验
- 视频卡片组件优化
- 手势交互增强
- 骨架屏集成

## [1.0.0]

### Added
- 初始版本
- Emby/Jellyfin服务器连接
- 基础视频播放功能

[Unreleased]: https://github.com/1525745393/EmbyTok/compare/v1.10.8...HEAD
[1.10.8]: https://github.com/1525745393/EmbyTok/compare/v1.10.7...v1.10.8
[1.10.7]: https://github.com/1525745393/EmbyTok/compare/v1.10.6...v1.10.7
[1.10.6]: https://github.com/1525745393/EmbyTok/compare/v1.10.5...v1.10.6
[1.10.5]: https://github.com/1525745393/EmbyTok/compare/v1.10.4...v1.10.5
[1.10.4]: https://github.com/1525745393/EmbyTok/compare/v1.10.3...v1.10.4
[1.10.3]: https://github.com/1525745393/EmbyTok/compare/v1.10.2...v1.10.3
[1.10.2]: https://github.com/1525745393/EmbyTok/compare/v1.10.1...v1.10.2
[1.10.1]: https://github.com/1525745393/EmbyTok/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/1525745393/EmbyTok/compare/v1.9.5...v1.10.0
[1.9.5]: https://github.com/1525745393/EmbyTok/compare/v1.9.4...v1.9.5
[1.9.4]: https://github.com/1525745393/EmbyTok/compare/v1.9.3...v1.9.4
[1.9.3]: https://github.com/1525745393/EmbyTok/compare/v1.9.2...v1.9.3
[1.9.2]: https://github.com/1525745393/EmbyTok/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/1525745393/EmbyTok/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/1525745393/EmbyTok/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/1525745393/EmbyTok/compare/v1.6.3...v1.8.0
[1.6.3]: https://github.com/1525745393/EmbyTok/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/1525745393/EmbyTok/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/1525745393/EmbyTok/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/1525745393/EmbyTok/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/1525745393/EmbyTok/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/1525745393/EmbyTok/releases/tag/v1.0.0

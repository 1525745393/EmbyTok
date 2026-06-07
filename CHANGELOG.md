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

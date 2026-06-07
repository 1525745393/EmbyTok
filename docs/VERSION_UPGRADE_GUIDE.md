# 版本升级步骤指南

本指南详细介绍如何进行 EmbyTok 项目的版本升级。

## 目录

- [前置条件](#前置条件)
- [版本号规则](#版本号规则)
- [升级步骤](#升级步骤)
- [发布前检查](#发布前检查)
- [常见问题](#常见问题)

## 前置条件

在开始版本升级前，请确保：

1. 你在 `main` 分支上
2. 工作区是干净的（没有未提交的变更）
3. 你已从远程仓库拉取最新代码
4. 所有测试通过

```bash
# 检查当前分支
git branch

# 切换到 main 分支（如果需要）
git checkout main

# 拉取最新代码
git pull origin main

# 运行测试
npm run test:run
```

## 版本号规则

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 2.0.0 规范：

- **MAJOR（主版本号）**：不兼容的 API 变更
- **MINOR（次版本号）**：向下兼容的功能性新增
- **PATCH（修订号）**：向下兼容的问题修正

### 版本号格式

```
MAJOR.MINOR.PATCH[-PRE_RELEASE][+BUILD]
```

示例：

- `1.10.8` - 正式发布版本
- `1.11.0-beta.1` - 测试版
- `1.11.0-rc.1` - 候选发布版

## 升级步骤

### 1. 确定升级类型

根据变更内容确定升级类型：

| 变更类型     | 命令                    | 版本示例        |
| ------------ | ----------------------- | --------------- |
| 仅修复 bug   | `npm run version:patch` | 1.10.8 → 1.10.9 |
| 新增功能     | `npm run version:minor` | 1.10.8 → 1.11.0 |
| 不兼容的变更 | `npm run version:major` | 1.10.8 → 2.0.0  |

### 2. 执行版本升级

#### 方式一：使用 npm 脚本（推荐）

```bash
# 补丁版本升级（修复 bug）
npm run version:patch

# 次版本升级（新增功能）
npm run version:minor

# 主版本升级（不兼容变更）
npm run version:major
```

#### 方式二：手动设置版本号

```bash
# 设置特定版本号
npm run version:set 1.11.0
```

#### 方式三：使用脚本直接调用

```bash
# 查看当前版本
node scripts/version-manager.js current

# 升级版本
node scripts/version-manager.js bump patch
node scripts/version-manager.js bump minor
node scripts/version-manager.js bump major

# 设置特定版本
node scripts/version-manager.js set 1.11.0
```

### 3. 更新 CHANGELOG.md

版本升级脚本会自动在 CHANGELOG.md 中生成新版本条目，但你需要手动填写变更内容：

1. 打开 `CHANGELOG.md`
2. 找到最新版本的条目（应该在文件顶部，Unreleased 之后）
3. 填写相应类别的变更内容：
   - `Added` - 新增的功能
   - `Changed` - 功能的变更
   - `Deprecated` - 即将废弃的功能
   - `Removed` - 已删除的功能
   - `Fixed` - 修复的 bug
   - `Security` - 安全相关的修复

示例：

```markdown
## [1.11.0] - 2026-06-06

### Added

- 新增 AI 推荐功能
- 支持更多字幕格式

### Changed

- 优化视频加载性能

### Fixed

- 修复 Android 12 兼容性问题
```

### 4. 运行发布前检查

```bash
npm run release:check
```

此命令会检查：

- 版本号格式是否正确
- CHANGELOG.md 是否已更新
- Git 工作区状态
- TypeScript 类型检查
- 单元测试
- 项目构建

### 5. 提交变更

```bash
# 添加变更的文件
git add package.json CHANGELOG.md

# 提交（使用符合规范的提交信息）
git commit -m "chore: bump version to v1.11.0"
```

### 6. 创建 Git 标签

```bash
# 创建标签（推荐使用带注释的标签）
git tag -a v1.11.0 -m "Release version 1.11.0"

# 或者使用轻量级标签
git tag v1.11.0
```

### 7. 推送到远程仓库

```bash
# 推送代码
git push origin main

# 推送标签
git push origin v1.11.0
```

推送标签后，GitHub Actions 会自动触发发布流程。

### 8. （可选）手动触发发布

如果需要手动触发发布：

1. 访问仓库的 Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow"
4. 输入版本号和其他选项
5. 点击 "Run workflow" 按钮

## 预发布版本

### 创建预发布版本

```bash
# 使用脚本升级为预发布版本
node scripts/version-manager.js bump pre

# 或者手动设置
npm run version:set 1.11.0-beta.1
```

### 预发布版本标签格式

- `1.11.0-beta.1` - Beta 测试版
- `1.11.0-rc.1` - 候选发布版（Release Candidate）

## 发布前检查

在发布前，请确保检查以下项目：

- [ ] 所有测试通过
- [ ] 代码已格式化（`npx prettier --write .`）
- [ ] CHANGELOG.md 已更新
- [ ] 版本号已正确升级
- [ ] 没有未提交的变更
- [ ] 已从远程拉取最新代码
- [ ] 本地构建成功
- [ ] Android APK 能正常构建（如果适用）
- [ ] Docker 镜像能正常构建（如果适用）

## 回滚版本

如果需要回滚到上一个版本：

```bash
# 删除本地标签
git tag -d v1.11.0

# 删除远程标签
git push origin --delete v1.11.0

# 回滚提交
git reset --hard HEAD~1

# 强制推送到远程（谨慎使用！）
git push origin main --force
```

**注意**：如果版本已经发布且用户已下载，不建议回滚，而是应该发布一个新的修复版本。

## 常见问题

### Q: 我可以跳过某个版本号吗？

A: 可以，但不建议。保持连续的版本号有助于追踪变更历史。

### Q: 如何处理紧急修复？

A: 创建一个 hotfix 分支，从之前的标签切出，修复后发布一个 patch 版本。

### Q: 预发布版本会自动发布吗？

A: 会的，只要标签格式正确，GitHub Actions 会自动构建并发布。但会标记为 Pre-release。

### Q: 我需要更新哪些文件？

A: 通常只需要：

- `package.json`（自动更新）
- `CHANGELOG.md`（需要手动填写内容）

### Q: 如何查看当前版本？

A:

```bash
npm run version:current
# 或
node scripts/version-manager.js current
```

## 相关文档

- [Git 提交信息规范](./GIT_COMMIT_GUIDE.md)
- [发布前检查清单](./RELEASE_CHECKLIST.md)
- [CHANGELOG](../CHANGELOG.md)
- [版本管理模块](../src/version.js)

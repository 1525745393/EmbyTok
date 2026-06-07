# Git 提交信息规范

本规范基于 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)，旨在提供更清晰的提交历史，便于自动化工具处理。

## 目录

- [提交信息格式](#提交信息格式)
- [类型说明](#类型说明)
- [作用域](#作用域)
- [示例](#示例)
- [常见问题](#常见问题)

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 格式说明

1. **type**（必需）：提交类型
2. **scope**（可选）：影响范围
3. **subject**（必需）：简短描述（不超过 50 字符）
4. **body**（可选）：详细描述
5. **footer**（可选）：关联 issue 或 BREAKING CHANGE

## 类型说明

| 类型       | 说明                                   | 对应 CHANGELOG |
| ---------- | -------------------------------------- | -------------- |
| `feat`     | 新功能                                 | Added          |
| `fix`      | 修复 bug                               | Fixed          |
| `docs`     | 仅文档变更                             | -              |
| `style`    | 代码格式（不影响代码运行）             | -              |
| `refactor` | 重构（既不是新增功能，也不是修复 bug） | Changed        |
| `perf`     | 性能优化                               | Changed        |
| `test`     | 增加或修正测试                         | -              |
| `chore`    | 构建过程或辅助工具的变动               | -              |
| `ci`       | CI 配置相关修改                        | -              |
| `revert`   | 回退之前的提交                         | -              |

## 作用域

作用域用于说明提交影响的范围，可选值：

- `components` - 组件相关
- `hooks` - 自定义 Hooks
- `services` - 服务层
- `utils` - 工具函数
- `android` - Android 相关
- `docker` - Docker 相关
- `ci` - CI/CD 相关
- `docs` - 文档相关
- `deps` - 依赖更新
- `*` - 全局范围

如果没有合适的作用域，可以省略。

## 详细规范

### Subject（主题）

- 使用祈使句，现在时态："change" 而不是 "changed" 或 "changes"
- 第一个字母小写
- 结尾不使用句号
- 不超过 50 个字符
- 清晰描述变更的目的

### Body（正文）

- 使用祈使句，现在时态
- 解释变更的动机和前后对比
- 每一行不超过 72 个字符
- 可以分段，使用空行分隔

### Footer（页脚）

- 用于关联 issue：`Closes #123` 或 `Fixes #456`
- 用于描述破坏性变更：以 `BREAKING CHANGE:` 开头

## 示例

### 新功能（feat）

```
feat: add AI recommendation feature

新增基于用户观看历史的 AI 推荐功能
- 集成推荐算法
- 添加推荐列表 UI
- 支持个性化推荐

Closes #123
```

### Bug 修复（fix）

```
fix(android): fix video playback crash on Android 12

修复 Android 12 设备上的视频播放崩溃问题
- 更新 ExoPlayer 版本
- 处理新的权限模型

Fixes #456
```

### 文档（docs）

```
docs: update installation guide

更新安装指南，添加 Docker 部署说明
```

### 代码格式（style）

```
style: format code with Prettier

使用 Prettier 统一代码格式
```

### 重构（refactor）

```
refactor(hooks): reorganize useVideoControls hook

重构 useVideoControls 钩子
- 将逻辑拆分为更小的函数
- 提高代码可维护性
- 保持功能不变
```

### 性能优化（perf）

```
perf: optimize video loading performance

优化视频加载性能
- 实现智能预加载策略
- 优化内存管理
- 减少首屏加载时间 40%
```

### 测试（test）

```
test: add unit tests for useFavorites hook

为 useFavorites 钩子添加完整的单元测试
- 测试添加收藏功能
- 测试删除收藏功能
- 测试收藏列表管理
```

### 构建/工具（chore）

```
chore(deps): update React to 18.3.0

更新 React 版本到 18.3.0
- 更新相关依赖
- 处理弃用警告
```

### 破坏性变更（BREAKING CHANGE）

```
feat!: change media client API

重构媒体客户端 API
- 统一 Emby 和 Plex 的接口
- 简化初始化流程

BREAKING CHANGE: 媒体客户端 API 已完全重构，需要更新调用代码

Closes #789
```

注意：`!` 号表示这是一个破坏性变更。

## 与 CHANGELOG 的对应关系

提交信息会影响 CHANGELOG.md 的生成：

| 提交类型                         | CHANGELOG 分类           |
| -------------------------------- | ------------------------ |
| `feat`                           | Added                    |
| `fix`                            | Fixed                    |
| `refactor`, `perf`               | Changed                  |
| `docs`, `style`, `test`, `chore` | 不加入 CHANGELOG         |
| 带有 `BREAKING CHANGE`           | Added/Changed 并特别标注 |

## 提交前检查清单

在提交代码前，请确认：

- [ ] 提交信息格式正确
- [ ] 使用了合适的提交类型
- [ ] Subject 清晰描述变更
- [ ] 必要时添加了 Body 说明
- [ ] 关联了相关的 Issue（如有）
- [ ] 破坏性变更已在 Footer 中标注

## 实用工具

### 检查提交信息

可以使用 `commitlint` 来检查提交信息是否符合规范。

### 交互式提交工具

可以使用 `commitizen` 来帮助生成符合规范的提交信息：

```bash
# 安装（可选）
npm install -g commitizen

# 使用
git cz
```

## 常见问题

### Q: 我的提交包含多种类型变更怎么办？

A: 尽量拆分为多个提交。如果不可行，选择最主要的类型。

### Q: 如何回退一个提交？

A: 使用 `revert` 类型：

```
revert: feat: add AI recommendation feature

这将回退提交 abc123d
```

### Q: 提交信息可以用中文吗？

A: 可以。建议使用中文，方便团队协作。

### Q: 如何修改之前的提交信息？

A:

```bash
# 修改最后一次提交
git commit --amend

# 修改较早的提交（使用 rebase）
git rebase -i HEAD~3
```

### Q: 紧急修复时可以跳过规范吗？

A: 不建议。保持规范有助于追踪历史。但在极端情况下可以灵活处理。

## 相关文档

- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
- [版本升级步骤指南](./VERSION_UPGRADE_GUIDE.md)
- [发布前检查清单](./RELEASE_CHECKLIST.md)

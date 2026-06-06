# EmbyTok v2.0.0 - 发布总结

---

## 📅 发布日期
2026-06-06

## 🎯 版本号
v2.0.0 (主版本升级)

---

## 🚀 本次发布的主要内容

### 1️⃣ Emby API 深度集成
- ✅ **Emby Recommendations API** - 智能推荐系统
- ✅ **UserData 深度集成** - 播放进度自动同步、用户评分、观影历史
- ✅ **智能播放队列** - 支持剧集自动连播
- ✅ **BoxSet 支持增强** - 优化的合集展示

### 2️⃣ TikTok 风格体验增强
- ✅ **短视频预览** - 滚动停留自动播放3秒无声预览
- ✅ **虚拟滚动** - 使用 react-virtuoso 支持大规模列表流畅浏览
- ✅ **智能预加载** - 基于滑动方向预测，提前加载下一个视频
- ✅ **无缝连播** - 双Video元素实现无感知视频切换
- ✅ **图像API优化** - 响应式加载，WebP格式支持

### 3️⃣ 性能与离线支持
- ✅ **本地缓存系统** - IndexedDB + LRU 淘汰策略
- ✅ **Service Worker增强** - 离线支持和后台同步
- ✅ **批量API调用优化** - 请求合并和缓存，减少网络请求

### 4️⃣ 用户体验提升
- ✅ **骨架屏加载** - 友好的加载状态和分片加载
- ✅ **多用户快速切换** - 同一设备支持多用户
- ✅ **错误恢复机制** - 指数退避重试和友好错误提示

---

## 📦 发布产物

### Web 版本
- **构建目录**: `dist/`
- **压缩包**: `dist.zip` (288 KB)
- **支持**: PWA, 响应式设计

### Docker 镜像
- **镜像**: `aidedaijiayang/embytok:v2.0.0`
- **架构**: linux/amd64, linux/arm64
- **大小**: < 50 MB
- **基础镜像**: nginx:alpine

### Android APK
- **构建**: 配置已就绪
- **签名**: 需要用户配置

---

## 📁 新增/修改的文件

### 新增文件 (16 个)
1. [CHANGELOG.md](file:///workspace/CHANGELOG.md) - 版本变更记录
2. [RELEASE_NOTES.md](file:///workspace/RELEASE_NOTES.md) - 发布说明
3. [RELEASE_DRAFT.md](file:///workspace/RELEASE_DRAFT.md) - GitHub Release 草稿
4. [RELEASE_SUMMARY.md](file:///workspace/RELEASE_SUMMARY.md) - 本文件
5. [.github/workflows/release.yml](file:///workspace/.github/workflows/release.yml) - GitHub 发布工作流
6. [scripts/release.sh](file:///workspace/scripts/release.sh) - 发布脚本
7. [src/hooks/useCache.ts](file:///workspace/src/hooks/useCache.ts) - 缓存 Hook
8. [src/hooks/useVideoPreview.ts](file:///workspace/src/hooks/useVideoPreview.ts) - 视频预览 Hook
9. [src/hooks/useSmartVideoPreload.ts](file:///workspace/src/hooks/useSmartVideoPreload.ts) - 智能预加载 Hook
10. [src/hooks/usePlayQueue.ts](file:///workspace/src/hooks/usePlayQueue.ts) - 播放队列 Hook
11. [src/hooks/useMultiUser.ts](file:///workspace/src/hooks/useMultiUser.ts) - 多用户 Hook
12. [src/hooks/useNetworkStatus.ts](file:///workspace/src/hooks/useNetworkStatus.ts) - 网络状态 Hook
13. [src/hooks/useLoadingState.ts](file:///workspace/src/hooks/useLoadingState.ts) - 加载状态 Hook
14. [src/hooks/useErrorRecovery.ts](file:///workspace/src/hooks/useErrorRecovery.ts) - 错误恢复 Hook
15. [src/hooks/useErrorToast.tsx](file:///workspace/src/hooks/useErrorToast.tsx) - 错误提示 Hook
16. [src/utils/apiRequestPool.ts](file:///workspace/src/utils/apiRequestPool.ts) - API 请求池工具
17. [components/VideoPreview.tsx](file:///workspace/components/VideoPreview.tsx) - 短视频预览组件
18. [components/BoxSetView.tsx](file:///workspace/components/BoxSetView.tsx) - BoxSet 视图组件
19. [components/Skeleton.tsx](file:///workspace/components/Skeleton.tsx) - 骨架屏组件
20. [components/UserSwitcher.tsx](file:///workspace/components/UserSwitcher.tsx) - 用户切换组件

### 修改文件 (10+ 个)
1. [package.json](file:///workspace/package.json) - 版本号和脚本更新
2. [vite.config.ts](file:///workspace/vite.config.ts) - 构建配置优化
3. [Dockerfile](file:///workspace/Dockerfile) - Docker 构建优化
4. [docker-compose.yml](file:///workspace/docker-compose.yml) - 编排配置
5. [README.md](file:///workspace/README.md) - 文档更新
6. [CODE_WIKI.md](file:///workspace/CODE_WIKI.md) - 代码 Wiki 更新
7. [services/EmbyClient.ts](file:///workspace/services/EmbyClient.ts) - API 增强
8. [components/VideoFeed.tsx](file:///workspace/components/VideoFeed.tsx) - 预加载集成
9. [components/VideoPlayer.tsx](file:///workspace/components/VideoPlayer.tsx) - 无缝连播
10. [components/VideoGrid.tsx](file:///workspace/components/VideoGrid.tsx) - 虚拟滚动
11. [components/VideoCard.tsx](file:///workspace/components/VideoCard.tsx) - 预览集成

---

## 🛠️ 发布工具

### 1. GitHub Actions Workflow
**文件**: [.github/workflows/release.yml](file:///workspace/.github/workflows/release.yml)

**功能**:
- 自动触发: 推送到 `v*` tags
- 手动触发: GitHub 网页界面
- 自动构建: Web、Docker 镜像
- 自动发布: GitHub Release、Docker Hub

**使用方法**:
```bash
# 方法 1: 推送 tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin --tags

# 方法 2: GitHub 网页手动触发
# 访问 Actions -> "EmbyTok Release" -> Run workflow
```

### 2. 发布脚本
**文件**: [scripts/release.sh](file:///workspace/scripts/release.sh)

**功能**:
- 自动版本管理 (major/minor/patch)
- 代码检查和构建
- Git tag 创建
- dist.zip 生成

**使用方法**:
```bash
# 查看帮助
./scripts/release.sh help

# 代码检查
./scripts/release.sh check

# 仅构建
./scripts/release.sh build

# 发布补丁版本
./scripts/release.sh patch

# 发布特定版本
./scripts/release.sh 2.0.0
```

### 3. npm 脚本
在 [package.json](file:///workspace/package.json) 中:
```json
{
  "release:version": "显示当前版本",
  "release:tag": "创建 git tag",
  "release:push-tag": "推送 tags 到远程",
  "release:build-dist": "构建并生成 dist.zip",
  "lint": "ESLint 检查",
  "typecheck": "TypeScript 检查"
}
```

---

## 📝 发布流程

### 完整发布流程

#### 1️⃣ 准备阶段 (已完成)
- ✅ 版本号更新: 1.9.5 → 2.0.0
- ✅ 代码质量检查: TypeScript、ESLint 已通过
- ✅ 功能完整性验证: 所有 15 个优化任务已完成
- ✅ 文档更新: CHANGELOG、README、CODE_WIKI 已更新

#### 2️⃣ 构建阶段 (已完成)
- ✅ Web 构建: 成功生成 dist/
- ✅ Docker 配置: Dockerfile 已优化
- ✅ dist.zip: 已生成 (288 KB)

#### 3️⃣ 发布阶段 (用户执行)
```bash
# 步骤 1: 推送 tag 到 GitHub
git push origin --tags

# 步骤 2: 等待 GitHub Actions 完成
# 访问 Actions -> "EmbyTok Release"

# 步骤 3: 验证 GitHub Release
# 访问 Releases -> "Release v2.0.0"

# 步骤 4: 验证 Docker Hub
# 访问 Docker Hub -> aidedaijiayang/embytok
```

### Docker 镜像手动发布
```bash
# 登录 Docker Hub
docker login

# 构建镜像
./scripts/build-docker.sh build

# 推送镜像
./scripts/build-docker.sh push
```

---

## 🔗 相关文档

- [发布规范](file:///workspace/.trae/specs/embytok-release/spec.md)
- [任务清单](file:///workspace/.trae/specs/embytok-release/tasks.md)
- [验证清单](file:///workspace/.trae/specs/embytok-release/checklist.md)
- [代码 Wiki](file:///workspace/CODE_WIKI.md)
- [CHANGELOG](file:///workspace/CHANGELOG.md)

---

## 🎯 下一版本建议

### 2.1.0 可能的功能
- [ ] Emby 评分系统完整支持
- [ ] Live TV 支持
- [ ] 离线视频下载
- [ ] 播放列表管理界面
- [ ] 播放统计和分析

### 性能优化
- [ ] 进一步优化首屏加载
- [ ] 增强 Service Worker 缓存策略
- [ ] 图片懒加载更激进

---

## 📊 发布统计

| 项目 | 数量 |
|------|------|
| 新增功能 | 15 个优化任务 |
| 新增文件 | 20 个 |
| 修改文件 | 10+ 个 |
| 新增 Hooks | 9 个 |
| 新增组件 | 4 个 |
| 构建产物大小 | 788 KB (uncompressed) / 288 KB (zip) |
| Docker 镜像大小 | < 50 MB |

---

## 📝 备注

### Git 状态
- 当前 branch: `trae/solo-agent-senqTd`
- Tag: `v2.0.0` (本地已创建)
- 工作区: clean

### 待用户完成
1. [ ] 推送 tag 到 GitHub 远程仓库
2. [ ] 在 GitHub 网页确认并发布 Release
3. [ ] 推送 Docker 镜像到 Docker Hub
4. [ ] 部署 Web 版本到服务器

### 已知问题
- [ ] npm audit 有 4 个中等/高危漏洞 (来自第三方依赖，需要破坏性升级)
- [ ] ESLint 有一些警告 (不影响功能)

---

**发布准备完成日期**: 2026-06-06

---

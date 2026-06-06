# 版本更新日志 (Changelog)

## v1.10.1
**日期**: 2026-06-06

### 🚀 新功能与优化
#### 1. 完整的自动化发布流程
- **版本管理工具**：自动管理版本号，支持 patch/minor/major 升级
  - 一键查看当前版本
  - 自动升级版本并更新 package.json
  - 自动生成 CHANGELOG 条目模板
- **CHANGELOG 提取工具**：自动从 CHANGELOG 提取发布说明
  - 支持指定版本号提取
  - 自动格式化 GitHub Release 说明
  - 包含下载链接和功能特性
- **发布前检查工具**：全面的质量检查
  - 版本号格式验证
  - CHANGELOG 更新检查
  - Git 工作区状态检查
  - TypeScript 类型检查
  - 单元测试运行
  - 项目构建验证
- **GitHub Actions 工作流**：完整的 CI/CD 流程
  - Release 工作流：自动测试 → 构建 → 发布
  - Pre-release 工作流：预发布版本管理
  - 支持手动触发，可配置参数

### 🔧 技术改进
- **工作流优化**：测试通过后才执行构建和发布
- **防重复发布**：自动检查标签是否存在
- **灵活配置**：可选择是否创建 Release、推送 Docker、构建 APK
- **多平台支持**：Docker 镜像支持 linux/amd64 和 linux/arm64
- **Android 签名支持**：同时提供 Debug 和 Release 版本的 APK
  - Release APK 使用项目配置的正式签名
  - Debug APK 使用 Android 默认调试签名
  - 支持从 GitHub Secrets 读取签名配置

### 📁 文件更新
- `.github/workflows/release.yml` (新增/更新) - 正式发布工作流，支持 Release APK
- `.github/workflows/pre-release.yml` (新增/更新) - 预发布工作流，支持 Release APK
- `scripts/version-manager.js` (新增) - 版本管理工具
- `scripts/extract-changelog.js` (新增) - CHANGELOG 提取工具
- `scripts/pre-release-check.js` (新增) - 发布前检查脚本
- `RELEASE_GUIDE.md` (新增/更新) - 发布指南文档，添加签名配置说明
- `package.json` (更新) - 添加版本管理 npm 脚本
- `android/app/build.gradle` (更新) - 支持从环境变量读取签名配置
- `build-android.sh` (更新) - 优化构建脚本，支持 Debug 和 Release 版本

---

## v1.10.0
**日期**: 2026-06-06

### 🚀 新功能与优化
#### 1. 完整测试体系建设
- **单元测试**：覆盖所有自定义 Hooks、工具函数、服务客户端
  - 新增 17 个 Hooks 测试文件，100+ 测试用例
  - 覆盖 useConfig、useFavorites、useSearch 等核心 Hooks
- **组件集成测试**：测试所有主要 UI 组件
  - 覆盖 Login、VideoPlayer、VideoFeed 等 20+ 组件
  - 包含移动端、标准端、TV 端的测试
- **E2E 端到端测试**：使用 Playwright 测试完整用户流程
  - 首页加载测试
  - 登录流程测试
  - 移动端适配测试
  - 应用性能测试
- **性能基准测试**：使用 Vitest Bench 进行性能回归检测
  - 大量数据处理性能测试
  - 计算密集型函数性能测试
  - 性能基准线管理工具

#### 2. CI/CD 自动化集成
- **GitHub Actions 工作流**
  - 自动化测试：每次 PR 和推送自动运行
  - 代码质量检查：TypeScript 类型检查 + Prettier 格式化
  - 测试覆盖率报告：自动生成并上传 artifacts
  - 性能基准测试：自动检测性能回归
- **工作流文件**
  - `test.yml`：专门的测试工作流
  - `docker-build-push.yml`：构建和部署工作流
- **开发者体验优化**
  - 支持手动触发工作流
  - 清晰的测试结果展示
  - 30天的测试 artifacts 保留

#### 3. 项目质量与工程化
- **测试覆盖统计**
  - 单元/集成测试文件：47 个
  - E2E 测试文件：3 个
  - 性能测试文件：2 个
  - 总测试用例：310+ 个
  - 通过率：100% ✅
- **代码质量保障**
  - 完整的 TypeScript 类型检查
  - Prettier 代码格式化规范
  - Vitest 覆盖率报告
- **性能监控**
  - 基准性能测试脚本
  - 性能结果比较工具
  - 可扩展的性能检测框架

### 🔧 技术改进
- **测试框架升级**
  - Vitest 配置优化（排除 E2E 测试）
  - Playwright 端到端测试集成
  - 性能基准测试集成
- **项目结构优化**
  - 测试文件统一组织
  - E2E 测试独立目录
  - 基准测试文件集中管理
- **文档完善**
  - 更新 TESTING_SUMMARY.md 完整测试总结
  - 添加 CI/CD 使用说明
  - 性能测试文档
  - 版本管理指南

### 📁 文件更新
- **新增测试文件**（52+）
  - `e2e/app.spec.ts`
  - `e2e/login.spec.ts`
  - `e2e/mobile.spec.ts`
  - `e2e/performance.spec.ts`
  - `utils/__tests__/media.benchmark.ts`
  - `src/hooks/__tests__/` 完整测试集
  - `components/__tests__/` 完整组件测试
  - `components/tv/__tests__/` TV 端测试
  - `components/mobile/__tests__/` 移动端测试
  - `components/standard/__tests__/` 标准端测试
- **配置文件更新**
  - `.github/workflows/test.yml` (新增)
  - `vitest.config.ts` (更新)
  - `playwright.config.ts` (新增)
  - `package.json` (添加测试脚本)
- **工具脚本**
  - `scripts/benchmark-compare.js` (新增)
- **文档更新**
  - `docs/TESTING_SUMMARY.md` (大幅更新)
  - `README.md` (后续待更新)

---

## v1.9.5
**日期**: 2026-06-05

### 🎨 界面优化
#### 1. 关于页面全面升级
- 全新视觉设计，添加应用 Logo 区域
- 功能特性展示采用图标+文字的卡片形式
- 新增一键复制版本号功能
- 添加技术栈标签展示
- 快速链接区域（GitHub 项目和赞助）
- 优化页脚版权信息展示
- 更新项目链接到正确的仓库地址

### 📁 文件更新
- `components/LibrarySelect.tsx (大幅更新)
- `src/locales/en.ts (更新)
- `src/locales/zh.ts (更新)

---

## v1.9.4
**日期**: 2026-06-05

### 🎉 新功能
#### 1. 自动检查更新
- 集成 GitHub Releases API 获取最新版本
- 版本号自动比较和检测更新
- 友好的更新通知对话框
- 显示更新内容（Changelog）
- APK 下载链接自动提取和跳转
- 支持中英文双语界面

### 🔧 技术优化
- 新增自定义 Hook `useUpdateChecker`
- 更新类型定义 `GitHubRelease` 和 `UpdateCheckResult`
- Vite 配置自动读取 package.json 版本号
- 更新翻译文件添加更新功能文案

### 📁 文件更新
- `src/hooks/useUpdateChecker.ts (新增)
- `components/UpdateNotification.tsx (新增)
- `types.ts` (更新)
- `src/locales/en.ts (更新)
- `src/locales/zh.ts (更新)
- `components/LibrarySelect.tsx (更新)
- `components/standard/StandardRoot.tsx (更新)
- `vite.config.ts (更新)
- `package.json` (更新)

---

## v1.9.3
**日期**: 2026-06-05

### 🐛 修复与优化
- **Android 签名配置**
  - 生成固定签名密钥文件 `embytok-release.keystore`
  - 配置 Gradle 自动签名，避免安装签名不兼容问题
  - 添加 `build-android.sh` 自动化构建脚本
  - 更新 Android versionCode 和 versionName

---

## v1.9.2
**日期**: 2026-06-05

### 🎉 新功能

#### 1. 播放历史
- 完整的观看历史记录管理
- 自动记录播放进度和时间戳
- 支持继续播放、移除、清空历史
- 最多保存 100 条历史记录
- 本地 localStorage 持久化存储

#### 2. 搜索功能
- 实时视频搜索（防抖 300ms）
- 搜索历史记录（最多 20 条）
- 支持中英文搜索
- 搜索结果展示和快速跳转

#### 3. 收藏分类管理
- 创建多个收藏合集
- 重命名和删除合集
- 视频分类收藏管理
- 本地持久化存储

#### 4. 字幕支持
- 字幕开关控制
- 字幕轨道选择
- 字幕样式自定义（字体大小、颜色、位置）
- VTT 字幕解析和渲染

### 🔧 技术优化
- 新增自定义 Hooks：useWatchHistory、useSearch、useFavorites、useSubtitles
- 完整的 TypeScript 类型支持
- 中英文双语国际化支持
- 性能优化：防抖搜索、懒加载

### 📁 文件更新
- 新增 4 个自定义 Hook
- 新增 6 个功能组件
- 更新翻译文件（中英文）
- 更新类型定义
- 集成到现有 UI

---

## v1.9.1
**日期**: 2026-06-05

### 修复
- 搜索功能：正确集成 useSearch Hook
- 字幕支持：完善字幕轨道获取和渲染
- 收藏分类：正确集成 useFavorites Hook
- 播放历史：完善组件传递链

---

## v1.9.0
**日期**: 2026-06-05

### 🎉 新功能

#### 1. 播放历史
- 完整的观看历史记录管理
- 自动记录播放进度和时间戳
- 支持继续播放、移除、清空历史
- 最多保存 100 条历史记录
- 本地 localStorage 持久化存储

#### 2. 搜索功能
- 实时视频搜索（防抖 300ms）
- 搜索历史记录（最多 20 条）
- 支持中英文搜索
- 搜索结果展示和快速跳转

#### 3. 收藏分类管理
- 创建多个收藏合集
- 重命名和删除合集
- 视频分类收藏管理
- 本地持久化存储

#### 4. 字幕支持
- 字幕开关控制
- 字幕轨道选择
- 字幕样式自定义（字体大小、颜色、位置）
- VTT 字幕解析和渲染

### 🔧 技术优化
- 新增自定义 Hooks：useWatchHistory、useSearch、useFavorites、useSubtitles
- 完整的 TypeScript 类型支持
- 中英文双语国际化支持
- 性能优化：防抖搜索、懒加载

### 📁 文件更新
- 新增 4 个自定义 Hook
- 新增 6 个功能组件
- 更新翻译文件（中英文）
- 更新类型定义
- 集成到现有 UI

---

## v1.8.0
**日期**: 2026-06-05

### 性能优化
- 智能视频预加载策略
  - 基于滚动速度动态调整预加载范围
  - 检测网络质量并自适应预加载策略
  - 预加载方向跟随滚动方向
  - 智能缓存管理，优化内存使用
- 图片加载优化
  - 支持响应式图片加载（srcset/sizes）
  - 渐进式图片加载，提升视觉体验
  - 图片懒加载，减少初始加载
  - 加载优先级系统，优先加载关键内容
  - 错误重试机制，提升稳定性
- 虚拟滚动优化升级
  - 基于滚动速度动态调整渲染范围
  - 减少DOM节点数量，大幅提升滚动性能
  - 优化组件重渲染，降低CPU占用
  - 集成智能预加载，视频切换更流畅

### 代码优化
- React组件性能优化
  - 广泛使用React.memo减少不必要重渲染
  - useMemo/useCallback优化计算和回调
  - 精细的props比较函数
- 构建优化
  - 代码分割，按需加载
  - 依赖分包，优化缓存策略
  - 生产环境深度压缩

## v1.6.3
**日期**: 2026-06-05

### 新功能
- 完善进度条拖动快进功能
  - 支持触摸拖动和鼠标拖动
  - 实时更新视频播放位置
  - 增大触摸区域，更易操作
  - 优化拖动手柄样式

## v1.6.2
**日期**: 2026-06-05

### 优化
- 进度条显示/隐藏优化
  - 默认隐藏进度条，播放时双击显示
  - 5秒无操作自动隐藏
  - 与用户交互时重置隐藏计时器

## v1.6.1
**日期**: 2026-06-05

### 修复
- Android登录问题修复
  - 添加网络安全配置支持HTTP明文流量
  - 支持自签名SSL证书
  - 修复Android应用无法连接服务器问题

## v1.6.0
**日期**: 2026-06-04

### 新功能
- 记忆播放进度
  - 自动保存视频播放进度到localStorage
  - 7天内自动恢复上次播放位置
- 播放失败重试机制
  - 最多自动重试3次
- 更好的错误提示
  - 网络错误提示
  - 文件不存在提示
  - 格式不支持提示
- 播放速度调节
  - 支持0.5x-5.0x倍速调节
  - 长按手势触发2倍速播放
  - 上下滑动调整加速速率

## 早期版本

### v1.5.x
- 基础TikTok式浏览体验
- 视频卡片组件优化
- 手势交互增强
- 骨架屏集成

### v1.0.0
- 初始版本
- Emby/Jellyfin服务器连接
- 基础视频播放功能

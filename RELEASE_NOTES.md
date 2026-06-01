# EmbyTok 发布说明

## v1.3.0 - 优化与重构版本

**发布日期**: 2026-06-01

### 🎯 主要特性

#### 1. 代码重构与组织优化
- **组件拆分**: 将大型组件拆分为更小、更易维护的模块
- **VideoCard**：从 668 行减少到 235 行（减少 64%）
- **新增子组件**：
  - VideoPlayer.tsx - 视频播放核心
  - VideoControls.tsx - 控制按钮
  - VideoInfo.tsx - 信息展示
  - HeartAnimation.tsx - 红心动效
  - DeleteConfirmDialog.tsx - 删除确认

#### 2. 多语言系统
- **统一翻译资源管理**：
  - src/locales/zh.ts - 中文翻译
  - src/locales/en.ts - 英文翻译
  - src/locales/index.ts - 翻译系统入口
- **useTranslation Hook**：提供类型安全的多语言支持

#### 3. 工具函数库
- **utils/time.ts**：时间格式化函数
- **utils/media.ts**：媒体处理工具
- **utils/device.ts**：设备检测函数
- **共 85 行**可复用的工具代码

#### 4. 自定义 Hooks
| Hook | 功能 | 行数 |
|------|------|------|
| useDeviceDetection | 设备和屏幕方向检测 | 33 |
| useVideoControls | 视频控制逻辑 | 165 |
| useGestureControls | 手势控制 | 136 |
| useTranslation | 多语言管理 | 51 |
| useLocalStorageState | 本地存储状态 | 30 |
| useConfig | 服务器配置管理 | 23 |
| useLibraries | 媒体库管理 | 53 |
| useVideoList | 视频列表管理 | 169 |
| useUIState | UI 状态管理 | 54 |
**总计：723 行**

#### 5. 测试框架
- **测试运行器**：Vitest
- **测试工具**：React Testing Library
- **测试覆盖**：
  - 5 个测试文件
  - 46 个测试用例
  - 工具函数测试
  - 组件基础测试

#### 6. 性能优化
- **React.memo**：应用于关键组件，减少重渲染
- **useMemo/useCallback**：优化计算和函数引用
- **懒加载**：图片和资源优化加载
- **预加载**：视频元数据预加载策略

#### 7. 错误处理系统
- **统一错误代码**：ErrorCode 枚举
- **AppError 类**：自定义错误对象
- **错误边界**：组件级错误捕获
- **加载组件**：LoadingSpinner、LoadingScreen
- **错误展示**：ErrorDisplay、ErrorBanner

### 📊 代码统计

| 指标 | 原版本 | v1.3.0 | 变化 |
|------|--------|--------|------|
| 主要组件行数 | 668 | 235 | -433 行 (-64%) |
| 测试数量 | 0 | 46 | +46 |
| Hooks 数量 | 0 | 9 | +9 |
| 工具函数 | 分散 | 85 行 | 统一管理 |

### 🔧 技术改进

- **TypeScript 类型安全**：减少 any 类型使用，增强类型注解
- **构建配置**：独立的 vitest.config.ts
- **CI/CD**：现有 GitHub Actions 工作流
- **PWA 支持**：保持现有功能

### 🎨 目录结构变更

```
/workspace
├── src/                    # 新增源码目录
│   ├── hooks/             # 自定义 Hooks
│   ├── locales/           # 多语言资源
├── utils/                 # 工具函数
│   ├── time.ts
│   ├── media.ts
│   └── device.ts
├── components/            # 优化的组件
│   ├── VideoPlayer.tsx    # 新增
│   ├── VideoControls.tsx  # 新增
│   ├── VideoInfo.tsx      # 新增
│   ├── HeartAnimation.tsx # 新增
│   ├── DeleteConfirmDialog.tsx # 新增
│   └── ui/                # UI 组件
│       ├── LoadingSpinner.tsx
│       └── ErrorDisplay.tsx
└── vitest.config.ts       # 测试配置
```

### 🚀 部署建议

#### Docker 部署
```bash
# 构建镜像
docker build -t embytok:1.3.0 .

# 运行容器
docker run -d \
  --name embytok-web \
  --restart unless-stopped \
  -p 8080:80 \
  embytok:1.3.0
```

#### Docker Compose
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### 📝 更新说明

**从 v1.2.4 升级至 v1.3.0**：
- 完全向后兼容，无破坏性变更
- 所有现有功能保持不变
- 性能和可维护性显著提升

### 🧪 测试命令
```bash
# 运行测试
npm run test:run

# 查看测试覆盖率
npm run test:coverage

# 开发模式
npm run test
```

### 📦 依赖变更

**新增开发依赖**：
- vitest: ^4.1.7
- @testing-library/react: ^16.3.2
- @testing-library/jest-dom: ^6.9.1
- @types/react-test-renderer: ^19.1.0
- jsdom: ^29.1.1

### 🎉 感谢

感谢所有贡献者对 EmbyTok 项目的支持！

---

*下一个版本规划：继续优化性能和用户体验*

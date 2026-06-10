# EmbyTok KMP - Kotlin Multiplatform + Jetpack Compose

> EmbyTok 的原生 Android 应用，使用 Kotlin Multiplatform 和 Jetpack Compose 重写。

## 项目状态

⚠️ **开发中** - 本项目正在积极开发中，尚未完成。

## 架构概览

```
┌──────────────────────────────────────────────────────┐
│                     Android UI Layer                  │
│              (Jetpack Compose + ViewModels)            │
├──────────────────────────────────────────────────────┤
│                     shared Module                     │
│  ┌─────────┬─────────┬─────────┬─────────┬────────┐│
│  │ common  │ domain  │ network │repository│ usecase││
│  └─────────┴─────────┴─────────┴─────────┴────────┘│
└──────────────────────────────────────────────────────┘
```

## 模块说明

| 模块 | 说明 |
|------|------|
| `shared:common` | 通用工具：日志（Kermit）、时间处理、设备检测 |
| `shared:domain` | 领域模型：数据类、接口定义 |
| `shared:network` | 网络层：Emby/Plex API 客户端（Ktor） |
| `shared:repository` | 仓储层：数据缓存、持久化（SQLDelight） |
| `shared:usecase` | 用例层：业务逻辑封装 |
| `android:app` | Android 应用：Compose UI、ViewModels |
| `android:player` | 播放器模块：ExoPlayer 封装 |

## 技术栈

- **语言**: Kotlin 1.9.24
- **UI**: Jetpack Compose (BOM 2024.06.00)
- **网络**: Ktor Client 2.3.11
- **DI**: Koin 3.5.6
- **数据库**: SQLDelight 2.0.2
- **播放器**: AndroidX Media3 (ExoPlayer) 1.3.1
- **图片**: Coil 2.6.0
- **目标 SDK**: 34 (Android 14)
- **最低 SDK**: 24 (Android 7.0)

## 快速开始

### 环境要求

- JDK 17+
- Android Studio Iguana 或更高版本
- Gradle 8.5

### 构建

```bash
# 克隆项目
git clone <repo-url>
cd android-kmp

# 构建 Debug APK
./gradlew :android:app:assembleDebug

# 构建 Release APK
./gradlew :android:app:assembleRelease
```

### 运行测试

```bash
# 单元测试
./gradlew test

# 共享模块测试
./gradlew :shared:domain:test
./gradlew :shared:network:test
./gradlew :shared:usecase:test
```

## 已实现功能

- ✅ Gradle 多模块脚手架
- ✅ Domain 数据模型（对应 Web 版 types.ts）
- ✅ Emby 客户端（Ktor + REST API）
- ✅ Plex 客户端（Ktor + HTTP API）
- ✅ ClientFactory（客户端工厂）
- ✅ UseCase 层（认证、获取视频、搜索等）
- ✅ Android UI 主题（深色）
- ✅ 登录页面（Emby/Plex 切换）
- ✅ Feed 页面（竖屏视频流）
- ✅ VideoCard 组件（海报、双击点赞）
- ✅ PlayerScreen（ExoPlayer 集成）
- ✅ SettingsScreen
- ✅ 导航（Jetpack Navigation Compose）

## 待实现功能

- [ ] Repository 层（缓存、持久化）
- [ ] DataStore 偏好设置持久化
- [ ] 字幕功能（VTT 解析、渲染）
- [ ] 收藏功能（服务端 + 本地）
- [ ] 观看历史
- [ ] 搜索功能
- [ ] 画中画（PiP）
- [ ] 后台音频播放
- [ ] TV 模式
- [ ] 深度链接
- [ ] 更新检查
- [ ] 单元测试覆盖率提升

## 项目结构

```
android-kmp/
├── gradle/
│   └── libs.versions.toml          # 依赖版本管理
├── shared/
│   ├── common/                    # 通用工具
│   │   └── src/commonMain/kotlin/
│   │       └── com/embytok/common/
│   │           ├── Logger.kt
│   │           ├── TimeUtils.kt
│   │           └── DeviceUtils.kt
│   ├── domain/                    # 领域模型
│   │   └── src/commonMain/kotlin/
│   │       └── com/embytok/domain/
│   │           ├── model/
│   │           │   ├── ServerConfig.kt
│   │           │   ├── EmbyItem.kt
│   │           │   └── CommonModels.kt
│   │           └── client/
│   │               └── MediaClient.kt
│   ├── network/                   # 网络层
│   │   └── src/commonMain/kotlin/
│   │       └── com/embytok/network/
│   │           ├── ClientFactory.kt
│   │           ├── emby/EmbyClient.kt
│   │           └── plex/PlexClient.kt
│   ├── repository/                # 仓储层
│   └── usecase/                   # 用例层
│       └── src/commonMain/kotlin/
│           └── com/embytok/usecase/
│               └── MediaUseCases.kt
├── android/
│   ├── app/                       # 应用模块
│   │   ├── build.gradle.kts
│   │   └── src/main/
│   │       ├── java/com/embytok/app/
│   │       │   ├── MainActivity.kt
│   │       │   ├── EmbyTokApp.kt
│   │       │   ├── di/AppModule.kt
│   │       │   ├── viewmodel/
│   │       │   │   ├── LoginViewModel.kt
│   │       │   │   ├── FeedViewModel.kt
│   │       │   │   └── OtherViewModels.kt
│   │       │   └── ui/
│   │       │       ├── EmbyTokApp.kt
│   │       │       ├── theme/
│   │       │       └── screens/
│   │       │           ├── login/LoginScreen.kt
│   │       │           ├── feed/FeedScreen.kt
│   │       │           ├── player/PlayerScreen.kt
│   │       │           └── settings/SettingsScreen.kt
│   │       └── res/
│   │           ├── values/
│   │           │   ├── strings.xml
│   │           │   ├── colors.xml
│   │           │   └── themes.xml
│   │           ├── values-zh-rCN/strings.xml
│   │           └── xml/network_security_config.xml
│   └── player/                    # 播放器模块
│       └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## 许可证

MIT License - 与 Web 版一致

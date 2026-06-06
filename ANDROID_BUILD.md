# EmbyTok Android 应用构建指南

## 环境要求

构建 EmbyTok Android 应用需要以下环境：

- **Node.js** (v18 或更高)
- **Java JDK** (v17 或更高)
- **Android Studio** (最新稳定版)
- **Android SDK** (API 33+)
- **Android SDK Build-Tools** (33.0+)
- **Gradle** (已包含在项目中)

## 快速开始（推荐）

使用自动构建脚本一键构建：

### 方式一：自动构建脚本（Linux/Mac）

```bash
./build-android.sh
```

### 方式二：手动一步步构建

## 构建步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 构建前端应用

```bash
npm run build
```

### 3. 同步 Capacitor

```bash
npx cap sync android
```

### 4. 使用 Android Studio 构建 (推荐)

#### 方法一：在 Android Studio 中构建

1. 打开 Android Studio
2. 选择 "Open an existing Android Studio project"
3. 选择项目中的 `android` 文件夹
4. 等待 Gradle 同步完成
5. 在顶部菜单选择 "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
6. 构建完成后，APK 文件位于：
   `android/app/build/outputs/apk/debug/app-debug.apk`

#### 方法二：构建 Release 版本

1. 在 Android Studio 中选择 "Build" → "Generate Signed Bundle / APK"
2. 选择 "APK"
3. 配置签名密钥（如果没有，请创建新密钥）
4. 选择 "release" 构建变体
5. 构建完成后，APK 文件位于：
   `android/app/build/outputs/apk/release/app-release.apk`

### 5. 使用命令行构建

#### Debug 版本

```bash
cd android
./gradlew assembleDebug
```

APK 文件位于：
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Release 版本

需要先配置签名密钥，然后执行：

```bash
cd android
./gradlew assembleRelease
```

APK 文件位于：
`android/app/build/outputs/apk/release/app-release.apk`

## 配置签名密钥 (Release 版本)

### 方法一：使用 Android Studio

1. 在 Android Studio 中选择 "Build" → "Generate Signed Bundle / APK"
2. 选择 "Create new..." 创建新密钥库
3. 填写密钥信息并保存
4. 使用该密钥构建 Release APK

### 方法二：使用 Gradle 配置

在 `android/keystores/` 目录下放置你的密钥文件，然后修改 `android/app/build.gradle` 配置签名。

## 安装应用

### 在 Android 设备上安装

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

或者使用 Android Studio 的 "Run" 按钮直接在设备/模拟器上运行。

## 常见问题

### 1. Gradle 下载超时

如果遇到 Gradle 下载超时，可以：

- 配置 Gradle 镜像源
- 使用代理
- 或者在 Android Studio 中配置 Gradle 代理设置

### 2. Java 版本不匹配

确保使用正确的 Java 版本（JDK 17+），可以在 Android Studio 的设置中配置：
`File` → `Settings` → `Build, Execution, Deployment` → `Build Tools` → `Gradle` → `Gradle JDK`

### 3. 依赖下载失败

- 检查网络连接
- 配置阿里云或其他镜像源
- 使用代理

## 更新应用内容

当你修改了 Web 应用后，需要重新构建和同步：

```bash
npm run build
npx cap sync android
```

然后在 Android Studio 中重新构建 APK 即可。

## 技术栈

- **Capacitor** (跨平台框架)
- **React** (前端框架)
- **Vite** (构建工具)
- **Gradle** (Android 构建系统)

# EmbyTok Android 应用构建指南

## 环境要求

构建 EmbyTok Android 应用需要以下环境：

- **Node.js** (v18 或更高)
- **Java JDK** (v17 或更高)
- **Android Studio** (最新稳定版)
- **Android SDK** (API 33+)
- **Android SDK Build-Tools** (33.0+)
- **Gradle** (已包含在项目中)

## 重要提示：应用签名

### 为什么需要固定签名？

Android 应用使用签名来验证身份。如果每次构建使用不同的签名，安装时会提示 "同名应用签名不同" 或 "安装失败"。

**解决方法：** 请先阅读 [ANDROID_SIGNING_GUIDE.md](ANDROID_SIGNING_GUIDE.md) 配置固定的签名密钥。

## 快速开始（推荐）

使用自动构建脚本一键构建：

### 方式一：自动构建脚本（Linux/Mac）

```bash
./build-android.sh
```

### 方式二：手动一步步构建

## 构建步骤

### 0. 配置签名密钥（重要！）

**在开始构建前，请先配置签名密钥：**

1. 进入 `android` 目录
2. 复制示例配置：`cp keystore.properties.example keystore.properties`
3. 编辑 `keystore.properties`，填入你的密钥信息
4. 如果还没有密钥，生成一个：
   ```bash
   keytool -genkey -v -keystore release.keystore -alias embytok -keyalg RSA -keysize 2048 -validity 10000
   ```

详细说明请参考 [ANDROID_SIGNING_GUIDE.md](ANDROID_SIGNING_GUIDE.md)

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
**注意：** 必须先配置签名密钥（见步骤 0），然后执行：
```bash
cd android
./gradlew assembleRelease
```
APK 文件位于：
`android/app/build/outputs/apk/release/app-release.apk`

## 配置签名密钥 (Release 版本)

### 方法一：使用 Gradle 配置（推荐）

我们已经配置好了 Gradle 签名，只需要：

1. 生成签名密钥（如果还没有）：
   ```bash
   cd android
   keytool -genkey -v -keystore release.keystore -alias embytok -keyalg RSA -keysize 2048 -validity 10000
   ```

2. 复制并编辑配置文件：
   ```bash
   cp keystore.properties.example keystore.properties
   # 编辑 keystore.properties 填入实际信息
   ```

3. 直接构建即可：
   ```bash
   ./gradlew assembleRelease
   ```

### 方法二：使用 Android Studio 界面

1. 在 Android Studio 中选择 "Build" → "Generate Signed Bundle / APK"
2. 选择 "Create new..." 创建新密钥库
3. 填写密钥信息并保存
4. 使用该密钥构建 Release APK

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

### 4. 应用签名问题

如果遇到 "同名应用签名不同" 错误：
- 请确保每次构建使用相同的签名密钥
- 参考 [ANDROID_SIGNING_GUIDE.md](ANDROID_SIGNING_GUIDE.md)
- 如需更换密钥，请先卸载旧版本再安装

### 5. 密钥丢失或遗忘

非常遗憾，无法恢复丢失的密钥或密码。您需要：
1. 生成新的签名密钥
2. 要求用户卸载旧版本
3. 安装使用新签名的版本

**重要：** 请务必妥善保管您的签名密钥！

## 更新应用内容

当你修改了 Web 应用后，需要重新构建和同步：

```bash
npm run build
npx cap sync android
```

然后在 Android Studio 中重新构建 APK 即可。

## 更新应用版本

每次发布新版本时，请更新：
1. `package.json` 中的 `version` 字段
2. `android/app/build.gradle` 中的 `versionCode`（递增）和 `versionName`

当前版本：
- 版本号 (versionCode): 3
- 版本名 (versionName): 1.9.0

## 技术栈

- **Capacitor** (跨平台框架)
- **React** (前端框架)
- **Vite** (构建工具)
- **Gradle** (Android 构建系统)

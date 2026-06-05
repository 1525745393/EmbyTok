# Android 应用签名指南

## 问题说明

如果在更新应用时遇到 "同名应用签名不同" / "安装失败" 的错误，是因为每次构建都使用了不同的签名密钥。本指南将帮助您配置固定的签名密钥。

## 解决方案

### 步骤 1：生成签名密钥

如果您还没有签名密钥，请在 `android` 目录下执行以下命令：

```bash
cd android
keytool -genkey -v -keystore release.keystore -alias embytok -keyalg RSA -keysize 2048 -validity 10000
```

按提示填写信息，记住设置的密码和别名。

### 步骤 2：配置签名密钥

1. 复制示例配置文件：

```bash
cd android
cp keystore.properties.example keystore.properties
```

2. 编辑 `keystore.properties` 文件，填入实际的密钥信息：

```properties
storeFile=release.keystore
storePassword=your-store-password
keyAlias=embytok
keyPassword=your-key-password
```

**重要提示：**
- `storeFile` 为相对路径，相对于 `android` 目录
- 确保 `release.keystore` 文件位于 `android` 目录下

### 步骤 3：构建应用

回到项目根目录，运行构建命令：

```bash
cd ..
./build-android.sh
```

或者使用 Capacitor 构建：

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

## 密钥管理

### 备份密钥

**务必妥善保管签名密钥！** 密钥丢失将无法更新应用。

建议：
- 将 `release.keystore` 和 `keystore.properties` 备份到安全的位置
- 不要将这两个文件提交到 Git 仓库（它们已在 .gitignore 中）

### 密钥格式说明

| 项目 | 说明 |
|------|------|
| `storeFile` | 密钥库文件路径 |
| `storePassword` | 密钥库密码 |
| `keyAlias` | 密钥别名 |
| `keyPassword` | 密钥密码（通常与库密码相同） |

## 从旧版本迁移

如果您已安装过旧版本的应用：

1. 备份您的数据
2. 卸载旧版本
3. 安装使用新签名的版本
4. 恢复数据

## 版本号更新说明

当前版本信息：
- `versionCode`: 3
- `versionName`: 1.9.0

每次发布新版本时：
- `versionCode` 需要递增（整数）
- `versionName` 与 `package.json` 中的版本保持一致

## 常见问题

### Q: 构建时提示找不到 keystore？
A: 确保 `keystore.properties` 和 `release.keystore` 都在 `android` 目录下。

### Q: 忘记密钥密码了？
A: 非常遗憾，无法恢复。您需要生成新密钥并要求用户重新安装应用。

### Q: 可以同时保留 debug 和 release 签名吗？
A: 可以，但本配置已统一使用 release 签名，确保所有构建签名一致。

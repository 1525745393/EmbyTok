# EmbyTok 发布指南

本指南描述了如何使用自动化发布流程来发布 EmbyTok 的新版本。

## 目录

- [发布前准备](#发布前准备)
- [版本管理](#版本管理)
- [自动发布](#自动发布)
- [手动发布](#手动发布)
- [预发布](#预发布)
- [本地测试](#本地测试)

## 发布前准备

在发布新版本之前，请确保完成以下步骤：

### 1. 更新 CHANGELOG.md

在 `CHANGELOG.md` 中添加新版本的更新说明，格式如下：

```markdown
## v1.11.0

**日期**: 2024-01-15

### 🚀 新功能与优化

- 功能 1
- 功能 2

### 🔧 技术改进

- 改进 1

### 📁 文件更新

- 文件 1
```

### 2. 运行发布前检查

```bash
npm run release:check
```

这将检查：

- 版本号格式
- CHANGELOG 是否已更新
- Git 工作区是否干净
- TypeScript 类型检查
- 所有测试是否通过
- 项目是否能正常构建

如需跳过某些检查：

```bash
# 跳过测试
npm run release:check -- --skip-tests

# 跳过构建
npm run release:check -- --skip-build

# 跳过 Git 检查
npm run release:check -- --skip-git
```

## 版本管理

### 查看当前版本

```bash
npm run version:current
```

### 自动升级版本

```bash
# 升级补丁版本 (1.0.0 -> 1.0.1)
npm run version:patch

# 升级次版本 (1.0.0 -> 1.1.0)
npm run version:minor

# 升级主版本 (1.0.0 -> 2.0.0)
npm run version:major
```

这些命令会自动：

- 更新 `package.json` 中的版本号
- 在 `CHANGELOG.md` 中添加新版本条目模板

### 手动设置版本

```bash
# 设置特定版本
npm run version:set 1.11.0
```

## 自动发布

### 触发方式

当代码推送到 `main` 分支时（排除 Markdown 文件变更），会自动触发发布流程。

### 工作流程

1. **运行测试** - 执行单元测试、类型检查、代码格式化检查
2. **提取版本** - 从 `package.json` 读取版本号
3. **检查标签** - 确认该版本尚未发布
4. **构建 Docker** - 构建并推送 Docker 镜像
5. **构建 Android** - 构建 Android APK
6. **生成说明** - 从 CHANGELOG 提取发布说明
7. **创建发布** - 创建 GitHub Release 并上传 APK

## 手动发布

通过 GitHub Actions 手动触发发布：

### 步骤

1. 进入项目的 GitHub 仓库
2. 点击 **Actions** 标签页
3. 选择 **Release** 工作流
4. 点击 **Run workflow** 按钮
5. 填写参数：
   - **Version**（可选）: 指定版本号，留空则使用 package.json 中的版本
   - **Create GitHub Release**: 是否创建 GitHub Release
   - **Push Docker image**: 是否推送 Docker 镜像
   - **Build Android APK**: 是否构建 Android APK
6. 点击 **Run workflow** 开始发布

### 手动发布前的本地步骤

```bash
# 1. 确保在 main 分支
git checkout main
git pull origin main

# 2. 更新版本号
npm run version:patch

# 3. 更新 CHANGELOG.md（编辑文件，填写真实内容）

# 4. 运行检查
npm run release:check

# 5. 提交变更
git add package.json CHANGELOG.md
git commit -m "chore: release v1.11.0"
git push origin main
```

然后触发 GitHub Actions 的 Release 工作流。

## 预发布

预发布版本用于测试新功能，不推荐生产环境使用。

### 创建预发布

1. 进入项目的 GitHub 仓库
2. 点击 **Actions** 标签页
3. 选择 **Pre-release** 工作流
4. 点击 **Run workflow** 按钮
5. 填写参数：
   - **Version suffix**: 版本后缀，如 `beta.1`、`rc.2`
   - **Build Android APK**: 是否构建 APK
   - **Create Pre-release**: 是否创建预发布
6. 点击 **Run workflow**

预发布版本号格式：`v1.11.0-beta.1`

## 本地测试

### 生成发布说明预览

```bash
npm run changelog:generate
```

### 本地构建 Android APK

```bash
# 使用项目脚本
./build-android.sh

# 或手动执行
npm run build
npm run cap:sync
cd android
./gradlew assembleRelease
```

### 本地构建 Docker 镜像

```bash
./build-docker-image-offline.sh
```

## 发布产物

每次成功发布后，会生成以下产物：

### GitHub Release

- 页面: `https://github.com/[owner]/[repo]/releases/tag/v[version]`
- 包含:
  - Android APK 下载
  - 完整的更新说明
  - Docker 镜像拉取命令

### Docker Hub

- 镜像标签:
  - `[username]/embytok:[version]`
  - `[username]/embytok:latest`
- 平台: `linux/amd64`, `linux/arm64`

### GitHub Actions Artifacts

- Android APK (保留 30 天)
- 测试覆盖率报告

## 常见问题

### Q: 发布失败了怎么办？

A: 检查 GitHub Actions 日志，根据错误信息修复问题。常见原因：

- 测试失败
- Docker Hub 认证失败
- CHANGELOG 格式错误

### Q: 可以重新发布同一个版本吗？

A: 不可以。工作流会检查标签是否已存在，避免重复发布。如需重新发布，请先删除已有标签。

### Q: 如何发布修复版本？

A: 使用 `npm run version:patch` 升级补丁版本，然后按照手动发布步骤操作。

### Q: 预发布版本会覆盖 latest 标签吗？

A: 不会。预发布工作流不会推送 Docker 镜像，也不会覆盖 latest 标签。

## Android 签名配置

为了构建带有正确签名的 Release APK，需要在 GitHub 仓库中配置以下 Secrets：

### 配置步骤

1. **获取 keystore 文件的 Base64 编码**

   ```bash
   # 在项目根目录执行
   base64 -w 0 android/app/embytok-release.keystore
   ```

2. **在 GitHub 仓库中配置 Secrets**
   - 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
   - 点击 **New repository secret** 添加以下 Secrets：

     | Secret 名称                 | 说明                        | 示例值     |
     | --------------------------- | --------------------------- | ---------- |
     | `ANDROID_KEYSTORE`          | keystore 文件的 Base64 编码 | (长字符串) |
     | `ANDROID_KEYSTORE_PASSWORD` | keystore 密码               | embytok123 |
     | `ANDROID_KEY_ALIAS`         | key 别名                    | embytok    |
     | `ANDROID_KEY_PASSWORD`      | key 密码                    | embytok123 |

### 签名说明

- **Debug APK**: 使用 Android 默认调试签名，适合开发测试
- **Release APK**: 使用项目配置的正式签名，适合发布和生产环境
- **签名不匹配**: 如果手机上已安装不同签名的版本，需要先卸载再安装

### 本地构建 Release APK

```bash
# 使用脚本构建 Release 版本
./build-android.sh release

# 或构建 Debug 版本
./build-android.sh debug
```

## 相关文件

- `.github/workflows/release.yml` - 正式发布工作流
- `.github/workflows/pre-release.yml` - 预发布工作流
- `scripts/version-manager.js` - 版本管理工具
- `scripts/extract-changelog.js` - CHANGELOG 提取工具
- `scripts/pre-release-check.js` - 发布前检查脚本
- `build-android.sh` - Android 构建脚本
- `android/app/build.gradle` - Android 构建配置
- `CHANGELOG.md` - 版本更新日志

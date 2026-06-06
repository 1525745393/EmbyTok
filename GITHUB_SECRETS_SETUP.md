# GitHub Secrets 配置指南

## 📋 概述

本指南详细说明如何在 GitHub 仓库中配置 Android 签名所需的 Secrets，以便 GitHub Actions 能够自动构建 Release APK。

---

## 🔑 需要配置的 Secrets

在你的 GitHub 仓库中添加以下 4 个 Secrets：

| Secret 名称                 | 说明                        | 值           |
| --------------------------- | --------------------------- | ------------ |
| `ANDROID_KEYSTORE`          | keystore 文件的 Base64 编码 | (见下方)     |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码               | `embytok123` |
| `ANDROID_KEY_ALIAS`         | key 别名                    | `embytok`    |
| `ANDROID_KEY_PASSWORD`      | key 密码                    | `embytok123` |

---

## 📝 ANDROID_KEYSTORE 的值

```
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
```

---

## 🚀 配置步骤

### 1. 打开你的 GitHub 仓库

访问你的 EmbyTok 仓库页面

### 2. 进入 Secrets 设置

- 点击仓库顶部的 **Settings**
- 在左侧菜单中找到 **Secrets and variables**
- 点击 **Actions**

### 3. 添加 Secrets

点击 **New repository secret** 按钮，依次添加以下 4 个 Secrets：

#### 第一个 Secret：ANDROID_KEYSTORE

- **Name**: `ANDROID_KEYSTORE`
- **Value**: 将上面大段的 Base64 字符串完整复制粘贴进去（包括开头和结尾）
- 点击 **Add secret**

#### 第二个 Secret：ANDROID_KEYSTORE_PASSWORD

- **Name**: `ANDROID_KEYSTORE_PASSWORD`
- **Value**: `embytok123`
- 点击 **Add secret**

#### 第三个 Secret：ANDROID_KEY_ALIAS

- **Name**: `ANDROID_KEY_ALIAS`
- **Value**: `embytok`
- 点击 **Add secret**

#### 第四个 Secret：ANDROID_KEY_PASSWORD

- **Name**: `ANDROID_KEY_PASSWORD`
- **Value**: `embytok123`
- 点击 **Add secret**

### 4. 验证配置

完成后，你应该在 Secrets 列表中看到这 4 个 Secrets（但不会显示具体的值，这是正常的）。

---

## ✅ 配置完成后

配置完成后，你就可以：

1. **触发 GitHub Actions Release 工作流**
   - 进入仓库的 **Actions** 标签页
   - 选择 **Release** 工作流
   - 点击 **Run workflow** 按钮
   - 选择分支并运行

2. **等待构建完成**
   - 工作流会自动运行测试
   - 构建 Docker 镜像
   - 构建 Debug 和 Release APK
   - 创建 GitHub Release

3. **下载 Release APK**
   - 构建完成后，在 Release 页面会有两个 APK：
     - `EmbyTok-v1.10.1-release.apk`（推荐安装，正式签名）
     - `EmbyTok-v1.10.1-debug.apk`（调试签名）

---

## 📌 重要提示

- **不要泄露这些 Secrets**，特别是 `ANDROID_KEYSTORE`
- 如果 keystore 文件有更新，需要重新生成 Base64 编码并更新 Secrets
- Release APK 使用的是与项目本地构建相同的签名，可以正常更新安装

---

## 🔄 重新生成 Base64 编码（如果需要）

如果你更新了 keystore 文件，可以重新生成 Base64 编码：

```bash
cd /workspace
base64 -w 0 android/app/embytok-release.keystore
```

然后将新生成的字符串更新到 GitHub Secrets 中。

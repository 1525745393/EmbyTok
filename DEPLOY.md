# EmbyTok v1.9.1 部署指南

## 📦 获取安装包

### 方式1: GitHub Actions 自动构建（推荐）
GitHub Actions 正在自动构建，请等待 10-30 分钟：

- **APK 下载**: https://github.com/1525745393/EmbyTok/releases/tag/v1.9.1
- **Docker 镜像**: https://hub.docker.com/r/1525745393/embytok

### 方式2: 使用 Docker 镜像（最简单）

#### 拉取并运行 Docker 镜像

```bash
# 拉取镜像
docker pull 1525745393/embytok:1.9.1

# 或者使用 latest
docker pull 1525745393/embytok:latest

# 运行容器
docker run -d \
  --name embytok \
  -p 8080:80 \
  --restart unless-stopped \
  1525745393/embytok:1.9.1
```

#### 访问应用
打开浏览器访问: http://localhost:8080

#### Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3'
services:
  embytok:
    image: 1525745393/embytok:1.9.1
    container_name: embytok
    ports:
      - "8080:80"
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

### 方式3: 部署 Web 版本

#### 使用 Nginx 部署已构建的文件

项目已经构建好了，在 `dist` 目录中：

```bash
# 将 dist 目录复制到 Nginx 目录
cp -r dist/* /var/www/embytok/

# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/embytok;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📱 Android APK 安装

### APK 签名配置（重要）

如果要自己构建 APK，请先配置签名密钥：

```bash
cd android

# 生成签名密钥（如果还没有）
keytool -genkey -v -keystore release.keystore -alias embytok \
  -keyalg RSA -keysize 2048 -validity 10000

# 复制配置文件
cp keystore.properties.example keystore.properties

# 编辑 keystore.properties，填入你的密钥信息
```

### 手动构建 APK

```bash
# 1. 构建前端
npm run build

# 2. 同步 Capacitor
npx cap sync android

# 3. 构建 APK
cd android
./gradlew assembleDebug

# APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔄 版本更新

### Docker 更新

```bash
# 拉取新版本
docker pull 1525745393/embytok:1.9.1

# 停止旧容器
docker stop embytok
docker rm embytok

# 启动新容器
docker run -d \
  --name embytok \
  -p 8080:80 \
  --restart unless-stopped \
  1525745393/embytok:1.9.1
```

### Web 更新

```bash
# 拉取最新代码
git pull

# 重新构建
npm run build

# 部署新的 dist 文件
cp -r dist/* /var/www/embytok/
```

## 📋 v1.9.1 更新内容

### 主要功能
- ✅ 播放历史记录
- ✅ 实时搜索 + 搜索历史
- ✅ 收藏分类管理
- ✅ 字幕支持
- ✅ Android 签名修复

### 快速开始

1. 访问应用（Web 或 APK）
2. 配置你的 Emby/Jellyfin 服务器地址
3. 登录并开始使用

## 🆘 常见问题

### Q: APK 下载不到？
A: 等待 GitHub Actions 构建完成，通常需要 10-30 分钟。查看构建状态：
https://github.com/1525745393/EmbyTok/actions

### Q: 如何查看 Actions 构建状态？
A: 访问 https://github.com/1525745393/EmbyTok/actions

### Q: Docker 镜像拉取失败？
A: 确保网络可以访问 Docker Hub，或者使用国内镜像源。

### Q: 构建时提示 Java 版本错误？
A: 需要使用 JDK 17 或 21。当前环境是 JDK 25，可能需要降级。

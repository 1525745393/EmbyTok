# Docker Hub 发布指南

## 📋 前置准备

### 1. 确认 Docker 已安装
```bash
docker --version
```

### 2. 登录 Docker Hub
```bash
# 使用您的 Docker Hub 账户登录
docker login

# 或者使用访问令牌（推荐）
docker login -u yourusername
```

## 🚀 发布步骤

### 方法一：手动发布（推荐）

```bash
# 1. 构建镜像
docker build -t embytok:1.3.0 .

# 2. 标记镜像（使用您的用户名）
# 替换 yourusername 为您的 Docker Hub 用户名
docker tag embytok:1.3.0 yourusername/embytok:1.3.0
docker tag embytok:1.3.0 yourusername/embytok:latest

# 3. 推送到 Docker Hub
docker push yourusername/embytok:1.3.0
docker push yourusername/embytok:latest
```

### 方法二：使用自动化脚本

我已为您创建了 `docker-publish.sh` 脚本：

```bash
# 1. 编辑脚本，配置您的用户名
nano docker-publish.sh
# 将 DOCKER_USERNAME="yourusername" 修改为您的用户名

# 2. 使脚本可执行
chmod +x docker-publish.sh

# 3. 执行发布
./docker-publish.sh
```

## 📝 推荐的仓库名称

建议使用以下名称之一：

```
yourusername/embytok
yourusername/embytok-web
```

## 📖 发布后检查

### 1. 验证镜像
```bash
# 拉取您的镜像进行测试
docker pull yourusername/embytok:1.3.0

# 运行测试
docker run -d -p 8080:80 --name embytok-test yourusername/embytok:1.3.0

# 访问 http://localhost:8080 检查是否正常
```

### 2. 在 Docker Hub 页面查看
访问：`https://hub.docker.com/r/yourusername/embytok`

## 📦 Docker Hub 仓库说明

发布完成后，建议在 Docker Hub 页面添加：

### 仓库描述
```
EmbyTok - Emby 视频播放网页版，像 TikTok 一样刷视频

功能特点：
- 📺 TikTok 风格的垂直视频流
- 🔗 连接您的 Emby 服务器
- ❤️ 收藏功能
- 📱 手机端优化
- 🔄 滑动切换
- ⚡ 极速加载
```

### 标签说明
- `1.3.0` - 当前版本
- `latest` - 最新稳定版本

## 🔄 后续更新发布

当有新版本时：

```bash
# 更新版本号
# 编辑 package.json，更新 version 字段
# 编辑 docker-publish.sh，更新 VERSION 字段

# 重新发布
./docker-publish.sh
```

## 📄 快速参考

### 完整命令序列
```bash
# 1. 登录
docker login

# 2. 构建
docker build -t embytok:1.3.0 .

# 3. 标记
docker tag embytok:1.3.0 yourusername/embytok:1.3.0
docker tag embytok:1.3.0 yourusername/embytok:latest

# 4. 推送
docker push yourusername/embytok:1.3.0
docker push yourusername/embytok:latest
```

### 用户使用您的镜像
```bash
# 拉取并运行
docker run -d -p 8080:80 --name embytok yourusername/embytok:latest
```

## 📞 故障排除

### 问题：认证失败
```
Error: unauthorized: authentication required
```
**解决**：确保已执行 `docker login` 并使用正确的凭证

### 问题：权限被拒绝
```
denied: requested access to the resource is denied
```
**解决**：确认您有该仓库的写入权限

### 问题：镜像不存在
```
manifest unknown
```
**解决**：先推送镜像，再尝试拉取

# GitHub Container Registry 发布指南

## 📋 当前状态

✅ 已创建 GitHub Actions 工作流 `.github/workflows/ghcr-publish.yml`
✅ 已创建 git tag `v1.3.0`

## 🚀 完成发布的步骤

### 1. 推送代码和标签到 GitHub

```bash
# 推送代码
git push

# 推送标签（触发 GHCR 发布）
git push origin v1.3.0
```

### 2. 等待 GitHub Actions 构建完成

推送标签后，GitHub Actions 会自动：
- 检出代码
- 构建 Docker 镜像（支持 amd64 和 arm64）
- 推送到 GitHub Container Registry

### 3. 查看发布结果

访问 GitHub Actions 页面查看构建状态：
```
https://github.com/<your-username>/<your-repo>/actions
```

## 📦 使用发布的镜像

### 拉取镜像
```bash
docker pull ghcr.io/<your-username>/embytok:1.3.0
docker pull ghcr.io/<your-username>/embytok:latest
```

### 运行容器
```bash
docker run -d \
  --name embytok \
  -p 8080:80 \
  --restart unless-stopped \
  ghcr.io/<your-username>/embytok:latest
```

## 🔄 后续发布

### 创建新版本
```bash
# 1. 更新 package.json 中的版本号
# 2. 提交更改
git add package.json
git commit -m "chore: bump version to x.x.x"

# 3. 创建标签
git tag -a vx.x.x -m "Release vx.x.x"

# 4. 推送
git push
git push origin vx.x.x
```

## 📄 可用的标签

- `1.3.0` - 具体版本号
- `1.3` - 主版本.次版本
- `latest` - 最新版本

## 🌐 镜像位置

发布成功后，镜像可在以下位置找到：
```
https://github.com/<your-username>/<your-repo>/pkgs/container/embytok
```

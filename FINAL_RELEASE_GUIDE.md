# 🎉 EmbyTok v1.3.0 最终发布指南

## ✅ 已完成的工作

### 📦 版本准备
- ✅ 更新版本号到 1.3.0
- ✅ 创建 git tag `v1.3.0`
- ✅ 所有代码已提交

### 📄 文档准备
- ✅ [RELEASE_NOTES.md](RELEASE_NOTES.md) - 详细发布说明
- ✅ [RELEASE_SUMMARY.md](RELEASE_SUMMARY.md) - 发布总结
- ✅ [DOCKER_HUB_PUBLISH.md](DOCKER_HUB_PUBLISH.md) - Docker Hub 发布指南
- ✅ [GHCR_PUBLISH_GUIDE.md](GHCR_PUBLISH_GUIDE.md) - GitHub Container Registry 发布指南
- ✅ [docker-publish.sh](docker-publish.sh) - Docker Hub 自动化脚本

### 🔧 CI/CD 配置
- ✅ 现有 [docker-build-push.yml](.github/workflows/docker-build-push.yml) - Docker Hub 工作流
- ✅ 新增 [ghcr-publish.yml](.github/workflows/ghcr-publish.yml) - GHCR 工作流

---

## 🚀 选择发布方式

### 方式一：GitHub Container Registry (GHCR) - 推荐 ✨

**优点：**
- 无需额外配置 Docker Hub 凭证
- 自动使用 GitHub 身份验证
- 与仓库集成更好

**步骤：**

```bash
# 1. 推送代码和标签到 GitHub
git push
git push origin v1.3.0

# 2. 等待 GitHub Actions 完成
# 访问: https://github.com/<your-username>/<your-repo>/actions

# 3. 使用镜像
docker pull ghcr.io/<your-username>/embytok:1.3.0
docker pull ghcr.io/<your-username>/embytok:latest
```

---

### 方式二：Docker Hub

**需要：**
- Docker Hub 账户
- 在仓库设置中配置 `DOCKER_HUB_USERNAME` 和 `DOCKER_HUB_ACCESS_TOKEN` secrets

**步骤：**

```bash
# 1. 推送代码到 main 分支
git push

# 2. 工作流将自动触发
# 或手动运行: https://github.com/<your-username>/<your-repo>/actions

# 3. 使用镜像
docker pull <your-dockerhub-username>/embytok:1.3.0
docker pull <your-dockerhub-username>/embytok:latest
```

---

### 方式三：本地手动发布

**需要：**
- 本地安装 Docker
- Docker Hub 或其他 registry 账户

**步骤：**

```bash
# 1. 拉取代码
git clone <your-repo>
cd <repo-dir>
git checkout v1.3.0

# 2. 使用脚本发布
nano docker-publish.sh  # 配置用户名
./docker-publish.sh

# 或手动
docker build -t embytok:1.3.0 .
docker tag embytok:1.3.0 <your-username>/embytok:1.3.0
docker push <your-username>/embytok:1.3.0
```

---

## 📊 发布检查清单

- [ ] 推送代码到 GitHub
- [ ] 推送 `v1.3.0` 标签
- [ ] 确认 GitHub Actions 成功运行
- [ ] 验证镜像可以正常拉取
- [ ] 测试容器运行正常
- [ ] 更新 README 中的镜像地址（可选）

---

## 📖 详细文档

- [GHCR 发布指南](GHCR_PUBLISH_GUIDE.md)
- [Docker Hub 发布指南](DOCKER_HUB_PUBLISH.md)
- [发布说明](RELEASE_NOTES.md)

---

## 🎯 快速开始（使用 GHCR）

```bash
# 1. 推送
git push
git push origin v1.3.0

# 2. 等待 5-10 分钟让 Actions 完成

# 3. 运行
docker run -d -p 8080:80 ghcr.io/<your-username>/embytok:latest

# 4. 访问 http://localhost:8080
```

---

## 🎉 完成！

选择一种方式完成发布后，您的 EmbyTok v1.3.0 就可以被全世界使用了！

**祝发布顺利！** 🚀

# 故障排查指南

## 问题：GitHub Actions 失败

### 可能的原因

1. **Docker Hub Secrets 未配置**
   - 如果使用 docker-build-push.yml，需要在仓库设置中配置：
     - `DOCKER_HUB_USERNAME`
     - `DOCKER_HUB_ACCESS_TOKEN`

2. **工作流配置问题**
   - 我们现在有两个工作流：
     - `docker-build-push.yml` - 推送到 Docker Hub（需要 secrets）
     - `ghcr-simple.yml` - 推送到 GHCR（使用 GITHUB_TOKEN，推荐）

### 解决方案

#### 使用 GHCR（推荐，无需额外配置）

GHCR 使用 GitHub 的内置令牌，不需要额外配置。

**步骤：**

1. 禁用 Docker Hub 工作流（可选）：
   - 前往 https://github.com/1525745393/EmbyTok/actions/workflows/docker-build-push.yml
   - 点击 "Disable workflow"

2. 重新触发 GHCR 工作流：
   - 前往 https://github.com/1525745393/EmbyTok/actions/workflows/ghcr-simple.yml
   - 点击 "Run workflow"
   - 选择 main 分支，点击 "Run workflow"

#### 或者，配置 Docker Hub Secrets

如果您想使用 Docker Hub：

1. 前往 https://hub.docker.com/settings/security
2. 创建一个新的 Access Token
3. 前往 https://github.com/1525745393/EmbyTok/settings/secrets/actions
4. 添加两个 secrets：
   - `DOCKER_HUB_USERNAME` = 您的 Docker Hub 用户名
   - `DOCKER_HUB_ACCESS_TOKEN` = 刚才创建的 token

### 手动触发工作流

您也可以手动运行工作流：

1. 前往 https://github.com/1525745393/EmbyTok/actions
2. 选择 "GHCR Simple Publish"
3. 点击 "Run workflow"
4. 选择分支，点击 "Run workflow"

### 查看失败日志

1. 前往 https://github.com/1525745393/EmbyTok/actions
2. 点击失败的工作流运行
3. 点击具体的 job
4. 查看每个步骤的日志输出

---

## 本地验证 Docker 构建

如果 GitHub Actions 持续失败，可以在本地先测试：

```bash
# 本地构建测试
docker build -t embytok:test .

# 运行测试
docker run -d -p 8080:80 --name embytok-test embytok:test

# 访问 http://localhost:8080 验证
```

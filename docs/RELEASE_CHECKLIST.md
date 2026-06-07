# 发布前检查清单

在发布新版本之前，请确保完成以下所有检查项目。

## 目录

- [快速检查](#快速检查)
- [详细检查](#详细检查)
- [发布流程](#发布流程)
- [紧急修复流程](#紧急修复流程)

## 快速检查

使用快速检查命令自动验证：

```bash
npm run release:check
```

## 详细检查

### 1. 代码质量

- [ ] 所有单元测试通过
  ```bash
  npm run test:run
  ```
- [ ] TypeScript 类型检查通过
  ```bash
  npx tsc --noEmit
  ```
- [ ] 代码格式化检查通过
  ```bash
  npx prettier --check .
  ```
- [ ] （可选）运行 E2E 测试
  ```bash
  npm run test:e2e
  ```

### 2. 版本管理

- [ ] 版本号已正确升级
  ```bash
  npm run version:current
  ```
- [ ] 版本号符合语义化版本规范
- [ ] package.json 中的版本号正确
- [ ] CHANGELOG.md 已更新
- [ ] CHANGELOG.md 包含本次发布的所有变更
- [ ] CHANGELOG.md 日期正确
- [ ] CHANGELOG.md 变更分类正确（Added/Changed/Fixed 等）

### 3. Git 状态

- [ ] 在 main 分支上
  ```bash
  git branch
  ```
- [ ] 工作区干净，没有未提交的变更
  ```bash
  git status
  ```
- [ ] 已从远程拉取最新代码
  ```bash
  git pull origin main
  ```
- [ ] 没有与远程的冲突
- [ ] 所有变更已提交
- [ ] 提交信息符合规范

### 4. 构建验证

- [ ] 项目能正常构建
  ```bash
  npm run build
  ```
- [ ] 构建产物完整
- [ ] 没有构建警告或错误
- [ ] （可选）Android APK 能正常构建
  ```bash
  npm run build:app
  ```
- [ ] （可选）Docker 镜像能正常构建
  ```bash
  docker build -t embytok:test .
  ```

### 5. 功能验证

- [ ] 应用能正常启动
- [ ] 核心功能正常工作
- [ ] 登录功能正常
- [ ] 视频播放功能正常
- [ ] 搜索功能正常
- [ ] 收藏功能正常
- [ ] 播放历史功能正常
- [ ] 字幕功能正常
- [ ] 设置功能正常
- [ ] 移动端适配正常
- [ ] 没有明显的视觉或交互 bug

### 6. 文档检查

- [ ] README.md 已更新（如有必要）
- [ ] 相关文档已更新
- [ ] 安装说明正确
- [ ] 使用说明正确
- [ ] API 文档已更新（如有 API 变更）

### 7. 安全检查

- [ ] 没有已知的安全漏洞
- [ ] 依赖项已更新到安全版本
  ```bash
  npm audit
  ```
- [ ] 敏感信息没有提交到仓库
- [ ] API 密钥等敏感信息使用环境变量

### 8. 发布准备

- [ ] GitHub Secrets 已正确配置
- [ ] 签名密钥可用（Android）
- [ ] Docker Hub 凭证可用
- [ ] 备份了必要的文件

## 发布流程

### 标准发布流程

1. [ ] 完成上述所有检查项目
2. [ ] 执行版本升级
   ```bash
   npm run version:patch  # 或 minor/major
   ```
3. [ ] 填写 CHANGELOG.md
4. [ ] 提交变更
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to v1.x.x"
   ```
5. [ ] 创建 Git 标签
   ```bash
   git tag -a v1.x.x -m "Release version 1.x.x"
   ```
6. [ ] 推送到远程
   ```bash
   git push origin main
   git push origin v1.x.x
   ```
7. [ ] 等待 GitHub Actions 完成
8. [ ] 验证发布成功
   - 检查 GitHub Release 是否已创建
   - 检查 APK 是否已上传
   - 检查 Docker 镜像是否已推送
9. [ ] 通知相关人员

### 手动发布流程

如果需要手动触发发布：

1. [ ] 访问仓库 Actions 页面
2. [ ] 选择 "Build and Release" 工作流
3. [ ] 点击 "Run workflow"
4. [ ] 输入版本号
5. [ ] 选择是否为预发布版本
6. [ ] 点击 "Run workflow" 按钮
7. [ ] 等待工作流完成
8. [ ] 验证发布结果

## 紧急修复流程

### Hotfix 发布流程

1. [ ] 从最新的正式版本标签创建 hotfix 分支
   ```bash
   git checkout -b hotfix/issue-123 v1.10.8
   ```
2. [ ] 修复问题
3. [ ] 测试修复
4. [ ] 升级 patch 版本号
   ```bash
   npm run version:patch
   ```
5. [ ] 更新 CHANGELOG.md
6. [ ] 提交变更
   ```bash
   git add .
   git commit -m "fix: urgent fix for issue #123"
   ```
7. [ ] 创建标签
   ```bash
   git tag -a v1.10.9 -m "Hotfix release 1.10.9"
   ```
8. [ ] 合并到 main 分支
   ```bash
   git checkout main
   git merge hotfix/issue-123
   ```
9. [ ] 推送到远程
   ```bash
   git push origin main
   git push origin v1.10.9
   ```

## 发布后检查

发布完成后，请验证：

- [ ] GitHub Release 页面显示正常
- [ ] APK 文件已正确上传
- [ ] Docker 镜像已推送到 Docker Hub
- [ ] 发布说明完整
- [ ] 下载链接有效
- [ ] 版本号正确显示
- [ ] 用户能正常下载和安装

## 回滚流程

如果发现严重问题需要回滚：

1. [ ] 标记当前发布为 Pre-release 或删除
2. [ ] 通知用户问题并建议回退到上一个版本
3. [ ] 在本地回滚变更
   ```bash
   git tag -d v1.10.9
   git reset --hard HEAD~1
   git push origin main --force
   git push origin --delete v1.10.9
   ```
4. [ ] 分析问题原因
5. [ ] 准备修复方案
6. [ ] 发布新的修复版本

**注意**：如果用户已经下载了有问题的版本，建议尽快发布修复版本而不是简单回滚。

## 模板

复制以下内容作为每次发布的检查清单：

```markdown
# 发布检查清单 - v1.x.x

## 代码质量

- [ ] 所有单元测试通过
- [ ] TypeScript 类型检查通过
- [ ] 代码格式化检查通过

## 版本管理

- [ ] 版本号已正确升级
- [ ] CHANGELOG.md 已更新

## Git 状态

- [ ] 在 main 分支上
- [ ] 工作区干净
- [ ] 已从远程拉取最新代码

## 构建验证

- [ ] 项目能正常构建
- [ ] 没有构建警告或错误

## 功能验证

- [ ] 应用能正常启动
- [ ] 核心功能正常工作

## 发布

- [ ] 提交变更
- [ ] 创建 Git 标签
- [ ] 推送到远程
- [ ] 验证发布成功
```

## 相关文档

- [版本升级步骤指南](./VERSION_UPGRADE_GUIDE.md)
- [Git 提交信息规范](./GIT_COMMIT_GUIDE.md)
- [CHANGELOG](../CHANGELOG.md)
- [RELEASE_GUIDE](../RELEASE_GUIDE.md)

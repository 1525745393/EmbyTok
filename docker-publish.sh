#!/bin/bash

# EmbyTok Docker Hub 发布脚本
# 请先修改 DOCKER_USERNAME 为您的 Docker Hub 用户名

set -e

# ==========================================
# 配置部分（请修改以下内容）
# ==========================================
DOCKER_USERNAME="yourusername"  # 请替换为您的 Docker Hub 用户名
IMAGE_NAME="embytok"
VERSION="1.3.0"

# ==========================================
# 发布流程
# ==========================================

echo "========================================="
echo "  EmbyTok Docker Hub 发布"
echo "========================================="
echo ""

# 检查是否已登录 Docker Hub
echo "1. 检查 Docker 登录状态..."
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  请先登录 Docker Hub："
    echo "   docker login"
    exit 1
fi
echo "✅ Docker 已登录"

# 检查用户名配置
if [ "$DOCKER_USERNAME" = "yourusername" ]; then
    echo ""
    echo "❌ 请先在脚本中配置您的 Docker Hub 用户名！"
    echo "   编辑 $0 并修改 DOCKER_USERNAME 变量"
    exit 1
fi

# 构建镜像
echo ""
echo "2. 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi
echo "✅ 镜像构建成功"

# 标记镜像
echo ""
echo "3. 标记镜像..."
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo "   - ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "   - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo "✅ 镜像标记完成"

# 推送镜像
echo ""
echo "4. 推送到 Docker Hub..."
echo ""
echo "   推送版本标签..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
    echo "❌ 推送版本标签失败"
    exit 1
fi
echo "✅ 版本标签推送成功"

echo ""
echo "   推送 latest 标签..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo "❌ 推送 latest 标签失败"
    exit 1
fi
echo "✅ latest 标签推送成功"

# 完成
echo ""
echo "========================================="
echo "🎉 发布成功！"
echo "========================================="
echo ""
echo "镜像信息："
echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "Docker Hub 页面："
echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""
echo "使用方法："
echo "  docker run -d -p 8080:80 --name embytok ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""

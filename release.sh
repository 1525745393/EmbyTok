#!/bin/bash

set -e

# 阿里云镜像仓库信息
REGISTRY="crpi-90mw3693mrc3nsxp.cn-shanghai.personal.cr.aliyuncs.com"
REPOSITORY="migumigu/embytok"

# 检查版本参数
if [ -z "$1" ]; then
    read -p "请输入版本号（例如：1.0.2）: " VERSION
    if [ -z "$VERSION" ]; then
        echo "错误：版本号不能为空"
        exit 1
    fi
else
    VERSION="$1"
fi

echo "开始发布流程，版本：$VERSION"
echo "========================================="

# 1. 编译前端

# 2. 构建Docker镜像
echo "\n2. 执行Docker镜像构建..."
./build-docker-image-offline.sh

if [ $? -ne 0 ]; then
    echo "错误：Docker镜像构建失败"
    exit 1
fi

echo "✅ Docker镜像构建成功"

# 3. 提取镜像ID
echo "\n3. 提取镜像ID..."
IMAGE_ID=$(docker images --format "{{.ID}}" | head -n 1)

if [ -z "$IMAGE_ID" ]; then
    echo "错误：无法提取镜像ID"
    exit 1
fi

echo "✅ 镜像ID：$IMAGE_ID"

# 4. 推送镜像到阿里云
echo "\n4. 推送镜像到阿里云镜像仓库..."

echo "\n4.1 标记镜像版本..."
docker tag "$IMAGE_ID" "$REGISTRY/$REPOSITORY:$VERSION"
docker tag "$IMAGE_ID" "$REGISTRY/$REPOSITORY:latest"

if [ $? -ne 0 ]; then
    echo "错误：镜像标记失败"
    exit 1
fi

echo "✅ 镜像标记成功"

echo "\n4.2 推送指定版本..."
docker push "$REGISTRY/$REPOSITORY:$VERSION"

if [ $? -ne 0 ]; then
    echo "错误：推送指定版本失败"
    exit 1
fi

echo "✅ 推送指定版本成功"

echo "\n4.3 推送latest版本..."
docker push "$REGISTRY/$REPOSITORY:latest"

if [ $? -ne 0 ]; then
    echo "错误：推送latest版本失败"
    exit 1
fi

echo "✅ 推送latest版本成功"

echo "\n========================================="
echo "🎉 发布成功！"
echo "版本：$VERSION"
echo "镜像ID：$IMAGE_ID"
echo "阿里云镜像：$REGISTRY/$REPOSITORY:$VERSION"
echo "阿里云镜像：$REGISTRY/$REPOSITORY:latest"
echo "========================================="

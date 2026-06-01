#!/bin/bash

# EmbyTok 发布脚本 v1.3.0

set -e

echo "========================================="
echo "  EmbyTok 发布流程"
echo "========================================="

# 1. 检查当前状态
echo -e "\n1. 检查 Git 状态..."
if ! git diff --quiet; then
    echo "⚠️  有未提交的变更"
    echo "请先提交变更后再发布"
    git status
    exit 1
fi

# 2. 运行测试
echo -e "\n2. 运行测试..."
npm run test:run

# 3. 构建项目
echo -e "\n3. 构建项目..."
npm run build

echo -e "\n✅ 准备完成！"
echo -e "\n下一步操作（手动执行）："
echo "  1. 提交版本变更"
echo "     git add ."
echo "     git commit -m \"chore: release v1.3.0\""
echo "     git tag v1.3.0"
echo "     git push origin v1.3.0"
echo -e "\n  2. 构建和推送 Docker 镜像"
echo "     docker build -t embytok:1.3.0 ."
echo "     docker tag embytok:1.3.0 your-registry/embytok:1.3.0"
echo "     docker push your-registry/embytok:1.3.0"
echo -e "\n  3. 或者使用 release.sh 进行完整发布（需要 Docker）"
echo "     ./release.sh 1.3.0"

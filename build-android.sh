#!/bin/bash
# Android 构建脚本 - 使用固定签名密钥

echo "====================================="
echo "EmbyTok Android 构建脚本"
echo "====================================="
echo ""

# 确保脚本在正确的目录
cd "$(dirname "$0")"

echo "1. 构建 Web 前端..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web 构建失败！"
    exit 1
fi
echo "✅ Web 构建成功"
echo ""

echo "2. 同步 Capacitor..."
npm run cap:sync
if [ $? -ne 0 ]; then
    echo "❌ Capacitor 同步失败！"
    exit 1
fi
echo "✅ Capacitor 同步成功"
echo ""

echo "3. 构建 Android APK..."
cd android
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "❌ Android 构建失败！"
    exit 1
fi
echo "✅ Android 构建成功"
echo ""

cd ..
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo "====================================="
    echo "🎉 构建完成！"
    echo "APK 位置: $APK_PATH"
    echo "====================================="
    
    # 复制到项目根目录方便使用
    cp "$APK_PATH" "EmbyTok-1.9.2.apk"
    echo ""
    echo "✅ 已复制到: EmbyTok-1.9.2.apk"
else
    echo "❌ 找不到 APK 文件！"
    exit 1
fi


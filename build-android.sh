#!/bin/bash
# Android 构建脚本 - 支持 Debug 和 Release 版本

echo "====================================="
echo "EmbyTok Android 构建脚本"
echo "====================================="
echo ""

# 确保脚本在正确的目录
cd "$(dirname "$0")"

# 读取版本号
VERSION=$(node -p "require('./package.json').version")
echo "当前版本: v$VERSION"
echo ""

# 构建类型（默认为 release）
BUILD_TYPE=${1:-release}

if [ "$BUILD_TYPE" != "debug" ] && [ "$BUILD_TYPE" != "release" ]; then
    echo "使用方法: $0 [debug|release]"
    echo "默认构建 release 版本"
    echo ""
    BUILD_TYPE="release"
fi

echo "构建类型: $BUILD_TYPE"
echo ""

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

if [ "$BUILD_TYPE" = "debug" ]; then
    ./gradlew assembleDebug
else
    ./gradlew assembleRelease
fi

if [ $? -ne 0 ]; then
    echo "❌ Android 构建失败！"
    exit 1
fi
echo "✅ Android 构建成功"
echo ""

cd ..

# 确定 APK 路径
if [ "$BUILD_TYPE" = "debug" ]; then
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    TARGET_NAME="EmbyTok-v${VERSION}-debug.apk"
else
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    TARGET_NAME="EmbyTok-v${VERSION}-release.apk"
fi

if [ -f "$APK_PATH" ]; then
    echo "====================================="
    echo "🎉 构建完成！"
    echo "APK 位置: $APK_PATH"
    echo "====================================="
    
    # 复制到项目根目录方便使用
    cp "$APK_PATH" "$TARGET_NAME"
    echo ""
    echo "✅ 已复制到: $TARGET_NAME"
else
    echo "❌ 找不到 APK 文件！"
    echo "期望路径: $APK_PATH"
    exit 1
fi


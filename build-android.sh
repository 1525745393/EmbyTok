#!/bin/bash

# EmbyTok Android 自动构建脚本
# 该脚本用于自动化构建 Android APK

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  EmbyTok Android 自动构建脚本${NC}"
echo -e "${BLUE}=======================================${NC}"

# 检查 Node.js
echo -e "\n${YELLOW}检查环境...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安装${NC}"

# 检查 Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}错误：未找到 Java，请先安装 JDK${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java 已安装${NC}"

# 进入项目根目录
cd "$(dirname "$0")"

# 步骤1：构建前端
echo -e "\n${YELLOW}步骤1: 构建前端应用...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 前端构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 前端构建成功${NC}"

# 步骤2：同步到 Android
echo -e "\n${YELLOW}步骤2: 同步 Capacitor...${NC}"
npx cap sync android
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Capacitor 同步失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Capacitor 同步成功${NC}"

# 步骤3：构建 APK
echo -e "\n${YELLOW}步骤3: 构建 Android APK (Debug)...${NC}"
cd android

# 确保 Gradle 执行权限
chmod +x gradlew

# 构建 Debug APK
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ APK 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ APK 构建成功${NC}"

# 返回根目录
cd ..

# 步骤4：查找生成的 APK
echo -e "\n${YELLOW}步骤4: 查找生成的 APK 文件...${NC}"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    echo -e "${GREEN}✓ 找到 APK 文件！${NC}"
    echo -e "${BLUE}路径：${NC}$APK_PATH"
    echo -e "${BLUE}大小：${NC}$APK_SIZE"
    echo -e ""
    echo -e "${GREEN}=======================================${NC}"
    echo -e "${GREEN}🎉 构建成功！${NC}"
    echo -e "${GREEN}=======================================${NC}"
    echo -e ""
    echo -e "${BLUE}安装命令：${NC}"
    echo -e "adb install $APK_PATH"
    echo -e ""
else
    echo -e "${RED}✗ 未找到 APK 文件${NC}"
    exit 1
fi

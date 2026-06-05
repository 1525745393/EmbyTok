#!/bin/bash

# EmbyTok Android 签名配置脚本
# 用于快速生成签名密钥和配置文件

set -e

echo "========================================"
echo "  EmbyTok Android 签名配置"
echo "========================================"
echo ""

# 检查当前目录
if [ ! -f "app/build.gradle" ]; then
    echo "错误：请在 android 目录下运行此脚本"
    echo "示例：cd android && ./setup-keystore.sh"
    exit 1
fi

# 检查是否已有 keystore
if [ -f "keystore.properties" ]; then
    echo "检测到 keystore.properties 已存在"
    read -p "是否重新配置？(y/n): " RESET
    if [ "$RESET" != "y" ]; then
        echo "配置已完成，无需重新设置"
        exit 0
    fi
    echo ""
fi

# 检查 keystore 文件
KEYSTORE_FILE="release.keystore"
if [ -f "$KEYSTORE_FILE" ]; then
    echo "检测到 $KEYSTORE_FILE 已存在"
    read -p "是否重新生成密钥？(y/n): " REGEN_KEY
    if [ "$REGEN_KEY" != "y" ]; then
        echo "使用现有密钥文件"
    else
        echo "备份现有密钥..."
        mv "$KEYSTORE_FILE" "${KEYSTORE_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    fi
    echo ""
fi

# 如果密钥文件不存在，生成新密钥
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "步骤 1: 生成签名密钥"
    echo "----------------------------------------"

    # 询问密钥信息
    read -p "请输入密钥库密码: " STORE_PASSWORD
    echo ""

    read -p "请输入密钥别名 (默认: embytok): " KEY_ALIAS
    KEY_ALIAS=${KEY_ALIAS:-embytok}
    echo ""

    read -p "请输入密钥密码 (默认与密钥库相同): " KEY_PASSWORD
    KEY_PASSWORD=${KEY_PASSWORD:-$STORE_PASSWORD}
    echo ""

    # 生成密钥库
    echo "正在生成签名密钥..."
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$STORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=EmbyTok, OU=Development, O=EmbyTok, L=Unknown, ST=Unknown, C=Unknown"

    if [ $? -ne 0 ]; then
        echo ""
        echo "错误：密钥生成失败，请检查 Java 是否安装"
        exit 1
    fi

    echo "✓ 签名密钥已生成"
    echo ""
fi

# 如果没有 keystore.properties 文件，生成配置
if [ ! -f "keystore.properties" ]; then
    echo "步骤 2: 生成配置文件"
    echo "----------------------------------------"

    # 如果上面刚生成过，使用当时的输入
    if [ -z "$STORE_PASSWORD" ]; then
        read -p "请输入密钥库文件路径 (默认: release.keystore): " STORE_FILE
        STORE_FILE=${STORE_FILE:-release.keystore}

        read -p "请输入密钥库密码: " STORE_PASSWORD
        read -p "请输入密钥别名: " KEY_ALIAS
        read -p "请输入密钥密码: " KEY_PASSWORD
        echo ""
    else
        STORE_FILE="$KEYSTORE_FILE"
    fi

    # 生成 keystore.properties
    cat > keystore.properties <<EOF
# EmbyTok Android 签名配置
# 此文件包含敏感信息，切勿提交到 Git！

storeFile=$STORE_FILE
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF

    echo "✓ keystore.properties 已生成"
    echo ""
fi

echo "========================================"
echo "✓ 签名配置完成！"
echo "========================================"
echo ""
echo "重要信息："
echo "1. release.keystore - 请备份此文件，丢失无法恢复"
echo "2. keystore.properties - 包含密码，切勿提交到 Git"
echo "3. Git 已配置忽略这两个文件"
echo ""
echo "下一步："
echo "现在可以构建 APK 了，运行："
echo "cd .."
echo "./build-android.sh"
echo ""

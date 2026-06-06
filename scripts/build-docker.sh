#!/bin/bash
# EmbyTok Docker 构建脚本
# 支持多架构构建：amd64, arm64

set -e

# 配置
IMAGE_NAME="1525745393/embytok"
TAG="${1:-latest}"
PLATFORMS="${2:-linux/amd64,linux/arm64}"
DOCKERFILE="Dockerfile"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
}

# 检查 Buildx 是否可用
check_buildx() {
    if ! docker buildx version > /dev/null 2>&1; then
        log_warn "Buildx 不可用，正在启用..."
        docker buildx install || true
    fi
}

# 创建（如果不存在）并使用 buildx builder
setup_builder() {
    log_info "配置 buildx builder..."
    docker buildx create --name embytok-builder --use --bootstrap || true
}

# 构建立即模式（不推送）
build_only() {
    log_info "开始构建镜像: ${IMAGE_NAME}:${TAG}"
    log_info "目标平台: ${PLATFORMS}"

    docker buildx build \
        --platform "${PLATFORMS}" \
        --tag "${IMAGE_NAME}:${TAG}" \
        --file "${DOCKERFILE}" \
        --load \
        .

    log_info "构建完成: ${IMAGE_NAME}:${TAG}"
}

# 构建并推送镜像
build_and_push() {
    log_info "开始构建并推送镜像: ${IMAGE_NAME}:${TAG}"
    log_info "目标平台: ${PLATFORMS}"

    docker buildx build \
        --platform "${PLATFORMS}" \
        --tag "${IMAGE_NAME}:${TAG}" \
        --file "${DOCKERFILE}" \
        --push \
        .

    log_info "推送完成: ${IMAGE_NAME}:${TAG}"
}

# 构建多架构清单
build_manifest() {
    log_info "创建多架构 manifest..."

    # 为每个平台构建并推送
    for platform in $(echo "${PLATFORMS}" | tr ',' ' '); do
        log_info "构建平台: ${platform}"
        docker buildx build \
            --platform "${platform}" \
            --tag "${IMAGE_NAME}:${TAG}-${platform##*/}" \
            --file "${DOCKERFILE}" \
            --push \
            .
    done

    # 创建并推送 manifest
    docker manifest create "${IMAGE_NAME}:${TAG}" \
        "${IMAGE_NAME}:${TAG}-amd64" \
        "${IMAGE_NAME}:${TAG}-arm64"

    docker manifest push "${IMAGE_NAME}:${TAG}"

    log_info "多架构 manifest 创建完成"
}

# 显示帮助
show_help() {
    echo "EmbyTok Docker 构建脚本"
    echo ""
    echo "用法: $0 [TAG] [PLATFORMS] [COMMAND]"
    echo ""
    echo "参数:"
    echo "  TAG         镜像标签，默认为 latest"
    echo "  PLATFORMS   目标平台，默认为 linux/amd64,linux/arm64"
    echo ""
    echo "命令:"
    echo "  build       仅构建镜像（默认）"
    echo "  push        构建并推送镜像"
    echo "  manifest    构建多架构 manifest 并推送"
    echo "  clean       清理 buildx 缓存"
    echo ""
    echo "示例:"
    echo "  $0                                    # 构建 latest 标签的 amd64 镜像"
    echo "  $0 v1.0.0                             # 构建 v1.0.0 标签的镜像"
    echo "  $0 latest linux/amd64,linux/arm64    # 构建多架构镜像"
    echo "  $0 v1.0.0 linux/arm64 push           # 构建并推送 arm64 镜像"
    echo "  $0 latest linux/amd64,linux/arm64 manifest  # 构建并推送多架构 manifest"
}

# 清理缓存
clean_cache() {
    log_info "清理 buildx 缓存..."
    docker buildx prune --all
    log_info "清理完成"
}

# 主逻辑
main() {
    COMMAND="${3:-build}"

    check_docker
    check_buildx
    setup_builder

    case "${COMMAND}" in
        build)
            build_only
            ;;
        push)
            build_and_push
            ;;
        manifest)
            build_manifest
            ;;
        clean)
            clean_cache
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: ${COMMAND}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"

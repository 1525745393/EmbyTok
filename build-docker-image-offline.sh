#!/bin/bash
# build-docker-image-offline.sh - 离线环境Docker镜像构建脚本（EmbyTok项目专用）

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

# 检查dist目录是否存在
check_dist_exists() {
    if [ -d "dist" ]; then
        log_info "发现dist目录，将使用现有的编译结果"
        return 0
    else
        log_warn "未发现dist目录，需要先编译前端"
        return 1
    fi
}

# 编译前端
build_frontend() {
    log_info "开始编译前端..."
    
    # 检查离线缓存是否存在
    if [ -d "offline_cache" ] && [ -f "offline_cache/dependencies.tar" ]; then
        log_info "使用离线缓存编译前端..."
        
        # 解压离线依赖
        tar -xf offline_cache/dependencies.tar
        
        # 构建前端
        if npm run build; then
            log_info "前端编译成功"
            return 0
        else
            log_error "前端编译失败"
            return 1
        fi
    else
        log_warn "未发现离线缓存，将使用在线模式编译前端"
        
        # 在线构建前端
        if npm install && npm run build; then
            log_info "前端编译成功"
            return 0
        else
            log_error "前端编译失败"
            return 1
        fi
    fi
}

# 构建Docker镜像
build_docker_image() {
    log_info "开始构建Docker镜像..."
    
    IMAGE_NAME="embytok"
    IMAGE_TAG="latest"
    
    # 检查Dockerfile是否存在
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile文件不存在"
        return 1
    fi
    
    # 检查dist目录是否存在
    if [ ! -d "dist" ]; then
        log_error "dist目录不存在，请先编译前端"
        return 1
    fi
    
    # 构建镜像（指定平台为linux/amd64）
    log_info "正在构建Docker镜像（平台: linux/amd64）..."
    if docker build --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} .; then
        log_info "Docker镜像构建成功"
        
        # 验证镜像
        log_info "验证镜像..."
        docker images ${IMAGE_NAME}:${IMAGE_TAG}
        
        # 导出镜像
        log_info "导出镜像文件..."
        docker save ${IMAGE_NAME}:${IMAGE_TAG} > ${IMAGE_NAME}-${IMAGE_TAG}.tar
        
        # 显示文件信息
        log_info "镜像文件信息:"
        ls -lh ${IMAGE_NAME}-${IMAGE_TAG}.tar
        
        return 0
    else
        log_error "Docker镜像构建失败"
        return 1
    fi
}

# 主流程
main() {
    echo "=== EmbyTok项目 Docker镜像构建 ==="
    log_info "开始构建流程"
    
    # 检查是否已有dist目录
    if ! check_dist_exists; then
        # 需要编译前端
        if ! build_frontend; then
            log_error "前端编译失败，无法继续Docker镜像构建"
            exit 1
        fi
    fi
    
    # 构建Docker镜像
    if build_docker_image; then
        log_info "=== EmbyTok项目 Docker镜像构建完成 ==="
        log_info "镜像文件: embytok-latest.tar"
        log_info "镜像标签: embytok:latest"
        log_info "平台架构: linux/amd64"
        log_info "加载镜像命令: docker load < embytok-latest.tar"
        log_info "运行镜像命令: docker run -d -p 8080:80 embytok:latest"
    else
        log_error "构建失败"
        exit 1
    fi
}

# 执行主流程
main "$@"
#!/bin/bash

# EmbyTok Release Script
# 使用方法: ./scripts/release.sh [major|minor|patch|version]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取当前版本
get_current_version() {
    grep -E '"version":' package.json | head -1 | awk -F': ' '{print $2}' | sed 's/[", ]//g'
}

# 更新版本
update_version() {
    local new_version=$1
    log_info "Updating version to $new_version"
    
    npm version --no-git-tag-version "$new_version"
    log_success "Version updated to $(get_current_version)"
}

# 运行代码检查
run_checks() {
    log_info "Running TypeScript check..."
    npm run typecheck
    
    log_info "Running ESLint..."
    npm run lint
}

# 构建项目
build_project() {
    log_info "Building project..."
    npm run build
}

# 创建dist.zip
create_dist_zip() {
    log_info "Creating dist.zip..."
    cd dist
    zip -r "../dist.zip" .
    cd ..
    log_success "dist.zip created"
}

# 创建git tag
create_git_tag() {
    local version=$(get_current_version)
    local tag="v$version"
    
    log_info "Creating git tag $tag"
    git add package.json
    git commit -m "Release $tag" || true
    git tag -a "$tag" -m "Release $tag"
}

# 推送tag
push_tag() {
    log_info "Pushing tags to remote..."
    git push origin --tags
}

# 显示帮助
show_help() {
    echo "EmbyTok Release Script"
    echo
    echo "Usage: $0 [option]"
    echo
    echo "Options:"
    echo "  major    - Bump major version (x.0.0)"
    echo "  minor    - Bump minor version (2.x.0)"
    echo "  patch    - Bump patch version (2.0.x)"
    echo "  x.y.z    - Set specific version (e.g., 2.0.0)"
    echo "  check    - Run checks only"
    echo "  build    - Build only"
    echo "  tag      - Create git tag only"
    echo "  help     - Show this help"
    echo
    echo "Example:"
    echo "  $0 major"
    echo "  $0 2.0.0"
}

# 主函数
main() {
    local command=$1
    
    if [ -z "$command" ] || [ "$command" = "help" ]; then
        show_help
        return 0
    fi
    
    log_info "EmbyTok Release Script"
    log_info "Current version: $(get_current_version)"
    echo
    
    case $command in
        major|minor|patch)
            log_info "Bumping $command version..."
            update_version "$command"
            run_checks
            build_project
            create_dist_zip
            create_git_tag
            log_success "Release $command completed!"
            log_info "Next steps:"
            log_info "  1. Review changes: git log --stat"
            log_info "  2. Push changes: git push origin && git push origin --tags"
            log_info "  3. Run GitHub workflow for full release"
            ;;
        [0-9]*.[0-9]*.[0-9]*)
            log_info "Setting version to $command"
            update_version "$command"
            run_checks
            build_project
            create_dist_zip
            create_git_tag
            log_success "Release $command completed!"
            log_info "Next steps:"
            log_info "  1. Review changes: git log --stat"
            log_info "  2. Push changes: git push origin && git push origin --tags"
            log_info "  3. Run GitHub workflow for full release"
            ;;
        check)
            run_checks
            log_success "All checks passed!"
            ;;
        build)
            build_project
            create_dist_zip
            log_success "Build completed!"
            ;;
        tag)
            create_git_tag
            log_success "Tag created!"
            log_info "Next step: git push origin --tags"
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            return 1
            ;;
    esac
}

main "$@"

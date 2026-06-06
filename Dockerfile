# 多阶段构建 Dockerfile for EmbyTok
# 支持多架构：amd64, arm64

# ============ 第一阶段：构建应用 ============
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（使用 npm ci 保证构建一致性）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ============ 第二阶段：生产环境 ============
FROM nginx:alpine AS production

# 安装 dumb-init 用于优雅的进程管理
RUN apk add --no-cache dumb-init

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建结果到 nginx 服务目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建非 root 用户提高安全性
RUN addgroup -g 101 -S nginx && \
    adduser -S nginx -u 101 && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 切换到非 root 用户
USER nginx

# 暴露 80 端口
EXPOSE 80

# 健康检查配置
# 检查 nginx 服务是否正常响应
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 nginx（使用 dumb-init 管理进程）
CMD ["dumb-init", "nginx", "-g", "daemon off;"]

# EmbyTok 群晖部署指南

## 前置要求

- 群晖 NAS（支持 Docker 的型号）
- 已安装 **Container Manager** 或 Container Station
- DSM 7.2 或更高版本（推荐）
- 至少 512MB 可用内存

## 配置文件说明

项目提供三个 Docker Compose 配置文件，已优化为 Container Manager 兼容格式：

1. **[docker-compose.synology.yml](file:///workspace/docker-compose.synology.yml)** - 群晖专用配置（推荐）
   - 版本：3.3（Container Manager 最佳兼容版本）
   - 包含时区设置
   - 使用独立网络

2. **[docker-compose.yml](file:///workspace/docker-compose.yml)** - 通用配置
   - 适用于所有 Docker 环境
   - 简洁配置

3. **[docker-compose.simple.yml](file:///workspace/docker-compose.simple.yml)** - 最简配置
   - 使用 `network_mode: bridge`
   - 最少配置项

### 兼容性调整

- 已移除 `healthcheck`（健康检查）- Container Manager 可能不支持
- 已移除 `deploy` 资源限制 - Swarm 模式专用
- 版本降级为 3.3 - 更好的兼容性
- 简化端口格式 - 移除引号
- 简化网络配置

## 方法一：使用 Container Manager 界面部署（推荐）

### 步骤 1：打开 Container Manager

1. 登录群晖 DSM 管理界面
2. 打开 **Container Manager**（容器管理器）

### 步骤 2：创建项目

1. 点击左侧菜单的 **项目**（Project）
2. 点击右上角的 **添加**（Add）
3. 选择 **创建项目**（Create project）

### 步骤 3：配置项目

- **项目名称**：输入 `embytok`
- **路径**：选择 `/docker/embytok` 或其他你喜欢的路径
- **配置方式**：选择 **Web editor**（Web 编辑器）
- **YAML 内容**：复制 [docker-compose.synology.yml](file:///workspace/docker-compose.synology.yml) 的内容粘贴到编辑器中

### 步骤 4：部署项目

1. 点击 **下一步**（Next）
2. 确认配置无误后点击 **应用**（Apply）
3. 等待镜像拉取和容器创建完成（可以在**操作日志**中查看进度）

### 步骤 5：访问应用

- 在项目列表中找到 `embytok` 项目
- 点击项目查看详情，找到端口映射信息
- 打开浏览器访问：`http://群晖IP:8080`

## 方法二：使用 Container Manager 单容器部署（简单）

### 步骤 1：打开 Container Manager

1. 登录群晖 DSM 管理界面
2. 打开 **Container Manager**

### 步骤 2：搜索镜像

1. 点击左侧菜单的 **注册表**（Registry）
2. 在搜索框输入：`1525745393/embytok`
3. 找到镜像后点击 **下载**（Download）
4. 选择标签：`latest`（最新版本）
5. 点击 **下一步** 等待下载完成

### 步骤 3：创建容器

1. 点击左侧菜单的 **映像**（Image）
2. 找到 `1525745393/embytok:latest` 镜像
3. 点击 **运行**（Run）

### 步骤 4：配置容器

1. **常规设置**（General Settings）：
   - 容器名称：`embytok-web`
   - 勾选 **启用自动重启**（Enable auto-restart）

2. **端口设置**（Port Settings）：
   - 本地端口（Local Port）：`8080`
   - 容器端口（Container Port）：`80`
   - 类型（Type）：`TCP`

3. **环境设置**（Environment）：
   - 添加变量：`TZ` = `Asia/Shanghai`

4. **资源限制**（Resources）（可选）：
   - CPU 限制：0.5
   - 内存限制：256MB

### 步骤 5：启动容器

1. 点击 **下一步** > **完成**
2. 容器将自动启动

### 步骤 6：访问应用

- 点击左侧菜单的 **容器**（Container）
- 找到 `embytok-web` 容器
- 查看端口信息，打开浏览器访问：`http://群晖IP:8080`

## 方法三：使用 SSH 命令行部署

### 步骤 1：启用 SSH

1. 登录群晖 DSM
2. 打开 **控制面板** > **终端机和 SNMP**
3. 勾选 **启动 SSH 功能**
4. 点击 **应用**

### 步骤 2：通过 SSH 连接

使用终端连接到群晖：

```bash
ssh admin@群晖IP地址
```

### 步骤 3：创建配置文件

```bash
# 创建目录
mkdir -p /volume1/docker/embytok
cd /volume1/docker/embytok

# 创建 docker-compose.synology.yml 文件
# 将文件内容复制并保存

# 启动容器
sudo docker-compose -f docker-compose.synology.yml up -d
```

### 步骤 4：查看状态

```bash
# 查看容器状态
sudo docker ps

# 查看日志
sudo docker logs -f embytok-web
```

## 群晖特定配置说明

### 网络配置

- 默认使用 `bridge` 网络模式
- 端口映射：`8080:80`
- 如果需要使用群晖反向代理，可以在 **控制面板** > **应用程序门户** > **反向代理** 中配置

### 时区配置

- 已默认设置为 `Asia/Shanghai`（中国上海时区）
- 如需修改，编辑环境变量 `TZ` 的值

### 资源限制

- CPU 限制：0.5 核
- 内存限制：256MB
- 可以根据群晖性能调整这些值

## 群晖反向代理配置（可选）

### 配置步骤

1. 打开 **控制面板** > **应用程序门户** > **反向代理**
2. 点击 **新增**
3. 配置如下：
   - **来源**（Source）：
     - 协议：`HTTPS`
     - 主机名：`emby.yourdomain.com`（或使用群晖 DDNS）
     - 端口：`443`
   - **目的地**（Destination）：
     - 协议：`HTTP`
     - 主机名：`localhost`
     - 端口：`8080`
4. 点击 **确定**

## 常见问题

### 端口冲突

如果 8080 端口被占用，修改 [docker-compose.synology.yml](file:///workspace/docker-compose.synology.yml) 中的端口映射，例如改为 `8081:80`

### 镜像拉取失败

- 检查网络连接
- 配置群晖 Docker 镜像源（在 Container Station 设置中）

### 容器无法启动

- 查看日志：`sudo docker logs embytok-web`
- 检查端口是否被占用

## 升级应用

### 方法一：Container Manager 界面（推荐）

1. 打开 **Container Manager** > **项目**
2. 找到 `embytok` 项目
3. 点击项目进入详情页
4. 点击右上角的 **操作** > **停止**（Stop）
5. 停止后，点击 **操作** > **重建**（Recreate）
6. 选择 **拉取最新镜像**（Pull latest image）
7. 点击 **应用**（Apply）

### 方法二：Container Manager 操作方式

1. 打开 **Container Manager** > **项目**
2. 右键点击 `embytok` 项目
3. 选择 **重建**（Recreate）
4. 勾选 **拉取最新镜像**（Pull latest image）
5. 点击 **下一步** > **应用**

### 方法四：单容器方式升级（如果使用方法二部署）

1. 打开 **Container Manager** > **容器**（Container）
2. 找到 `embytok-web` 容器
3. 点击容器进入详情页
4. 点击 **停止**（Stop）
5. 点击 **操作** > **重置**（Reset）或删除后重新创建
6. 或者先删除容器，然后从映像重新创建（会自动拉取最新版本）

### 方法五：命令行

```bash
cd /volume1/docker/embytok
sudo docker-compose -f docker-compose.synology.yml pull
sudo docker-compose -f docker-compose.synology.yml up -d
```

## 卸载

### 项目方式卸载（方法一部署）

1. 打开 **Container Manager** > **项目**
2. 找到 `embytok` 项目
3. 点击项目进入详情页
4. 点击 **操作** > **停止**（Stop）
5. 点击 **操作** > **删除**（Delete）
6. 选择是否同时删除镜像

### 单容器方式卸载（方法二部署）

1. 打开 **Container Manager** > **容器**（Container）
2. 找到 `embytok-web` 容器
3. 点击容器进入详情页
4. 点击 **停止**（Stop）
5. 点击 **操作** > **删除**（Delete）
6. 可以选择同时删除镜像

### 命令行完全卸载

```bash
cd /volume1/docker/embytok
sudo docker-compose -f docker-compose.synology.yml down
sudo docker rmi 1525745393/embytok:latest
```

## 相关文件

- [docker-compose.synology.yml](file:///workspace/docker-compose.synology.yml) - 群晖专用配置
- [docker-compose.yml](file:///workspace/docker-compose.yml) - 通用配置
- [docker-compose.simple.yml](file:///workspace/docker-compose.simple.yml) - 简化配置
- [Dockerfile](file:///workspace/Dockerfile) - 镜像构建文件
- [nginx.conf](file:///workspace/nginx.conf) - Nginx 配置

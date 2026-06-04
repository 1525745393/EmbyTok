# EmbyTok 群晖部署指南

## 前置要求
- 群晖 NAS（支持 Docker 的型号）
- 已安装 Docker 或 Container Station
- 至少 512MB 可用内存

## 方法一：使用 Container Station 界面部署（推荐）

### 步骤 1：打开 Container Station
1. 登录群晖 DSM 管理界面
2. 打开 **Container Station**（容器站）

### 步骤 2：创建项目
1. 点击左侧菜单的 **项目**（Project）**
2. 点击 **创建**（Create）
3. 选择 **从代码创建项目**（Create from YAML）

### 步骤 3：配置项目
- **项目名称**：输入 `embytok`
- **路径**：选择 `/docker/embytok` 或其他你喜欢的路径
- **YAML 内容**：复制 [docker-compose.synology.yml](#docker-composesynologyyml) 的内容粘贴进去

### 步骤 4：部署项目
1. 点击 **确定**（OK）开始部署
2. 等待镜像拉取和容器创建完成

### 步骤 5：访问应用
- 打开浏览器访问：`http://群晖IP:8080`

## 方法二：使用 SSH 命令行部署

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

### 方法一：Container Station 界面
1. 打开 Container Station > 项目 > embytok
2. 停止项目
3. 删除项目（数据不会丢失）
4. 重新创建项目

### 方法二：命令行
```bash
cd /volume1/docker/embytok
sudo docker-compose -f docker-compose.synology.yml pull
sudo docker-compose -f docker-compose.synology.yml up -d
```

## 卸载

### 完全卸载
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

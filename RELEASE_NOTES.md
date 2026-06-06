# EmbyTok v2.0.0 发布说明

**版本号**: v2.0.0  
**发布日期**: 2026-06-06

---

## 📦 下载

| 平台 | 下载方式 |
|------|----------|
| Web | 直接访问部署的服务地址 |
| Docker | `docker pull ghcr.io/yourusername/embytok:v2.0.0` |
| Android | 从 GitHub Releases 下载 APK |

---

## ✨ 主要新功能

### Emby API 深度集成
- **Emby Recommendations API**：智能推荐系统，获取个性化影片推荐
- **UserData 深度集成**：播放进度自动同步、用户评分、观影历史
- **智能播放队列**：剧集自动连播、播放队列管理
- **BoxSet 支持增强**：优化的合集展示和浏览体验

### TikTok 风格体验增强
- **短视频预览**：滚动停留500ms后自动播放3秒无声预览
- **虚拟滚动优化**：使用 react-virtuoso 支持大规模视频列表流畅滚动
- **智能预加载**：基于滑动方向预测，提前加载下一个视频
- **无缝连播**：双Video元素实现无感知视频切换
- **图像API优化**：响应式图片加载，优先使用WebP格式

### 性能与离线支持
- **本地缓存系统**：IndexedDB + LRU 淘汰策略，减少服务器请求
- **Service Worker增强**：支持离线浏览和后台同步
- **批量API调用优化**：请求合并和缓存，减少HTTP连接

### 用户体验提升
- **骨架屏加载**：友好的加载状态和分片加载
- **多用户快速切换**：同一设备支持多用户快速切换
- **错误恢复机制**：指数退避重试和友好的错误提示

---

## 🔄 如何升级

### Docker 部署
```bash
# 拉取新版本
docker pull ghcr.io/yourusername/embytok:v2.0.0

# 重启容器
docker-compose down
docker-compose up -d
```

### Web 版本
- 清理浏览器缓存（推荐）
- 刷新页面即可使用新版本

### Android APK
- 从 GitHub Releases 下载最新 APK
- 安装覆盖即可

---

## 📋 完整更新日志

详细更新内容请查看 [CHANGELOG.md](CHANGELOG.md)

---

## 🐛 问题反馈

如遇到问题，请前往 [GitHub Issues](https://github.com/yourusername/embytok/issues) 反馈


# EmbyTok v2.0.0 Release Draft

## Release Information

- **Tag**: v2.0.0
- **Release Name**: EmbyTok v2.0.0 - Emby API 深度集成
- **Draft**: true
- **Prerelease**: false
- **Created**: 2026-06-06

---

## Release Body

# EmbyTok v2.0.0

🎉 **EmbyTok v2.0.0 正式发布！**

这次更新带来了 Emby API 深度集成和 TikTok 风格体验的全面增强。

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

## 📦 下载

### Docker
```bash
docker pull ghcr.io/yourusername/embytok:v2.0.0
```

### Android APK
下载 APK 文件：`embytok-v2.0.0.apk`

### Web 部署
直接访问部署的服务地址

---

## 🔄 升级指南

### Docker 部署
```bash
docker pull ghcr.io/yourusername/embytok:v2.0.0
docker-compose down
docker-compose up -d
```

### Web 版本
清理浏览器缓存后刷新页面即可

### Android
安装覆盖 APK 即可

---

## 📋 完整更新日志

详细更新内容请查看 [CHANGELOG.md](https://github.com/yourusername/embytok/blob/main/CHANGELOG.md)

---

## 🐛 问题反馈

如遇到问题，请前往 [GitHub Issues](https://github.com/yourusername/embytok/issues) 反馈

---

## 🙏 感谢

感谢所有贡献者的付出！

---

*完整发布说明请查看 [RELEASE_NOTES.md](RELEASE_NOTES.md)*

# EmbyTok 功能增强 PRD

## 概述

本文档详细描述了EmbyTok的四个核心功能增强：

1. 播放历史 - 完整的观看历史记录
2. 收藏分类/筛选 - 更好的内容管理
3. 搜索功能 - 快速搜索视频
4. 字幕支持 - 字幕选择和显示功能

---

## 1. 播放历史功能

### 1.1 功能描述

记录用户的观看历史，包括：

- 观看过的视频列表
- 每次观看的时间戳
- 播放进度（上次看到哪里）
- 观看次数统计

### 1.2 用户故事

- "作为用户，我想看到我最近看过的视频，这样我可以继续观看未看完的内容"
- "作为用户，我想知道一个视频我看过多少次，这样我可以了解我的观看习惯"
- "作为用户，我想快速恢复到上次观看的位置，这样我不需要手动寻找进度"

### 1.3 技术实现

#### 数据结构

```typescript
// 新增到 types.ts
interface WatchHistoryItem {
  itemId: string;
  item: EmbyItem;
  lastWatchedAt: number; // timestamp
  watchCount: number;
  lastProgress: number; // seconds
  totalWatchTime: number; // total seconds watched
}

interface WatchHistory {
  items: WatchHistoryItem[];
  lastUpdated: number;
}
```

#### 存储策略

- 使用 localStorage 存储（适合单设备）
- 最大历史记录数：200条
- 自动清理超过30天的记录

#### 新增 Hooks

- `src/hooks/useWatchHistory.ts` - 管理观看历史

#### UI组件

- 新增导航选项 "历史"
- 历史记录列表展示
- 历史记录删除功能
- 继续播放按钮

### 1.4 集成点

- VideoCard.tsx: 记录播放进度和观看历史
- StandardRoot.tsx: 添加历史导航选项
- 新增组件: components/WatchHistory.tsx

---

## 2. 收藏分类/筛选功能

### 2.1 功能描述

为收藏功能增加分类和筛选能力：

- 自定义收藏分类（文件夹）
- 将视频添加到特定分类
- 按分类筛选显示收藏
- 排序功能（最近添加、名称、观看次数）

### 2.2 用户故事

- "作为用户，我想把收藏的视频按类型分类，这样更容易找到"
- "作为用户，我想快速看到我最近收藏的视频"
- "作为用户，我想管理我的收藏分类"

### 2.3 技术实现

#### 数据结构

```typescript
// 新增到 types.ts
interface FavoriteCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  itemIds: string[];
  coverImageId?: string;
}

interface FavoritesState {
  collections: FavoriteCollection[];
  defaultCollectionId: string;
}
```

#### 存储策略

- localStorage 存储
- 默认分类："全部收藏"
- 支持创建、删除、重命名分类

#### 新增 Hooks

- `src/hooks/useFavorites.ts` - 扩展收藏管理

#### UI组件

- 收藏分类选择器
- 分类管理弹窗
- 收藏列表筛选控件

### 2.4 集成点

- VideoCard.tsx: 添加到特定分类的选项
- StandardRoot.tsx: 收藏筛选和分类管理
- 新增组件: components/FavoritesManager.tsx

---

## 3. 搜索功能

### 3.1 功能描述

快速搜索视频库中的内容：

- 实时搜索建议
- 按标题、描述搜索
- 搜索历史记录
- 搜索结果展示（网格/列表视图）

### 3.2 用户故事

- "作为用户，我想快速找到特定的视频，这样不需要滚动浏览"
- "作为用户，我想看到我之前搜索过的内容，这样可以快速重复搜索"
- "作为用户，我希望搜索响应快速，这样体验流畅"

### 3.3 技术实现

#### 搜索策略

- 前端缓存已加载的视频进行快速搜索
- 调用 Emby API 进行服务器端搜索（当缓存不够时）
- 防抖处理（300ms）

#### 新增 Hooks

- `src/hooks/useSearch.ts` - 搜索状态和逻辑管理

#### UI组件

- 搜索栏（顶部导航栏集成）
- 搜索结果页面
- 搜索历史建议

### 3.4 集成点

- StandardRoot.tsx: 集成搜索栏
- 新增组件: components/SearchBar.tsx, components/SearchResults.tsx
- EmbyClient.ts: 添加搜索 API 方法

---

## 4. 字幕支持功能

### 4.1 功能描述

字幕显示和选择功能：

- 检测可用字幕轨道
- 字幕语言选择
- 字幕样式自定义（字体大小、颜色、位置）
- 字幕开关控制

### 4.2 用户故事

- "作为用户，我想看字幕，这样可以更好地理解视频内容"
- "作为用户，我想选择字幕的语言，这样可以用我熟悉的语言"
- "作为用户，我想调整字幕的显示样式，这样更符合我的观看习惯"

### 4.3 技术实现

#### 数据结构

```typescript
// 新增到 types.ts
interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isDefault: boolean;
  format: 'srt' | 'vtt' | 'ass';
  url?: string;
}

interface SubtitleSettings {
  enabled: boolean;
  selectedTrackId: string | null;
  fontSize: number; // 12-36
  fontColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top';
}
```

#### 实现方式

- 使用 HTML5 Video 的 TextTrack API
- 支持 VTT 字幕格式
- 自定义字幕渲染器（用于更高级的样式）

#### 新增 Hooks

- `src/hooks/useSubtitles.ts` - 字幕管理

#### UI组件

- 字幕选择器
- 字幕设置面板
- 字幕渲染层

### 4.4 集成点

- VideoCard.tsx: 集成字幕控制
- EmbyClient.ts: 获取字幕轨道信息
- 新增组件: components/SubtitleControls.tsx

---

## 实施顺序

1. **第一阶段**：播放历史功能（相对独立，依赖较少）
2. **第二阶段**：搜索功能（需要 API 集成）
3. **第三阶段**：收藏分类/筛选（修改现有收藏功能）
4. **第四阶段**：字幕支持（最复杂，涉及视频播放核心）

---

## 总体技术要点

### 国际化

- 所有新功能需要同时支持中英文
- 更新 src/locales/zh.ts 和 en.ts

### 性能优化

- 使用 useMemo/useCallback 优化渲染
- 搜索使用防抖
- 历史记录分页加载

### 向后兼容

- 保持现有功能不变
- 数据迁移处理（旧版收藏 → 新版收藏分类）

### 测试

- 每个功能需要基础的用户测试
- 边缘情况处理（大量数据、网络错误等）

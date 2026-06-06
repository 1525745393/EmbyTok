# 收藏分类/筛选功能 Implementation Plan

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现收藏分类管理功能，包括创建分类、添加视频到分类、按分类筛选、排序等

**Architecture:**

- 更新类型定义添加收藏分类相关类型
- 创建 `useFavorites` Hook 管理收藏分类状态
- 创建收藏管理组件 `FavoritesManager`
- 更新 VideoCard 添加分类选择功能
- 集成到 StandardRoot 中

**Tech Stack:** React 18, TypeScript, localStorage

---

## 任务分解

### Task 1: 更新类型定义

**Files:**

- Modify: `types.ts`

- [ ] **Step 1: 添加收藏分类相关类型**

在 types.ts 文件末尾添加：

```typescript
export interface FavoriteCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  itemIds: string[];
  coverImageId?: string;
}

export interface FavoritesState {
  collections: FavoriteCollection[];
  defaultCollectionId: string;
}

export type FavoriteSortOrder = 'recent' | 'name' | 'watchCount';
```

- [ ] **Step 2: 验证类型定义**

```bash
npm run build
```

Expected: 无类型错误

---

### Task 2: 创建 useFavorites Hook

**Files:**

- Create: `src/hooks/useFavorites.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: 创建 useFavorites Hook**

```typescript
import { useState, useCallback, useEffect } from 'react';
import { EmbyItem, FavoriteCollection, FavoritesState, FavoriteSortOrder } from '../../types';
import { useLocalStorageState } from './useLocalStorageState';

const FAVORITES_KEY = 'embytok_favorites_v2';
const DEFAULT_COLLECTION_ID = 'all';
const DEFAULT_COLLECTION_NAME = '全部收藏';

export function useFavorites() {
  const [favoritesState, setFavoritesState] = useLocalStorageState&lt;FavoritesState&gt;(
    FAVORITES_KEY,
    {
      collections: [
        {
          id: DEFAULT_COLLECTION_ID,
          name: DEFAULT_COLLECTION_NAME,
          createdAt: Date.now(),
          itemIds: []
        }
      ],
      defaultCollectionId: DEFAULT_COLLECTION_ID
    }
  );

  const [currentCollectionId, setCurrentCollectionId] = useState&lt;string&gt;(DEFAULT_COLLECTION_ID);
  const [sortOrder, setSortOrder] = useState&lt;FavoriteSortOrder&gt;('recent');

  // 获取当前分类
  const currentCollection = favoritesState.collections.find(
    c =&gt; c.id === currentCollectionId
  ) || favoritesState.collections[0];

  // 创建新分类
  const createCollection = useCallback((name: string, description?: string) =&gt; {
    const newCollection: FavoriteCollection = {
      id: `collection_${Date.now()}`,
      name,
      description,
      createdAt: Date.now(),
      itemIds: []
    };

    setFavoritesState(prev =&gt; ({
      ...prev,
      collections: [...prev.collections, newCollection]
    }));

    return newCollection;
  }, [setFavoritesState]);

  // 删除分类
  const deleteCollection = useCallback((collectionId: string) =&gt; {
    if (collectionId === DEFAULT_COLLECTION_ID) {
      return; // 不能删除默认分类
    }

    setFavoritesState(prev =&gt; {
      const newCollections = prev.collections.filter(c =&gt; c.id !== collectionId);

      // 如果删除的是当前选中的分类，切换到默认分类
      let newDefaultId = prev.defaultCollectionId;
      if (currentCollectionId === collectionId) {
        newDefaultId = DEFAULT_COLLECTION_ID;
      }

      return {
        ...prev,
        collections: newCollections,
        defaultCollectionId: newDefaultId
      };
    });
  }, [setFavoritesState, currentCollectionId]);

  // 重命名分类
  const renameCollection = useCallback((collectionId: string, newName: string) =&gt; {
    setFavoritesState(prev =&gt; ({
      ...prev,
      collections: prev.collections.map(c =&gt;
        c.id === collectionId ? { ...c, name: newName } : c
      )
    }));
  }, [setFavoritesState]);

  // 添加视频到分类
  const addToCollection = useCallback((itemId: string, collectionId: string) =&gt; {
    setFavoritesState(prev =&gt; {
      const newCollections = prev.collections.map(c =&gt; {
        if (c.id === collectionId &amp;&amp; !c.itemIds.includes(itemId)) {
          return { ...c, itemIds: [...c.itemIds, itemId] };
        }
        // 同时添加到全部收藏
        if (c.id === DEFAULT_COLLECTION_ID &amp;&amp; !c.itemIds.includes(itemId)) {
          return { ...c, itemIds: [...c.itemIds, itemId] };
        }
        return c;
      });

      return { ...prev, collections: newCollections };
    });
  }, [setFavoritesState]);

  // 从分类移除视频
  const removeFromCollection = useCallback((itemId: string, collectionId: string) =&gt; {
    setFavoritesState(prev =&gt; {
      const newCollections = prev.collections.map(c =&gt; {
        if (c.id === collectionId) {
          return { ...c, itemIds: c.itemIds.filter(id =&gt; id !== itemId) };
        }
        // 如果是从全部收藏移除，同时从其他分类移除
        if (c.id === DEFAULT_COLLECTION_ID) {
          return { ...c, itemIds: c.itemIds.filter(id =&gt; id !== itemId) };
        }
        return c;
      });

      return { ...prev, collections: newCollections };
    });
  }, [setFavoritesState]);

  // 检查视频是否在某个分类中
  const isInCollection = useCallback((itemId: string, collectionId: string) =&gt; {
    const collection = favoritesState.collections.find(c =&gt; c.id === collectionId);
    return collection?.itemIds.includes(itemId) || false;
  }, [favoritesState.collections]);

  // 获取视频所在的所有分类
  const getItemCollections = useCallback((itemId: string) =&gt; {
    return favoritesState.collections.filter(c =&gt; c.itemIds.includes(itemId));
  }, [favoritesState.collections]);

  // 过滤和排序视频
  const getFilteredVideos = useCallback((allVideos: EmbyItem[]) =&gt; {
    const currentItemIds = currentCollection.itemIds;
    let filteredVideos = allVideos.filter(v =&gt; currentItemIds.includes(v.Id));

    // 排序
    switch (sortOrder) {
      case 'name':
        filteredVideos = [...filteredVideos].sort((a, b) =&gt;
          a.Name.localeCompare(b.Name)
        );
        break;
      case 'recent':
      default:
        // 保持原顺序或按添加顺序
        filteredVideos = [...filteredVideos].sort((a, b) =&gt; {
          const aIndex = currentItemIds.indexOf(a.Id);
          const bIndex = currentItemIds.indexOf(b.Id);
          return aIndex - bIndex;
        });
        break;
    }

    return filteredVideos;
  }, [currentCollection, sortOrder]);

  // 迁移旧版收藏数据
  useEffect(() =&gt; {
    // 检查是否有旧版收藏数据
    const legacyFavorites = localStorage.getItem('embytok_legacy_favorites');
    if (legacyFavorites) {
      try {
        const legacyItems = JSON.parse(legacyFavorites);
        if (Array.isArray(legacyItems) &amp;&amp; legacyItems.length &gt; 0) {
          setFavoritesState(prev =&gt; ({
            ...prev,
            collections: prev.collections.map(c =&gt; {
              if (c.id === DEFAULT_COLLECTION_ID &amp;&amp; c.itemIds.length === 0) {
                return { ...c, itemIds: legacyItems };
              }
              return c;
            })
          }));
          localStorage.removeItem('embytok_legacy_favorites');
        }
      } catch (e) {
        console.error('Failed to migrate legacy favorites:', e);
      }
    }
  }, [setFavoritesState]);

  return {
    collections: favoritesState.collections,
    currentCollection,
    currentCollectionId,
    setCurrentCollectionId,
    sortOrder,
    setSortOrder,
    createCollection,
    deleteCollection,
    renameCollection,
    addToCollection,
    removeFromCollection,
    isInCollection,
    getItemCollections,
    getFilteredVideos
  };
}
```

- [ ] **Step 2: 导出新 Hook**

修改 `src/hooks/index.ts`，添加：

```typescript
export { useFavorites } from './useFavorites';
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

---

### Task 3: 创建收藏管理组件

**Files:**

- Create: `components/FavoritesManager.tsx`

- [ ] **Step 1: 创建 FavoritesManager 组件**

```typescript
import React, { useState } from 'react';
import { EmbyItem, FavoriteCollection, FavoriteSortOrder } from '../types';
import { Plus, Edit2, Trash2, Folder, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

interface FavoritesManagerProps {
  collections: FavoriteCollection[];
  currentCollectionId: string;
  onCollectionChange: (collectionId: string) =&gt; void;
  onCreateCollection: (name: string, description?: string) =&gt; void;
  onDeleteCollection: (collectionId: string) =&gt; void;
  onRenameCollection: (collectionId: string, newName: string) =&gt; void;
  sortOrder: FavoriteSortOrder;
  onSortOrderChange: (order: FavoriteSortOrder) =&gt; void;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    manageCollections: '管理分类',
    createCollection: '创建分类',
    collectionName: '分类名称',
    collectionDescription: '描述（可选）',
    create: '创建',
    cancel: '取消',
    rename: '重命名',
    delete: '删除',
    deleteConfirm: '确定要删除这个分类吗？视频不会被删除。',
    sortBy: '排序方式',
    recent: '最近添加',
    name: '名称',
    allCollections: '全部分类',
    noCollections: '暂无分类'
  },
  en: {
    manageCollections: 'Manage Collections',
    createCollection: 'Create Collection',
    collectionName: 'Collection Name',
    collectionDescription: 'Description (optional)',
    create: 'Create',
    cancel: 'Cancel',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this collection? Videos will not be deleted.',
    sortBy: 'Sort By',
    recent: 'Recently Added',
    name: 'Name',
    allCollections: 'All Collections',
    noCollections: 'No collections yet'
  }
};

export function FavoritesManager({
  collections,
  currentCollectionId,
  onCollectionChange,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
  sortOrder,
  onSortOrderChange,
  language
}: FavoritesManagerProps) {
  const texts = t[language];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState&lt;string | null&gt;(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = () =&gt; {
    if (newName.trim()) {
      onCreateCollection(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setShowCreateModal(false);
    }
  };

  const handleRename = () =&gt; {
    if (editingCollectionId &amp;&amp; newName.trim()) {
      onRenameCollection(editingCollectionId, newName.trim());
      setEditingCollectionId(null);
      setNewName('');
    }
  };

  return (
    &lt;div className="space-y-4"&gt;
      {/* 分类选择 */}
      &lt;div&gt;
        &lt;div className="flex items-center justify-between mb-2"&gt;
          &lt;h3 className="text-white font-semibold"&gt;{texts.allCollections}&lt;/h3&gt;
          &lt;button
            onClick={() =&gt; setShowCreateModal(true)}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm"
          &gt;
            &lt;Plus size={16} /&gt;
            {texts.createCollection}
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;div className="space-y-1"&gt;
          {collections.map(collection =&gt; (
            &lt;button
              key={collection.id}
              onClick={() =&gt; onCollectionChange(collection.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentCollectionId === collection.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            &gt;
              &lt;Folder size={18} /&gt;
              &lt;span className="flex-1 truncate"&gt;{collection.name}&lt;/span&gt;
              &lt;span className="text-sm opacity-60"&gt;{collection.itemIds.length}&lt;/span&gt;
            &lt;/button&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;

      {/* 排序选项 */}
      &lt;div&gt;
        &lt;h3 className="text-white font-semibold mb-2"&gt;{texts.sortBy}&lt;/h3&gt;
        &lt;div className="space-y-1"&gt;
          {[
            { value: 'recent', label: texts.recent },
            { value: 'name', label: texts.name }
          ].map(order =&gt; (
            &lt;button
              key={order.value}
              onClick={() =&gt; onSortOrderChange(order.value as FavoriteSortOrder)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                sortOrder === order.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            &gt;
              {sortOrder === order.value &amp;&amp; &lt;Check size={16} /&gt;}
              &lt;span className={sortOrder === order.value ? '' : 'ml-6'}&gt;{order.label}&lt;/span&gt;
            &lt;/button&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;

      {/* 创建分类模态框 */}
      {showCreateModal &amp;&amp; (
        &lt;div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"&gt;
          &lt;div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full"&gt;
            &lt;h3 className="text-white font-bold text-lg mb-4"&gt;{texts.createCollection}&lt;/h3&gt;
            &lt;div className="space-y-4"&gt;
              &lt;div&gt;
                &lt;label className="block text-white/70 text-sm mb-1"&gt;{texts.collectionName}&lt;/label&gt;
                &lt;input
                  type="text"
                  value={newName}
                  onChange={(e) =&gt; setNewName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
                  placeholder={texts.collectionName}
                  autoFocus
                /&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;label className="block text-white/70 text-sm mb-1"&gt;{texts.collectionDescription}&lt;/label&gt;
                &lt;textarea
                  value={newDescription}
                  onChange={(e) =&gt; setNewDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 resize-none"
                  rows={3}
                  placeholder={texts.collectionDescription}
                /&gt;
              &lt;/div&gt;
              &lt;div className="flex gap-3 justify-end pt-4"&gt;
                &lt;button
                  onClick={() =&gt; {
                    setShowCreateModal(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                  className="px-4 py-2 text-white/70 hover:text-white"
                &gt;
                  {texts.cancel}
                &lt;/button&gt;
                &lt;button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium"
                &gt;
                  {texts.create}
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {/* 重命名模态框 */}
      {editingCollectionId &amp;&amp; (
        &lt;div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"&gt;
          &lt;div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full"&gt;
            &lt;h3 className="text-white font-bold text-lg mb-4"&gt;{texts.rename}&lt;/h3&gt;
            &lt;div className="space-y-4"&gt;
              &lt;input
                type="text"
                value={newName}
                onChange={(e) =&gt; setNewName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
                autoFocus
              /&gt;
              &lt;div className="flex gap-3 justify-end"&gt;
                &lt;button
                  onClick={() =&gt; {
                    setEditingCollectionId(null);
                    setNewName('');
                  }}
                  className="px-4 py-2 text-white/70 hover:text-white"
                &gt;
                  {texts.cancel}
                &lt;/button&gt;
                &lt;button
                  onClick={handleRename}
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium"
                &gt;
                  {texts.rename}
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
}

export default FavoritesManager;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 4: 创建分类选择组件（视频卡片使用）

**Files:**

- Create: `components/CollectionSelector.tsx`

- [ ] **Step 1: 创建 CollectionSelector 组件**

```typescript
import React, { useState } from 'react';
import { FavoriteCollection } from '../types';
import { Check, X, FolderPlus } from 'lucide-react';

interface CollectionSelectorProps {
  collections: FavoriteCollection[];
  itemCollections: FavoriteCollection[];
  onAddToCollection: (collectionId: string) =&gt; void;
  onRemoveFromCollection: (collectionId: string) =&gt; void;
  onCreateCollection: (name: string) =&gt; void;
  onClose: () =&gt; void;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    addToCollection: '添加到分类',
    selectCollections: '选择分类',
    createNew: '创建新分类',
    collectionName: '分类名称',
    create: '创建',
    cancel: '取消',
    done: '完成'
  },
  en: {
    addToCollection: 'Add to Collection',
    selectCollections: 'Select Collections',
    createNew: 'Create New',
    collectionName: 'Collection Name',
    create: 'Create',
    cancel: 'Cancel',
    done: 'Done'
  }
};

export function CollectionSelector({
  collections,
  itemCollections,
  onAddToCollection,
  onRemoveFromCollection,
  onCreateCollection,
  onClose,
  language
}: CollectionSelectorProps) {
  const texts = t[language];
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const itemCollectionIds = new Set(itemCollections.map(c =&gt; c.id));

  const handleCreate = () =&gt; {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowCreateInput(false);
    }
  };

  return (
    &lt;div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"&gt;
      &lt;div className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[80vh] overflow-y-auto"&gt;
        &lt;div className="flex items-center justify-between mb-4"&gt;
          &lt;h3 className="text-white font-bold text-lg"&gt;{texts.addToCollection}&lt;/h3&gt;
          &lt;button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white"
          &gt;
            &lt;X size={24} /&gt;
          &lt;/button&gt;
        &lt;/div&gt;

        &lt;div className="space-y-2 mb-4"&gt;
          {collections.filter(c =&gt; c.id !== 'all').map(collection =&gt; {
            const isSelected = itemCollectionIds.has(collection.id);
            return (
              &lt;button
                key={collection.id}
                onClick={() =&gt; {
                  if (isSelected) {
                    onRemoveFromCollection(collection.id);
                  } else {
                    onAddToCollection(collection.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              &gt;
                &lt;div className={`w-6 h-6 rounded border flex items-center justify-center ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-white/30'
                }`}&gt;
                  {isSelected &amp;&amp; &lt;Check size={14} className="text-white" /&gt;}
                &lt;/div&gt;
                &lt;span className="flex-1"&gt;{collection.name}&lt;/span&gt;
                &lt;span className="text-sm opacity-60"&gt;{collection.itemIds.length}&lt;/span&gt;
              &lt;/button&gt;
            );
          })}
        &lt;/div&gt;

        {!showCreateInput ? (
          &lt;button
            onClick={() =&gt; setShowCreateInput(true)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 rounded-lg text-indigo-400 hover:bg-white/10 transition-colors"
          &gt;
            &lt;FolderPlus size={20} /&gt;
            &lt;span&gt;{texts.createNew}&lt;/span&gt;
          &lt;/button&gt;
        ) : (
          &lt;div className="space-y-3"&gt;
            &lt;input
              type="text"
              value={newCollectionName}
              onChange={(e) =&gt; setNewCollectionName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
              placeholder={texts.collectionName}
              autoFocus
            /&gt;
            &lt;div className="flex gap-3"&gt;
              &lt;button
                onClick={() =&gt; {
                  setShowCreateInput(false);
                  setNewCollectionName('');
                }}
                className="flex-1 px-4 py-3 text-white/70 hover:text-white bg-white/5 rounded-lg"
              &gt;
                {texts.cancel}
              &lt;/button&gt;
              &lt;button
                onClick={handleCreate}
                disabled={!newCollectionName.trim()}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium"
              &gt;
                {texts.create}
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        )}

        &lt;button
          onClick={onClose}
          className="w-full mt-4 px-4 py-3 bg-white/10 rounded-lg text-white font-medium hover:bg-white/20 transition-colors"
        &gt;
          {texts.done}
        &lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

export default CollectionSelector;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 5: 集成收藏功能到 StandardRoot

**Files:**

- Modify: `components/standard/StandardRoot.tsx`
- Modify: `src/locales/zh.ts`
- Modify: `src/locales/en.ts`

- [ ] **Step 1: 更新翻译文件**

在 `src/locales/zh.ts` 中添加收藏相关翻译：

```typescript
favorites: {
  manageCollections: '管理分类',
  createCollection: '创建分类',
  collectionName: '分类名称',
  collectionDescription: '描述（可选）',
  create: '创建',
  cancel: '取消',
  rename: '重命名',
  delete: '删除',
  deleteConfirm: '确定要删除这个分类吗？视频不会被删除。',
  sortBy: '排序方式',
  recent: '最近添加',
  name: '名称',
  allCollections: '全部分类',
  noCollections: '暂无分类',
  addToCollection: '添加到分类',
  selectCollections: '选择分类',
  createNew: '创建新分类',
  done: '完成'
}
```

在 `src/locales/en.ts` 中添加：

```typescript
favorites: {
  manageCollections: 'Manage Collections',
  createCollection: 'Create Collection',
  collectionName: 'Collection Name',
  collectionDescription: 'Description (optional)',
  create: 'Create',
  cancel: 'Cancel',
  rename: 'Rename',
  delete: 'Delete',
  deleteConfirm: 'Are you sure you want to delete this collection? Videos will not be deleted.',
  sortBy: 'Sort By',
  recent: 'Recently Added',
  name: 'Name',
  allCollections: 'All Collections',
  noCollections: 'No collections yet',
  addToCollection: 'Add to Collection',
  selectCollections: 'Select Collections',
  createNew: 'Create New',
  done: 'Done'
}
```

- [ ] **Step 2: 导入收藏组件和 Hook**

在 StandardRoot.tsx 顶部添加：

```typescript
import { FavoritesManager } from '../FavoritesManager';
import { CollectionSelector } from '../CollectionSelector';
import { useFavorites } from '../../src/hooks';
```

- [ ] **Step 3: 集成收藏功能状态**

在 StandardRoot 组件内部添加：

```typescript
const {
  collections,
  currentCollection,
  currentCollectionId,
  setCurrentCollectionId,
  sortOrder,
  setSortOrder,
  createCollection,
  deleteCollection,
  renameCollection,
  addToCollection,
  removeFromCollection,
  isInCollection,
  getItemCollections,
  getFilteredVideos,
} = useFavorites();

const [showCollectionSelector, setShowCollectionSelector] = useState(false);
const [selectedVideoForCollection, setSelectedVideoForCollection] = useState & lt;
EmbyItem | (null & gt);
null;
```

- [ ] **Step 4: 处理收藏分类筛选**

更新视频加载逻辑，当 feedType 为 favorites 时使用过滤后的视频：

```typescript
// 在 loadVideos 函数或 useEffect 中
const displayVideos = useMemo(() =&gt; {
  if (feedType === 'favorites') {
    return getFilteredVideos(videos);
  }
  return videos;
}, [videos, feedType, getFilteredVideos]);
```

- [ ] **Step 5: 更新收藏按钮功能**

修改原有的收藏切换功能，集成新的收藏分类系统：

```typescript
const handleToggleFavorite = useCallback(async (itemId: string, isFavorite: boolean) =&gt; {
  // 调用现有的 Emby 客户端 API
  await client.toggleFavorite(itemId, isFavorite, selectedLib?.Name || "收藏");

  // 同时更新本地收藏分类
  if (isFavorite) {
    // 添加到全部收藏
    addToCollection(itemId, 'all');
  } else {
    // 从所有分类移除
    removeFromCollection(itemId, 'all');
  }
}, [client, selectedLib, addToCollection, removeFromCollection]);
```

- [ ] **Step 6: 在菜单中添加收藏管理**

在 LibrarySelect 组件或侧边栏中添加收藏管理功能，或者在收藏页面添加管理按钮。

- [ ] **Step 7: 验证集成**

```bash
npm run build
```

Expected: 构建成功

---

### Task 6: 最终测试和验证

**Files:** All modified files

- [ ] **Step 1: 完整构建验证**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 功能测试清单**

- [ ] 可以创建新的收藏分类
- [ ] 可以重命名收藏分类
- [ ] 可以删除收藏分类
- [ ] 可以将视频添加到特定分类
- [ ] 可以从分类移除视频
- [ ] 可以切换显示不同分类的视频
- [ ] 可以按不同方式排序收藏视频
- [ ] 旧版收藏数据可以正常迁移
- [ ] 中英文切换正常
- [ ] 功能与现有收藏功能兼容

---

## 实施完成检查

- [ ] 所有任务步骤完成
- [ ] 代码已提交
- [ ] 功能已测试验证
- [ ] 文档已更新

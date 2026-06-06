import { useCallback, useRef, useEffect, useState } from 'react';

// ==================== 类型定义 ====================

/** 缓存选项配置 */
export interface CacheOptions {
  /** 最大缓存大小（字节），默认 100MB */
  maxSize?: number;
  /** LRU淘汰阈值，当缓存达到此百分比时触发淘汰 */
  lruThreshold?: number;
  /** 单个条目最大生存时间（毫秒），默认 7 天 */
  maxAge?: number;
  /** 数据库名称 */
  dbName?: string;
  /** 数据库版本 */
  dbVersion?: number;
}

/** 缓存条目结构 */
export interface CacheEntry<T = unknown> {
  /** 缓存键 */
  key: string;
  /** 缓存数据 */
  data: T;
  /** 创建时间戳 */
  timestamp: number;
  /** 上次访问时间戳 */
  lastAccessed: number;
  /** 数据大小（字节） */
  size: number;
  /** 缓存类型：'metadata' | 'image' */
  type: 'metadata' | 'image';
}

/** 缓存统计信息 */
export interface CacheStats {
  /** 当前缓存总大小（字节） */
  totalSize: number;
  /** 缓存条目数量 */
  itemCount: number;
  /** 元数据缓存数量 */
  metadataCount: number;
  /** 图片缓存数量 */
  imageCount: number;
  /** 最大缓存限制（字节） */
  maxSize: number;
  /** 缓存使用百分比 */
  usagePercent: number;
}

// ==================== 常量 ====================

const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_LRU_THRESHOLD = 0.9; // 90%
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7天
const DB_NAME = 'embytok_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache_entries';

/** IndexedDB 数据库实例 */
let dbInstance: IDBDatabase | null = null;

// ==================== IndexedDB 工具函数 ====================

/**
 * 初始化 IndexedDB 数据库连接
 */
function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建缓存存储区，使用 keyPath 和索引
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        // 创建索引用于 LRU 淘汰和过期清理
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * 获取数据库事务和对象存储
 */
async function getStore(mode: IDBTransactionMode = 'readonly'): Promise<{
  transaction: IDBTransaction;
  store: IDBObjectStore;
}> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);
  return { transaction, store };
}

/**
 * 将数据转换为可存储的对象
 */
function serializeData(data: unknown): string {
  return JSON.stringify(data);
}

/**
 * 从存储的数据中反序列化
 */
function deserializeData<T>(serialized: string): T {
  return JSON.parse(serialized) as T;
}

/**
 * 计算数据大小（字节）
 */
function calculateSize(data: unknown): number {
  const serialized = serializeData(data);
  // 使用 Blob 获取准确的字节大小
  return new Blob([serialized]).size;
}

// ==================== Hook 实现 ====================

export interface UseCacheReturn {
  /** 缓存视频元数据 */
  cacheVideoMetadata: (itemId: string, data: unknown) => Promise<void>;
  /** 获取缓存的视频元数据 */
  getCachedMetadata: (itemId: string) => Promise<unknown | null>;
  /** 缓存图片（Blob） */
  cacheImage: (url: string, blob: Blob) => Promise<void>;
  /** 获取缓存的图片（返回 ObjectURL） */
  getCachedImage: (url: string) => Promise<string | null>;
  /** 清除所有缓存 */
  clearCache: () => Promise<void>;
  /** 获取缓存统计信息 */
  getCacheStats: () => CacheStats;
  /** 清理过期缓存 */
  pruneExpiredCache: () => Promise<void>;
}

/**
 * 本地缓存 Hook
 * 基于 IndexedDB 实现，支持 LRU 淘汰策略和缓存大小限制
 */
export function useCache(options: CacheOptions = {}): UseCacheReturn {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    lruThreshold = DEFAULT_LRU_THRESHOLD,
    maxAge = DEFAULT_MAX_AGE
  } = options;

  // 使用 ref 存储缓存大小，避免每次渲染重新计算
  const currentSizeRef = useRef(0);
  const statsRef = useRef<CacheStats>({
    totalSize: 0,
    itemCount: 0,
    metadataCount: 0,
    imageCount: 0,
    maxSize,
    usagePercent: 0
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化数据库
  useEffect(() => {
    initDB()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Cache initialization failed:', error);
      });
  }, []);

  /**
   * 更新缓存统计信息
   */
  const updateStats = useCallback(async (): Promise<CacheStats> => {
    try {
      const { store } = await getStore('readonly');
      const stats: CacheStats = {
        totalSize: 0,
        itemCount: 0,
        metadataCount: 0,
        imageCount: 0,
        maxSize,
        usagePercent: 0
      };

      return new Promise((resolve) => {
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const entry = cursor.value as CacheEntry;
            stats.totalSize += entry.size;
            stats.itemCount++;
            if (entry.type === 'metadata') {
              stats.metadataCount++;
            } else {
              stats.imageCount++;
            }
            cursor.continue();
          } else {
            stats.usagePercent = (stats.totalSize / stats.maxSize) * 100;
            currentSizeRef.current = stats.totalSize;
            statsRef.current = stats;
            resolve(stats);
          }
        };

        request.onerror = () => {
          resolve(stats);
        };
      });
    } catch {
      return statsRef.current;
    }
  }, [maxSize]);

  /**
   * 执行 LRU 淘汰策略，清理最少使用的条目直到缓存大小合适
   */
  const performLRUEviction = useCallback(async (): Promise<void> => {
    if (currentSizeRef.current < maxSize * lruThreshold) {
      return; // 缓存还未达到阈值，无需淘汰
    }

    try {
      const { store, transaction } = await getStore('readwrite');

      // 获取所有条目，按 lastAccessed 升序排列（最久未使用的在前面）
      const index = store.index('lastAccessed');
      const entries: CacheEntry[] = [];

      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            entries.push(cursor.value);
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // 按 lastAccessed 排序，最早访问的排在前面
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // 计算需要释放的空间（目标：达到 70% 的阈值）
      const targetSize = maxSize * 0.7;
      let sizeToFree = currentSizeRef.current - targetSize;
      let freedSize = 0;

      // 删除最久未使用的条目
      for (const entry of entries) {
        if (freedSize >= sizeToFree) {
          break;
        }

        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(entry.key);
          deleteRequest.onsuccess = () => {
            freedSize += entry.size;
            currentSizeRef.current -= entry.size;
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }

      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });
    } catch (error) {
      console.error('LRU eviction failed:', error);
    }
  }, [maxSize, lruThreshold]);

  /**
   * 清理过期缓存
   */
  const pruneExpiredCache = useCallback(async (): Promise<void> => {
    try {
      const { store, transaction } = await getStore('readwrite');
      const now = Date.now();
      const expiredKeys: string[] = [];

      // 找出所有过期的条目
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const entry = cursor.value as CacheEntry;
            if (now - entry.timestamp > maxAge) {
              expiredKeys.push(entry.key);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // 删除过期条目
      for (const key of expiredKeys) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }

      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });

      // 更新统计
      await updateStats();
    } catch (error) {
      console.error('Prune expired cache failed:', error);
    }
  }, [maxAge, updateStats]);

  /**
   * 缓存视频元数据
   */
  const cacheVideoMetadata = useCallback(
    async (itemId: string, data: unknown): Promise<void> => {
      if (!isInitialized) {
        await initDB();
      }

      try {
        const key = `metadata_${itemId}`;
        const size = calculateSize(data);
        const now = Date.now();

        const entry: CacheEntry = {
          key,
          data,
          timestamp: now,
          lastAccessed: now,
          size,
          type: 'metadata'
        };

        // 先执行 LRU 淘汰检查
        await performLRUEviction();

        // 存入 IndexedDB
        const { store } = await getStore('readwrite');
        await new Promise<void>((resolve, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => {
            currentSizeRef.current += size;
            resolve();
          };
          request.onerror = () => reject(request.error);
        });

        // 更新统计
        await updateStats();
      } catch (error) {
        console.error('Cache video metadata failed:', error);
        throw error;
      }
    },
    [isInitialized, performLRUEviction, updateStats]
  );

  /**
   * 获取缓存的视频元数据
   */
  const getCachedMetadata = useCallback(
    async (itemId: string): Promise<unknown | null> => {
      if (!isInitialized) {
        await initDB();
      }

      try {
        const key = `metadata_${itemId}`;
        const { store } = await getStore('readonly');

        const result = await new Promise<CacheEntry | undefined>((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (!result) {
          return null;
        }

        // 检查是否过期
        const now = Date.now();
        if (now - result.timestamp > maxAge) {
          // 删除过期数据
          const { store: writeStore } = await getStore('readwrite');
          await new Promise<void>((resolve) => {
            const deleteRequest = writeStore.delete(key);
            deleteRequest.onsuccess = () => resolve();
          });
          currentSizeRef.current -= result.size;
          await updateStats();
          return null;
        }

        // 更新 lastAccessed 时间（用于 LRU）
        const { store: writeStore } = await getStore('readwrite');
        await new Promise<void>((resolve, reject) => {
          const updateRequest = writeStore.put({
            ...result,
            lastAccessed: now
          });
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });

        return result.data;
      } catch (error) {
        console.error('Get cached metadata failed:', error);
        return null;
      }
    },
    [isInitialized, maxAge, updateStats]
  );

  /**
   * 缓存图片（Blob）
   */
  const cacheImage = useCallback(
    async (url: string, blob: Blob): Promise<void> => {
      if (!isInitialized) {
        await initDB();
      }

      try {
        const key = `image_${url}`;
        const size = blob.size;
        const now = Date.now();

        // 将 Blob 转换为 Base64 字符串存储（IndexedDB 不直接支持 Blob）
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // 移除 data:image/...;base64, 前缀
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });

        const entry: CacheEntry<string> = {
          key,
          data: base64Data,
          timestamp: now,
          lastAccessed: now,
          size,
          type: 'image'
        };

        // 先执行 LRU 淘汰检查
        await performLRUEviction();

        // 存入 IndexedDB
        const { store } = await getStore('readwrite');
        await new Promise<void>((resolve, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => {
            currentSizeRef.current += size;
            resolve();
          };
          request.onerror = () => reject(request.error);
        });

        // 更新统计
        await updateStats();
      } catch (error) {
        console.error('Cache image failed:', error);
        throw error;
      }
    },
    [isInitialized, performLRUEviction, updateStats]
  );

  /**
   * 获取缓存的图片（返回 ObjectURL）
   */
  const getCachedImage = useCallback(
    async (url: string): Promise<string | null> => {
      if (!isInitialized) {
        await initDB();
      }

      try {
        const key = `image_${url}`;
        const { store } = await getStore('readonly');

        const result = await new Promise<CacheEntry<string> | undefined>((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (!result) {
          return null;
        }

        // 检查是否过期
        const now = Date.now();
        if (now - result.timestamp > maxAge) {
          // 删除过期数据
          const { store: writeStore } = await getStore('writeonly');
          await new Promise<void>((resolve) => {
            const deleteRequest = writeStore.delete(key);
            deleteRequest.onsuccess = () => resolve();
          });
          currentSizeRef.current -= result.size;
          await updateStats();
          return null;
        }

        // 将 Base64 转换回 Blob 并创建 ObjectURL
        // 尝试从 Base64 数据中获取 MIME 类型
        let mimeType = 'image/jpeg';
        if (url.includes('.png')) {
          mimeType = 'image/png';
        } else if (url.includes('.gif')) {
          mimeType = 'image/gif';
        } else if (url.includes('.webp')) {
          mimeType = 'image/webp';
        }

        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: mimeType });

        // 创建 ObjectURL
        const objectUrl = URL.createObjectURL(imageBlob);

        // 更新 lastAccessed 时间
        const { store: writeStore } = await getStore('readwrite');
        await new Promise<void>((resolve, reject) => {
          const updateRequest = writeStore.put({
            ...result,
            lastAccessed: now
          });
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });

        return objectUrl;
      } catch (error) {
        console.error('Get cached image failed:', error);
        return null;
      }
    },
    [isInitialized, maxAge, updateStats]
  );

  /**
   * 清除所有缓存
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      const { store, transaction } = await getStore('readwrite');

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });

      // 重置统计
      currentSizeRef.current = 0;
      statsRef.current = {
        totalSize: 0,
        itemCount: 0,
        metadataCount: 0,
        imageCount: 0,
        maxSize,
        usagePercent: 0
      };
    } catch (error) {
      console.error('Clear cache failed:', error);
      throw error;
    }
  }, [maxSize]);

  /**
   * 获取缓存统计信息
   */
  const getCacheStats = useCallback((): CacheStats => {
    return statsRef.current;
  }, []);

  // 组件卸载时清理 ObjectURL（但保留缓存数据）
  useEffect(() => {
    return () => {
      // 不在这里清理 ObjectURL，因为它们可能被组件继续使用
    };
  }, []);

  // 定期清理过期缓存（每 10 分钟检查一次）
  useEffect(() => {
    if (!isInitialized) return;

    pruneExpiredCache();

    const interval = setInterval(() => {
      pruneExpiredCache();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, pruneExpiredCache]);

  return {
    cacheVideoMetadata,
    getCachedMetadata,
    cacheImage,
    getCachedImage,
    clearCache,
    getCacheStats,
    pruneExpiredCache
  };
}

// ==================== 导出类型 ====================

export type { CacheOptions, CacheEntry, CacheStats };

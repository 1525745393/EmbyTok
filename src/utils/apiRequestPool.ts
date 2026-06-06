/**
 * API 请求合并工具
 * 功能：请求去重、请求缓存、短时间内相同请求直接返回缓存结果、使用 Promise.all 批量处理
 */

/**
 * API 请求池类
 * 用于合并相同或相似的 API 请求，减少重复请求
 */
export class ApiRequestPool {
  // 缓存 Map，key 为请求标识，value 为 Promise
  private cache: Map<string, Promise<any>>;
  // 缓存时间戳 Map，用于追踪缓存过期
  private cacheTime: Map<string, number>;
  // 缓存 TTL，默认 5 秒
  private cacheTTL: number = 5000;
  // 最大并发数
  private maxConcurrency: number = 5;

  constructor(options?: { cacheTTL?: number; maxConcurrency?: number }) {
    this.cache = new Map();
    this.cacheTime = new Map();
    if (options?.cacheTTL) {
      this.cacheTTL = options.cacheTTL;
    }
    if (options?.maxConcurrency) {
      this.maxConcurrency = options.maxConcurrency;
    }
  }

  /**
   * 生成缓存 key
   * @param key - 请求标识
   * @returns 处理后的缓存 key
   */
  private getCacheKey(key: string): string {
    return key;
  }

  /**
   * 检查缓存是否过期
   * @param key - 缓存 key
   * @returns 是否过期
   */
  private isCacheExpired(key: string): boolean {
    const timestamp = this.cacheTime.get(key);
    if (!timestamp) return true;
    return Date.now() - timestamp > this.cacheTTL;
  }

  /**
   * 执行单个 API 请求
   * 相同 key 的请求在缓存期内共享同一个 Promise
   * @param key - 请求标识（通常为 URL 或 API 端点）
   * @param fetcher - 请求执行函数
   * @returns Promise<T>
   */
  request<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = this.getCacheKey(key);

    // 检查是否存在有效缓存
    if (this.cache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
      return this.cache.get(cacheKey) as Promise<T>;
    }

    // 检查是否有过期缓存，如果有则清除
    if (this.cache.has(cacheKey) && this.isCacheExpired(cacheKey)) {
      this.cache.delete(cacheKey);
      this.cacheTime.delete(cacheKey);
    }

    // 创建新请求
    const promise = fetcher().finally(() => {
      // 缓存过期后清除
      setTimeout(() => {
        if (this.cache.get(cacheKey) === promise) {
          this.cache.delete(cacheKey);
          this.cacheTime.delete(cacheKey);
        }
      }, this.cacheTTL);
    });

    // 存储 Promise 和时间戳
    this.cache.set(cacheKey, promise);
    this.cacheTime.set(cacheKey, Date.now());

    return promise;
  }

  /**
   * 批量执行 API 请求
   * 使用 Promise.all 并行处理，限制最大并发数
   * @param requests - 请求函数数组
   * @returns Promise 数组的结果
   */
  async batch<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    if (requests.length === 0) {
      return [];
    }

    // 将请求数组分批，每批最多 maxConcurrency 个
    const batches: Array<Array<() => Promise<T>>> = [];
    for (let i = 0; i < requests.length; i += this.maxConcurrency) {
      batches.push(requests.slice(i, i + this.maxConcurrency));
    }

    // 逐批执行，每批内部并行
    const results: T[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(batch.map((req) => req()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 批量执行 API 请求（带去重）
   * 相同的请求 key 只会执行一次，结果共享
   * @param requests - 请求函数数组，每个函数返回 { key, fetcher }
   * @returns Promise 数组的结果，按输入顺序返回
   */
  async batchWithDeduplication<T>(
    requests: Array<{ key: string; fetcher: () => Promise<T> }>
  ): Promise<T[]> {
    if (requests.length === 0) {
      return [];
    }

    // 去重：收集唯一的 key
    const uniqueKeys: string[] = [];
    const keyIndexMap = new Map<string, number>();

    requests.forEach((req, index) => {
      const cacheKey = this.getCacheKey(req.key);
      if (!keyIndexMap.has(cacheKey)) {
        keyIndexMap.set(cacheKey, uniqueKeys.length);
        uniqueKeys.push(cacheKey);
      }
    });

    // 对唯一 key 执行请求
    const uniqueRequests = uniqueKeys.map((key) => {
      const originalReq = requests.find((r) => this.getCacheKey(r.key) === key);
      return {
        key,
        fetcher: originalReq!.fetcher
      };
    });

    // 使用 Promise.all 并行执行（受 maxConcurrency 限制）
    const uniqueResults = await this.batch(
      uniqueRequests.map((req) => () => this.request(req.key, req.fetcher))
    );

    // 按原始顺序映射结果
    const results: T[] = new Array(requests.length);
    requests.forEach((req, index) => {
      const cacheKey = this.getCacheKey(req.key);
      const uniqueIndex = keyIndexMap.get(cacheKey)!;
      results[index] = uniqueResults[uniqueIndex];
    });

    return results;
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTime.clear();
  }

  /**
   * 清除指定 key 的缓存
   * @param key - 请求标识
   */
  clearCacheKey(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);
    this.cacheTime.delete(cacheKey);
  }

  /**
   * 设置缓存 TTL
   * @param ttl - 缓存时间（毫秒）
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * 获取当前缓存大小
   * @returns 缓存数量
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// 导出单例，全局共享请求池
export const apiRequestPool = new ApiRequestPool({
  cacheTTL: 5000,
  maxConcurrency: 5
});

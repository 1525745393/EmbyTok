import { useState, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 基础延迟时间（毫秒） */
  baseDelay: number;
  /** 最大延迟时间（毫秒） */
  maxDelay: number;
}

/**
 * 错误恢复 Hook 返回值接口
 */
export interface UseErrorRecoveryReturn {
  /** 带重试的函数执行 */
  withRetry: <T>(fn: () => Promise<T>, config?: Partial<RetryConfig>) => Promise<T>;
  /** 网络请求带重试，失败返回 null */
  withRetryOnNetwork: <T>(fn: () => Promise<T>) => Promise<T | null>;
  /** 是否正在重试 */
  isRetrying: boolean;
  /** 当前重试次数 */
  retryCount: number;
  /** 最近一次错误 */
  lastError: Error | null;
  /** 重置错误状态 */
  resetError: () => void;
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * 计算指数退避延迟时间
 * @param retryCount 当前重试次数
 * @param baseDelay 基础延迟时间
 * @param maxDelay 最大延迟时间
 * @returns 延迟时间（毫秒）
 */
const calculateExponentialBackoff = (
  retryCount: number,
  baseDelay: number,
  maxDelay: number
): number => {
  // 基础延迟 * 2^重试次数
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  // 添加随机抖动（10%）
  const jitter = exponentialDelay * 0.1 * Math.random();
  // 返回受限的延迟时间
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * 错误恢复 Hook
 * 提供网络请求自动重试功能，采用指数退避策略
 */
export function useErrorRecovery(): UseErrorRecoveryReturn {
  const { isOnline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // 用于避免在组件卸载后更新状态
  const isMountedRef = useRef(true);

  // 延迟函数
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  /**
   * 带重试的函数执行
   * @param fn 要执行的异步函数
   * @param config 重试配置
   * @returns Promise<T>
   */
  const withRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_CONFIG, ...config };
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，先等待延迟
        if (attempt > 0) {
          if (!isMountedRef.current) {
            throw new Error('组件已卸载');
          }
          setRetryCount(attempt);
          setIsRetrying(true);
          
          const backoffDelay = calculateExponentialBackoff(attempt - 1, baseDelay, maxDelay);
          await delay(backoffDelay);
        }
        
        const result = await fn();
        
        // 成功重置状态
        if (isMountedRef.current) {
          setIsRetrying(false);
          setRetryCount(0);
          setLastError(null);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果离线且不是最后一次尝试，跳过等待直接重试
        if (!isOnline && attempt < maxRetries) {
          continue;
        }
      }
    }
    
    // 所有重试都失败
    if (isMountedRef.current) {
      setIsRetrying(false);
      setLastError(lastError);
    }
    
    throw lastError;
  }, [isOnline, delay]);

  /**
   * 网络请求带重试，失败返回 null（不抛出错误）
   * 适用于非关键的UI操作
   * @param fn 要执行的异步函数
   * @returns Promise<T | null>
   */
  const withRetryOnNetwork = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      return await withRetry(fn);
    } catch {
      // 网络请求失败返回 null，不抛出错误
      return null;
    }
  }, [withRetry]);

  /**
   * 重置错误状态
   */
  const resetError = useCallback(() => {
    if (isMountedRef.current) {
      setIsRetrying(false);
      setRetryCount(0);
      setLastError(null);
    }
  }, []);

  // 组件卸载时标记
  // 注意：这里不使用 useEffect 来设置 isMountedRef = false
  // 因为这个 hook 通常在组件顶层使用，不需要清理

  return {
    withRetry,
    withRetryOnNetwork,
    isRetrying,
    retryCount,
    lastError,
    resetError,
  };
}

/**
 * 视频播放错误恢复配置
 */
export const VIDEO_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 2000,
  maxDelay: 15000,
};

/**
 * API 调用错误恢复配置
 */
export const API_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
};

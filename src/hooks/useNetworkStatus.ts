import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 网络状态信息
 */
export interface UseNetworkStatusReturn {
  /** 是否在线 */
  isOnline: boolean;
  /** 是否离线 */
  isOffline: boolean;
  /** 网络连接类型 */
  effectiveType: string | null;
  /** 下行链路速度 (Mbps) */
  downlink: number | null;
  /** 往返延迟 (ms) */
  rtt: number | null;
  /** 是否使用流量计费连接 */
  saveData: boolean;
  /** 注册在线回调 */
  onOnline: (callback: () => void) => () => void;
  /** 注册离线回调 */
  onOffline: (callback: () => void) => () => void;
}

/**
 * 网络类型
 */
type NetworkEffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

/**
 * 网络信息接口 (Chrome 61+)
 */
interface NetworkInformation extends EventTarget {
  effectiveType: NetworkEffectiveType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  onchange: (() => void) | null;
}

/**
 * Navigator接口扩展
 */
interface NavigatorWithNetworkInfo extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * 离线状态检测 Hook
 * 用于检测网络状态变化并提供回调机制
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  // 在线状态
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  // 网络连接信息
  const [effectiveType, setEffectiveType] = useState<string | null>(null);
  const [downlink, setDownlink] = useState<number | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const [saveData, setSaveData] = useState<boolean>(false);

  // 回调函数引用
  const onlineCallbacksRef = useRef<Set<() => void>>(new Set());
  const offlineCallbacksRef = useRef<Set<() => void>>(new Set());

  // 获取网络连接信息
  const updateNetworkInfo = useCallback(() => {
    const nav = navigator as NavigatorWithNetworkInfo;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      setEffectiveType(connection.effectiveType || null);
      setDownlink(connection.downlink ?? null);
      setRtt(connection.rtt ?? null);
      setSaveData(connection.saveData ?? false);
    }
  }, []);

  // 在线事件处理
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    updateNetworkInfo();
    
    // 执行所有注册的在线回调
    onlineCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[useNetworkStatus] Online callback error:', error);
      }
    });
  }, [updateNetworkInfo]);

  // 离线事件处理
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    
    // 执行所有注册的离线回调
    offlineCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[useNetworkStatus] Offline callback error:', error);
      }
    });
  }, []);

  // 监听网络连接变化
  const handleConnectionChange = useCallback(() => {
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  useEffect(() => {
    // 初始化网络信息
    updateNetworkInfo();

    // 监听在线/离线事件
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听网络连接变化
    const nav = navigator as NavigatorWithNetworkInfo;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, updateNetworkInfo]);

  /**
   * 注册在线回调
   * @param callback 回调函数
   * @returns 取消注册的函数
   */
  const onOnline = useCallback((callback: () => void): (() => void) => {
    onlineCallbacksRef.current.add(callback);
    
    // 返回取消注册的函数
    return () => {
      onlineCallbacksRef.current.delete(callback);
    };
  }, []);

  /**
   * 注册离线回调
   * @param callback 回调函数
   * @returns 取消注册的函数
   */
  const onOffline = useCallback((callback: () => void): (() => void) => {
    offlineCallbacksRef.current.add(callback);
    
    // 返回取消注册的函数
    return () => {
      offlineCallbacksRef.current.delete(callback);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    effectiveType,
    downlink,
    rtt,
    saveData,
    onOnline,
    onOffline
  };
}

export type { NetworkEffectiveType };

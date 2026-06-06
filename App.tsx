
import React, { useState, useLayoutEffect, lazy, Suspense, useEffect } from 'react';

// 代码分割：延迟加载大型组件
const StandardRoot = lazy(() => import('./components/standard/StandardRoot'));
const TVRoot = lazy(() => import('./components/tv/TVRoot'));

// 离线状态检测
import { useNetworkStatus } from './src/hooks';

// 简单的加载组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-black">
    <div className="w-12 h-12 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

/**
 * 离线状态标识组件
 */
const OfflineIndicator = () => (
  <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center bg-yellow-500 text-black text-sm py-1 px-4">
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
    </svg>
    <span>离线模式 - 显示缓存内容</span>
  </div>
);

function App() {
  const [deviceMode, setDeviceMode] = useState<'standard' | 'tv'>(() => {
    try {
      const forcedMode = localStorage.getItem('embyForceDeviceMode');
      if (forcedMode === 'tv' || forcedMode === 'standard') return forcedMode as 'standard' | 'tv';
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV = userAgent.includes('tv') || userAgent.includes('googletv') || userAgent.includes('smarttv');
      return isTV ? 'tv' : 'standard';
    } catch (e) {
      return 'standard';
    }
  });

  // 使用网络状态Hook
  const { isOffline } = useNetworkStatus();

  // 注册Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('[App] Service Worker registered:', registration.scope);
      }).catch(error => {
        console.error('[App] Service Worker registration failed:', error);
      });

      // 监听来自Service Worker的消息
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data) {
          switch (event.data.type) {
            case 'SYNC_STARTED':
              console.log('[App] Background sync started');
              break;
            case 'SYNC_COMPLETED':
              console.log('[App] Background sync completed');
              break;
            case 'SYNC_FAILED':
              console.error('[App] Background sync failed:', event.data.error);
              break;
          }
        }
      });
    }
  }, []);

  useLayoutEffect(() => {
    document.body.classList.remove('mode-tv', 'mode-standard');
    document.body.classList.add(deviceMode === 'tv' ? 'mode-tv' : 'mode-standard');
  }, [deviceMode]);

  const handleToggleMode = (mode: 'standard' | 'tv') => {
    localStorage.setItem('embyForceDeviceMode', mode);
    window.location.reload();
  };

  return (
    <div className="h-screen w-full bg-black">
      {/* 离线状态标识 */}
      {isOffline && <OfflineIndicator />}
      
      <Suspense fallback={<LoadingFallback />}>
        {deviceMode === 'tv' ? (
          <TVRoot onToggleMode={() => handleToggleMode('standard')} />
        ) : (
          <StandardRoot onToggleMode={() => handleToggleMode('tv')} />
        )}
      </Suspense>
    </div>
  );
}

export default App;

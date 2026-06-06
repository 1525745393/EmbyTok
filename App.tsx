import React, { useState, useLayoutEffect, lazy, Suspense } from 'react';

// 代码分割：延迟加载大型组件
const StandardRoot = lazy(() => import('./components/standard/StandardRoot'));
const TVRoot = lazy(() => import('./components/tv/TVRoot'));

// 简单的加载组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-black">
    <div className="w-12 h-12 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

function App() {
  const [deviceMode, setDeviceMode] = useState<'standard' | 'tv'>(() => {
    try {
      const forcedMode = localStorage.getItem('embyForceDeviceMode');
      if (forcedMode === 'tv' || forcedMode === 'standard') return forcedMode as 'standard' | 'tv';
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV =
        userAgent.includes('tv') || userAgent.includes('googletv') || userAgent.includes('smarttv');
      return isTV ? 'tv' : 'standard';
    } catch (e) {
      return 'standard';
    }
  });

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

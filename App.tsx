import React, { useState, useLayoutEffect } from 'react';
import StandardRoot from './components/standard/StandardRoot';
import TVRoot from './components/tv/TVRoot';

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
      {deviceMode === 'tv' ? (
        <TVRoot onToggleMode={() => handleToggleMode('standard')} />
      ) : (
        <StandardRoot onToggleMode={() => handleToggleMode('tv')} />
      )}
    </div>
  );
}

export default App;

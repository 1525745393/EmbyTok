import { useState, useEffect } from 'react';
import { OrientationMode } from '../../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useUIState() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [orientationMode, setOrientationMode] = useLocalStorageState<OrientationMode>(
    'embyOrientationMode',
    'vertical'
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => !prev);
  };

  return {
    isMenuOpen,
    setIsMenuOpen,
    isMuted,
    setIsMuted,
    isFullscreen,
    isAutoPlay,
    setIsAutoPlay,
    orientationMode,
    setOrientationMode,
    toggleFullscreen,
    toggleMute,
    toggleAutoPlay,
  };
}

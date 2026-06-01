import { useState, useEffect } from 'react';
import { isMobile, isLandscape, isIOSSafari } from '../../utils';

interface DeviceDetectionState {
  isIOSSafari: boolean;
  isMobile: boolean;
  isLandscape: boolean;
}

export function useDeviceDetection(): DeviceDetectionState {
  const [state, setState] = useState<DeviceDetectionState>({
    isIOSSafari: false,
    isMobile: false,
    isLandscape: false,
  });

  useEffect(() => {
    const updateState = () => {
      setState({
        isIOSSafari: isIOSSafari(),
        isMobile: isMobile(),
        isLandscape: isLandscape(),
      });
    };

    updateState();
    window.addEventListener('resize', updateState);

    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

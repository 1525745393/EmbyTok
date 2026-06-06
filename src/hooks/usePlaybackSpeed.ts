import { useState, useCallback, useMemo } from 'react';
import type { PlaybackSpeed, PlaybackSpeedOption } from '../../types';

const PRESET_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

const clampToPreset = (speed: number): PlaybackSpeed => {
  const clamped = Math.max(0.5, Math.min(5.0, speed));
  // Find the nearest preset value
  let nearest = PRESET_SPEEDS[0];
  let minDiff = Math.abs(clamped - PRESET_SPEEDS[0]);
  for (const preset of PRESET_SPEEDS) {
    const diff = Math.abs(clamped - preset);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = preset;
    }
  }
  return nearest;
};

interface UsePlaybackSpeedOptions {
  initialSpeed?: PlaybackSpeed;
  onSpeedChange?: (speed: PlaybackSpeed) => void;
}

interface UsePlaybackSpeedReturn {
  currentSpeed: PlaybackSpeed;
  setSpeed: (speed: number) => void;
  resetSpeed: () => void;
  isCustomSpeed: boolean;
  presetSpeeds: PlaybackSpeedOption[];
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
}

export function usePlaybackSpeed(
  options: UsePlaybackSpeedOptions = {}
): UsePlaybackSpeedReturn {
  const { initialSpeed = 1.0, onSpeedChange } = options;

  const [currentSpeed, setCurrentSpeed] = useState<PlaybackSpeed>(initialSpeed);

  const setSpeed = useCallback((speed: number) => {
    const clampedSpeed = clampToPreset(speed);
    setCurrentSpeed(clampedSpeed);
    onSpeedChange?.(clampedSpeed);
  }, [onSpeedChange]);

  const presetSpeeds: PlaybackSpeedOption[] = PRESET_SPEEDS.map(value => ({
    value,
    label: value === 1.0 ? '1x' : `${value}x`
  }));

  const resetSpeed = useCallback(() => {
    setSpeed(1.0);
  }, [setSpeed]);

  const isCustomSpeed = useMemo(() => {
    return currentSpeed !== 1.0;
  }, [currentSpeed]);

  const increaseSpeed = useCallback(() => {
    const currentIndex = PRESET_SPEEDS.findIndex(p => p === currentSpeed);
    if (currentIndex < PRESET_SPEEDS.length - 1) {
      setSpeed(PRESET_SPEEDS[currentIndex + 1]);
    }
  }, [currentSpeed, setSpeed]);

  const decreaseSpeed = useCallback(() => {
    const currentIndex = PRESET_SPEEDS.findIndex(p => p === currentSpeed);
    if (currentIndex > 0) {
      setSpeed(PRESET_SPEEDS[currentIndex - 1]);
    }
  }, [currentSpeed, setSpeed]);

  return {
    currentSpeed,
    setSpeed,
    resetSpeed,
    isCustomSpeed,
    presetSpeeds,
    increaseSpeed,
    decreaseSpeed,
  };
}

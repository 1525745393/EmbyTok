import { useState, useCallback, useRef, useEffect } from 'react';
import type { BufferingState } from '../../types';

interface UseBufferingOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  bufferThreshold?: number;
}

interface UseBufferingReturn {
  bufferingState: BufferingState;
  isBuffering: boolean;
  bufferedPercent: number;
  waitingForData: boolean;
  showBufferingIndicator: boolean;
}

export function useBuffering(
  options: UseBufferingOptions
): UseBufferingReturn {
  const { videoRef, bufferThreshold = 0.1 } = options;

  const [bufferingState, setBufferingState] = useState<BufferingState>({
    isBuffering: false,
    bufferedPercent: 0,
    waitingForData: false,
  });

  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBufferTimeRef = useRef<number>(0);

  const calculateBufferedPercent = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return 0;

    const currentTime = video.currentTime;
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    return Math.min(1, bufferedEnd / video.duration);
  }, [videoRef]);

  const handleWaiting = useCallback(() => {
    const now = Date.now();
    if (now - lastBufferTimeRef.current < 500) return;
    lastBufferTimeRef.current = now;

    setBufferingState(prev => ({
      ...prev,
      isBuffering: true,
      waitingForData: true,
    }));
  }, []);

  const handleCanPlay = useCallback(() => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }

    const bufferedPercent = calculateBufferedPercent();

    setBufferingState({
      isBuffering: false,
      bufferedPercent,
      waitingForData: false,
    });
  }, [calculateBufferedPercent]);

  const handleProgress = useCallback(() => {
    const bufferedPercent = calculateBufferedPercent();
    setBufferingState(prev => ({
      ...prev,
      bufferedPercent,
    }));
  }, [calculateBufferedPercent]);

  const handlePlaying = useCallback(() => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }

    setBufferingState(prev => ({
      ...prev,
      isBuffering: false,
      waitingForData: false,
    }));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('progress', handleProgress);

      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, [videoRef, handleWaiting, handleCanPlay, handlePlaying, handleProgress]);

  const showBufferingIndicator = bufferingState.isBuffering && bufferingState.waitingForData;

  return {
    bufferingState,
    isBuffering: bufferingState.isBuffering,
    bufferedPercent: bufferingState.bufferedPercent,
    waitingForData: bufferingState.waitingForData,
    showBufferingIndicator,
  };
}

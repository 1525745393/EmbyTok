import { useState, useRef, useCallback } from 'react';

interface GestureControlsOptions {
  togglePlay: () => void;
  onDoubleTap?: () => void;
  onSwipeDown?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface GestureControlsState {
  playbackRate: number;
  seekOffset: number | null;
  hearts: Array<{ id: number; x: number; y: number; rotate: number }>;
}

interface GestureControlsActions {
  addHeart: (x: number, y: number) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

export function useGestureControls(
  options: GestureControlsOptions
): GestureControlsState & GestureControlsActions {
  const { togglePlay, onDoubleTap, onSwipeDown, videoRef } = options;

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [seekOffset, setSeekOffset] = useState<number | null>(null);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; rotate: number }>>(
    []
  );

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragging = useRef(false);
  const isLongPress = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef<number>(0);

  const addHeart = useCallback((x: number, y: number) => {
    const id = Date.now();
    const rotate = (Math.random() - 0.5) * 40;
    setHearts((prev) => [...prev, { id, x, y, rotate }]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1000);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isDragging.current = false;
      isLongPress.current = false;
      setSeekOffset(null);

      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setPlaybackRate(2.0);
        if (videoRef.current) videoRef.current.playbackRate = 2.0;
      }, 500);
    },
    [videoRef]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    if (
      Math.abs(currentX - touchStartX.current) > 10 ||
      Math.abs(currentY - touchStartY.current) > 10
    ) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (!isLongPress.current) {
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;

      if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDragging.current = true;
        const offset = Math.round(deltaX / 5);
        setSeekOffset(offset);
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const touchDuration = Date.now() - touchStartTime.current;

      if (isLongPress.current) {
        isLongPress.current = false;
        setPlaybackRate(1.0);
        if (videoRef.current) videoRef.current.playbackRate = 1.0;
      } else if (isDragging.current) {
        if (videoRef.current && seekOffset !== null) {
          const newTime = videoRef.current.currentTime + seekOffset;
          videoRef.current.currentTime = Math.min(Math.max(newTime, 0), videoRef.current.duration);
        }
        isDragging.current = false;
        setSeekOffset(null);
      } else if (touchDuration < 300) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 50) {
          // 向下轻扫
          if (onSwipeDown) {
            onSwipeDown();
          }
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
          const currentTime = Date.now();
          const tapInterval = currentTime - lastTapTime.current;

          if (tapInterval < 300 && tapInterval > 0) {
            const touchX = e.changedTouches[0].clientX;
            const touchY = e.changedTouches[0].clientY;
            addHeart(touchX, touchY);
            if (onDoubleTap) {
              onDoubleTap();
            }
          } else {
            setTimeout(() => {
              const newTapTime = Date.now();
              const newTapInterval = newTapTime - lastTapTime.current;
              if (newTapInterval >= 300) {
                togglePlay();
              }
            }, 310);
          }

          lastTapTime.current = currentTime;
        }
      }
    },
    [togglePlay, onDoubleTap, onSwipeDown, addHeart, seekOffset, videoRef]
  );

  return {
    playbackRate,
    seekOffset,
    hearts,
    addHeart,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

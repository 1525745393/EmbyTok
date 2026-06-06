import React, { useRef, useCallback, useState, useMemo } from 'react';
import type { ProgressBarProps } from '../types';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  buffered,
  onSeek,
  onSeekStart,
  onSeekEnd,
  showTime = true,
  language = 'zh',
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const bufferedWidth = useMemo(() => {
    if (!buffered || !duration || buffered.length === 0) return 0;
    const bufferedEnd = buffered.end(buffered.length - 1);
    return (bufferedEnd / duration) * 100;
  }, [buffered, duration]);

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
    onSeekStart?.();

    const clientX = e.touches[0].clientX;
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      setSeekTime(newTime);
    }
  }, [duration, onSeekStart]);

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSeeking || !progressBarRef.current) return;

    const clientX = e.touches[0].clientX;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setSeekTime(newTime);
  }, [isSeeking, duration]);

  const handleProgressTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isSeeking) return;

    if (seekTime !== null) {
      onSeek(seekTime);
    }

    setIsSeeking(false);
    setSeekTime(null);
    onSeekEnd?.();
  }, [isSeeking, seekTime, onSeek, onSeekEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSeeking(true);
    onSeekStart?.();

    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      setSeekTime(newTime);
    }
  }, [duration, onSeekStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSeeking || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setSeekTime(newTime);
  }, [isSeeking, duration]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isSeeking) return;

    if (seekTime !== null) {
      onSeek(seekTime);
    }

    setIsSeeking(false);
    setSeekTime(null);
    onSeekEnd?.();
  }, [isSeeking, seekTime, onSeek, onSeekEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isSeeking && seekTime !== null) {
      onSeek(seekTime);
    }
    setIsSeeking(false);
    setSeekTime(null);
    onSeekEnd?.();
  }, [isSeeking, seekTime, onSeek, onSeekEnd]);

  const displayTime = seekTime !== null ? seekTime : currentTime;

  return (
    <div className="absolute bottom-8 left-4 right-4 h-12 flex items-center gap-3 z-50">
      {showTime && (
        <span className="text-white text-xs font-medium drop-shadow-md w-10 text-right pointer-events-none">
          {formatTime(displayTime)}
        </span>
      )}

      <div
        ref={progressBarRef}
        className="flex-1 relative h-12 flex items-center cursor-pointer"
        onTouchStart={handleProgressTouchStart}
        onTouchMove={handleProgressTouchMove}
        onTouchEnd={handleProgressTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 -my-4" />

        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
          {bufferedWidth > 0 && (
            <div
              className="absolute h-full bg-white/40 transition-all duration-150"
              style={{ width: `${bufferedWidth}%` }}
            />
          )}
          <div
            className="h-full bg-indigo-500 transition-all duration-75"
            style={{ width: `${isSeeking && seekTime !== null ? (seekTime / duration) * 100 : progress}%` }}
          />
        </div>

        <div
          className="absolute w-6 h-6 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${isSeeking && seekTime !== null ? (seekTime / duration) * 100 : progress}%` }}
        >
          <div className="w-full h-full rounded-full border-2 border-indigo-500 bg-white" />
        </div>
      </div>

      {showTime && (
        <span className="text-white text-xs font-medium drop-shadow-md w-10 pointer-events-none">
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
};

export default React.memo(ProgressBar);

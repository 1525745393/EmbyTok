import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * 视频控制 Hook 的配置选项
 */
interface VideoControlsOptions {
  isActive: boolean;
  isMuted: boolean;
  isAutoPlay?: boolean;
  onVideoEnd?: () => void;
}

/**
 * 视频控制状态
 */
interface VideoControlsState {
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  isUserPaused: boolean;
  error: string | null;
}

/**
 * 视频控制操作
 */
interface VideoControlsActions {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  togglePlay: () => void;
  handlePlaying: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleVideoEnded: () => void;
  handleSeekStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleSeekMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleSeekEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  setError: (error: string | null) => void;
}

/**
 * 视频控制自定义 Hook
 * 提供视频播放、暂停、进度控制等功能
 * @param options - 视频控制配置选项
 * @returns 视频控制状态和操作
 */
export function useVideoControls(
  options: VideoControlsOptions
): VideoControlsState & VideoControlsActions {
  const { isActive, isMuted, isAutoPlay = false, onVideoEnd } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 监听活动状态和静音状态变化
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (isActive) {
      setError(null);
      video.playbackRate = 1.0;
      setIsUserPaused(false);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }

      containerRef.current?.focus({ preventScroll: true });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setHasStarted(false);
      setIsUserPaused(false);
    }
  }, [isActive, isMuted]);

  /**
   * 切换播放/暂停状态
   */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setIsUserPaused(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setIsUserPaused(true);
    }
  }, []);

  /**
   * 处理视频开始播放事件
   */
  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    setHasStarted(true);
  }, []);

  /**
   * 处理视频时间更新事件
   */
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [isSeeking]);

  /**
   * 处理视频元数据加载完成事件
   */
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  /**
   * 处理视频播放结束事件
   */
  const handleVideoEnded = useCallback(() => {
    if (isAutoPlay && onVideoEnd) {
      onVideoEnd();
    }
  }, [isAutoPlay, onVideoEnd]);

  /**
   * 处理开始拖动进度条事件
   * @param e - 触摸或鼠标事件
   */
  const handleSeekStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
  }, []);

  /**
   * 处理拖动进度条移动事件
   * @param e - 触摸或鼠标事件
   */
  const handleSeekMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      if (!isSeeking || !containerRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, clientX / rect.width));
      setCurrentTime(percent * duration);
    },
    [isSeeking, duration]
  );

  /**
   * 处理结束拖动进度条事件
   * @param e - 触摸或鼠标事件
   */
  const handleSeekEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      if (!isSeeking) return;

      setIsSeeking(false);
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    },
    [isSeeking, currentTime]
  );

  return {
    isPlaying,
    hasStarted,
    currentTime,
    duration,
    isSeeking,
    isUserPaused,
    error,
    videoRef,
    containerRef,
    togglePlay,
    handlePlaying,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVideoEnded,
    handleSeekStart,
    handleSeekMove,
    handleSeekEnd,
    setError,
  };
}

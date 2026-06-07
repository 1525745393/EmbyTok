import { useState, useRef, useEffect, useCallback } from 'react';

interface VideoControlsOptions {
  isActive: boolean;
  isMuted: boolean;
  isAutoPlay?: boolean;
  onVideoEnd?: () => void;
  onVideoLoadStart?: () => void;
  onVideoLoadComplete?: () => void;
}

interface VideoControlsState {
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  isUserPaused: boolean;
  error: string | null;
}

interface VideoControlsActions {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  togglePlay: () => void;
  handleLoadStart: () => void;
  handleCanPlay: () => void;
  handlePlaying: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleVideoEnded: () => void;
  handleSeekStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleSeekMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleSeekEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  setError: (error: string | null) => void;
}

export function useVideoControls(
  options: VideoControlsOptions
): VideoControlsState & VideoControlsActions {
  const {
    isActive,
    isMuted,
    isAutoPlay = false,
    onVideoEnd,
    onVideoLoadStart = () => {},
    onVideoLoadComplete = () => {},
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 用于节流时间更新的 refs
  const lastUpdateTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const pendingTimeRef = useRef<number | null>(null);

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

  // 清理 RAF 和处理 pending time 清理逻辑
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

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

  const handleLoadStart = useCallback(() => {
    onVideoLoadStart();
  }, [onVideoLoadStart]);

  const handleCanPlay = useCallback(() => {
    onVideoLoadComplete();
  }, [onVideoLoadComplete]);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    setHasStarted(true);
    onVideoLoadComplete();
  }, [onVideoLoadComplete]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      const now = Date.now();
      const newTime = videoRef.current.currentTime;

      // 使用 requestAnimationFrame 节流，限制更新频率
      if (now - lastUpdateTimeRef.current >= 100) {
        // 每100ms最多更新一次
        // 如果有pending的 RAF，取消它
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          setCurrentTime(newTime);
          lastUpdateTimeRef.current = Date.now();
          rafIdRef.current = null;
        });
      } else {
        // 保存最新的时间以便稍后更新
        pendingTimeRef.current = newTime;
      }
    }
  }, [isSeeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (isAutoPlay && onVideoEnd) {
      onVideoEnd();
    }
  }, [isAutoPlay, onVideoEnd]);

  const handleSeekStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
  }, []);

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
    handleLoadStart,
    handleCanPlay,
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

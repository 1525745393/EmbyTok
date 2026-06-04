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
  const { isActive, isMuted, isAutoPlay = false, onVideoEnd, onVideoLoadStart = () => {}, onVideoLoadComplete = () => {} } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setCurrentTime(videoRef.current.currentTime);
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

  const handleSeekMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!isSeeking || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, clientX / rect.width));
    setCurrentTime(percent * duration);
  }, [isSeeking, duration]);

  const handleSeekEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!isSeeking) return;

    setIsSeeking(false);
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [isSeeking, currentTime]);

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
    setError
  };
}

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmbyItem, SubtitleTrack, SubtitleSettings, PlaybackSpeed } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Play, AlertCircle, Heart, Info, Disc, ChevronsRight, Rewind, FastForward, Zap, Infinity, Trash2, Subtitles, Loader } from 'lucide-react';
import { useLazyImage, usePlaybackSpeed, useBuffering, useVideoPreview } from '../src/hooks';
import SubtitleControls from './SubtitleControls';
import SubtitleRenderer from './SubtitleRenderer';
import ProgressBar from './ProgressBar';
import SpeedControlPanel from './SpeedControlPanel';
import VideoPreview from './VideoPreview';

interface VideoCardProps {
  item: EmbyItem;
  client: MediaClient;
  isActive: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isAutoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  onVideoEnd?: () => void;
  language?: 'zh' | 'en';
  isPreloaded?: boolean;
  cacheStatus?: string;
  subtitleTracks?: SubtitleTrack[];
  subtitleSettings?: SubtitleSettings;
  onUpdateSubtitleSettings?: (settings: Partial<SubtitleSettings>) => void;
  onAddToWatchHistory?: (item: EmbyItem, currentTime: number, duration: number) => void;
  /** 预览模式：显示预览触发区域 */
  isPreviewMode?: boolean;
  /** 是否正在预览 */
  isPreviewing?: boolean;
  /** 开始预览回调 */
  onPreviewStart?: (videoId: string) => void;
  /** 停止预览回调 */
  onPreviewStop?: () => void;
}

const VideoCardComponent: React.FC<VideoCardProps> = ({ 
    item, 
    client, 
    isActive, 
    isFavorite, 
    onToggleFavorite,
    onDelete = () => {},
    isMuted,
    onToggleMute,
    isAutoPlay = false,
    onToggleAutoPlay = () => {},
    onVideoEnd = () => {},
    language = 'zh',
    isPreloaded = false,
    cacheStatus = 'idle',
    subtitleTracks = [],
    subtitleSettings,
    onUpdateSubtitleSettings = () => {},
    onAddToWatchHistory = () => {},
    isPreviewMode = false,
    isPreviewing = false,
    onPreviewStart,
    onPreviewStop
}) => {
  const t = useMemo(() => ({
    zh: {
      deleteVideo: '删除视频',
      deleteWarning: '⚠️ 警告：这将删除媒体库中的原文件！',
      deleteConfirm: '确定要删除此视频吗？',
      cancel: '取消',
      confirmDelete: '确定删除',
      mediaType: '视频',
      noOverview: '暂无简介',
      autoPlayOn: '自动连播已开启',
      doubleSpeed: '2倍速中',
      videoLoadError: '无法加载视频',
      networkError: '网络连接失败，请检查网络后重试',
      fileNotFound: '视频文件不存在',
      formatNotSupported: '视频格式不支持',
      unknownError: '播放出错，请重试',
      imageLoadError: '图片加载失败'
    },
    en: {
      deleteVideo: 'Delete Video',
      deleteWarning: '⚠️ Warning: This will delete the original file from the media library!',
      deleteConfirm: 'Are you sure you want to delete this video?',
      cancel: 'Cancel',
      confirmDelete: 'Delete',
      mediaType: 'Video',
      noOverview: 'No overview',
      autoPlayOn: 'Auto-play enabled',
      doubleSpeed: '2x Speed',
      videoLoadError: 'Failed to load video',
      networkError: 'Network error, please check your connection and try again',
      fileNotFound: 'Video file not found',
      formatNotSupported: 'Video format not supported',
      unknownError: 'Playback error, please try again',
      imageLoadError: 'Image load failed'
    }
  }[language]), [language]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [videoPreload, setVideoPreload] = useState<'metadata' | 'auto' | 'none'>('metadata');
  const MAX_RETRIES = 3;
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [seekOffset, setSeekOffset] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isSpeedAdjusting, setIsSpeedAdjusting] = useState(false);
  const hideProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showSubtitleControls, setShowSubtitleControls] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<any[]>([]);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  // Playback speed hook
  const {
    currentSpeed,
    setSpeed,
    isCustomSpeed,
    presetSpeeds,
    resetSpeed
  } = usePlaybackSpeed({
    initialSpeed: 1.0,
    onSpeedChange: (speed) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
    }
  });

  // Buffering hook
  const { showBufferingIndicator } = useBuffering({
    videoRef,
    bufferThreshold: 0.1
  });

  // 图片懒加载 hook
  const {
    setRef: setPosterRef,
    isLoaded: posterIsLoaded,
    isError: posterIsError,
    retryLoad: retryPosterLoad,
    canRetry: canRetryPoster
  } = useLazyImage({
    retryCount: 3,
    retryDelay: 1500,
    onError: () => setImageLoadError(true)
  });
  
  const [isUserPaused, setIsUserPaused] = useState(false);
  
  const [isScreenLandscape, setIsScreenLandscape] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isLongPress = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedStartRate = useRef<PlaybackSpeed>(2.0);
  
  const lastTapTime = useRef<number>(0);
  const progressTapCount = useRef(0);
  const progressTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; rotate: number; scale: number }[]>([]);
  
  const saveProgressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STORAGE_KEY_PREFIX = 'embystok_progress_';
  
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 预览相关状态
  const [isHovered, setIsHovered] = useState(false);
  const previewHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoSrc = useMemo(() => client.getVideoUrl(item), [client, item]);
  const posterSrc = useMemo(() => 
    item.ImageTags?.Primary 
      ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary') 
      : undefined,
    [client, item.Id, item.ImageTags?.Primary]
  );
    
  const isContentLandscape = useMemo(() => (item.Width || 0) > (item.Height || 0), [item.Width, item.Height]);

  const showBlurBackground = useMemo(() => isScreenLandscape && !isContentLandscape, [isScreenLandscape, isContentLandscape]);
  
  const videoObjectFitClass = useMemo(() => 
    (isScreenLandscape || isContentLandscape) 
      ? 'object-contain' 
      : 'object-cover',
    [isScreenLandscape, isContentLandscape]
  );

  const showProgressBar = useMemo(() => duration > 180 && !isAutoPlay && showProgress, [duration, isAutoPlay, showProgress]);
  const renderUI = useMemo(() => !isAutoPlay, [isAutoPlay]);

  const addHeart = useCallback((x: number, y: number) => {
      const id = Date.now();
      const rotate = (Math.random() - 0.5) * 40;
      const scale = 0.8 + Math.random() * 0.6;
      setHearts(prev => [...prev, { id, x, y, rotate, scale }]);
      
      setTimeout(() => {
          setHearts(prev => prev.filter(h => h.id !== id));
      }, 1000);
  }, []);

  // 预览相关处理器
  const handlePreviewHoverStart = useCallback(() => {
    if (!isPreviewMode || isActive) return;
    
    setIsHovered(true);
    // 500ms后开始预览
    previewHoverTimerRef.current = setTimeout(() => {
      onPreviewStart?.(item.Id);
    }, 500);
  }, [isPreviewMode, isActive, item.Id, onPreviewStart]);

  const handlePreviewHoverEnd = useCallback(() => {
    setIsHovered(false);
    if (previewHoverTimerRef.current) {
      clearTimeout(previewHoverTimerRef.current);
      previewHoverTimerRef.current = null;
    }
    onPreviewStop?.();
  }, [onPreviewStop]);

  const handlePreviewClick = useCallback(() => {
    // 点击预览可以跳转到该视频
  }, []);

  const saveProgress = useCallback(() => {
      if (!videoRef.current || !item.Id) return;
      try {
          const progress = {
              time: videoRef.current.currentTime,
              duration: videoRef.current.duration,
              timestamp: Date.now()
          };
          localStorage.setItem(STORAGE_KEY_PREFIX + item.Id, JSON.stringify(progress));
      } catch (e) {
      }
  }, [item.Id]);

  const loadProgress = useCallback(() => {
      if (!item.Id) return 0;
      try {
          const saved = localStorage.getItem(STORAGE_KEY_PREFIX + item.Id);
          if (saved) {
              const progress = JSON.parse(saved);
              if (Date.now() - progress.timestamp < 7 * 24 * 60 * 60 * 1000) {
                  return progress.time;
              }
          }
      } catch (e) {
      }
      return 0;
  }, [item.Id]);

  const resetHideTimer = useCallback(() => {
    if (hideProgressTimerRef.current) {
      clearTimeout(hideProgressTimerRef.current);
    }
    hideProgressTimerRef.current = setTimeout(() => {
      setShowProgress(false);
    }, 5000);
  }, []);

  const showProgressAndResetTimer = useCallback(() => {
    setShowProgress(true);
    resetHideTimer();
  }, [resetHideTimer]);

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

  const handlePlaying = useCallback(() => {
      setIsPlaying(true);
      setHasStarted(true); 
      setIsLoading(false);
  }, []);

  const handleWaiting = useCallback(() => {
      setIsLoading(true);
  }, []);

  const handleCanPlay = useCallback(() => {
      setIsLoading(false);
      setRetryCount(0);
      if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
      }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
      // 定期保存观看历史
      if (isActive && videoRef.current.currentTime > 0) {
        onAddToWatchHistory(
          item,
          videoRef.current.currentTime * 10000000, // 转换为 ticks
          (videoRef.current.duration || 0) * 10000000
        );
      }
    }
  }, [isSeeking, isActive, item, onAddToWatchHistory]);

  const handleLoadedMetadata = useCallback(() => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
          const savedTime = loadProgress();
          if (savedTime > 0 && savedTime < videoRef.current.duration - 10) {
              videoRef.current.currentTime = savedTime;
          }
      }
  }, [loadProgress]);

  const handleVideoEnded = useCallback(() => {
      if (item.Id) {
          try {
              localStorage.removeItem(STORAGE_KEY_PREFIX + item.Id);
          } catch (e) {}
      }
      if (isAutoPlay) {
          onVideoEnd();
      }
  }, [item.Id, isAutoPlay, onVideoEnd]);

  const handleButtonAction = useCallback((e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent, action: () => void) => {
      e.stopPropagation();
      if (e.type === 'touchend') {
          e.preventDefault(); 
      }
      action();
  }, []);

  const stopProp = useCallback((e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch(e.key) {
      case 'Enter':
      case ' ':
          togglePlay();
          break;
      case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
      case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
      case 'm':
          onToggleMute();
          break;
      case 'f':
          onToggleFavorite();
          break;
    }
  }, [togglePlay, onToggleMute, onToggleFavorite]);

  const updateSeekPosition = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (!progressBarRef.current || !duration) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      setCurrentTime(newTime);
      
      if (videoRef.current) {
          videoRef.current.currentTime = newTime;
      }
  }, [duration]);

  const handleSeekStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsSeeking(true);
      updateSeekPosition(e);
  }, [updateSeekPosition]);

  const handleSeekMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isSeeking) return;
      updateSeekPosition(e);
  }, [isSeeking, updateSeekPosition]);

  const handleSeekEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      if (!isSeeking) return;
      setIsSeeking(false);
  }, [isSeeking]);

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      showProgressAndResetTimer();
      handleSeekStart(e);
  }, [showProgressAndResetTimer, handleSeekStart]);

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      showProgressAndResetTimer();
      handleSeekMove(e);
  }, [showProgressAndResetTimer, handleSeekMove]);

  const handleProgressTouchEnd = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      handleSeekEnd(e);
  }, [handleSeekEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
      isLongPress.current = false;
      setSeekOffset(null);
      setIsSpeedAdjusting(false);

      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          setIsSpeedAdjusting(true);
          speedStartRate.current = currentSpeed || 2.0;
          setShowSpeedPanel(true);
          if (videoRef.current) videoRef.current.playbackRate = currentSpeed || 2.0;
      }, 300);
  }, [currentSpeed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;

      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
          }
      }

      if (isLongPress.current && Math.abs(deltaY) > 20) {
          let newRate: PlaybackSpeed = speedStartRate.current + (-deltaY / 100) * 4.5 as PlaybackSpeed;
          newRate = Math.max(0.5, Math.min(5.0, newRate)) as PlaybackSpeed;
          setSpeed(newRate);
          if (videoRef.current) {
              videoRef.current.playbackRate = newRate;
          }
          speedStartRate.current = newRate;
      } else if (!isLongPress.current && Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
           isDragging.current = true;
           const offset = Math.round(deltaX / 5); 
           setSeekOffset(offset);
      }
  }, [setSpeed]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      if (isLongPress.current) {
          isLongPress.current = false;
          setIsSpeedAdjusting(false);
          if (!showSpeedPanel) {
            resetSpeed();
          }
      } else if (isDragging.current) {
          if (videoRef.current && seekOffset !== null) {
              const newTime = videoRef.current.currentTime + seekOffset;
              videoRef.current.currentTime = Math.min(Math.max(newTime, 0), videoRef.current.duration);
          }
          isDragging.current = false;
          setSeekOffset(null);
      } else {
          if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
              const currentTime = Date.now();
              const tapInterval = currentTime - lastTapTime.current;
              
              if (tapInterval < 300 && tapInterval > 0) {
                  const touch = e.changedTouches[0];
                  addHeart(touch.clientX - 40, touch.clientY - 40);
                  
                  if (!isFavorite) {
                      onToggleFavorite();
                  }
                  
                  showProgressAndResetTimer();
              } else {
                  setTimeout(() => {
                      const newTapTime = Date.now();
                      const newTapInterval = newTapTime - lastTapTime.current;
                      if (newTapInterval >= 300) {
                          if (showProgress) {
                              togglePlay();
                          } else {
                              showProgressAndResetTimer();
                          }
                      }
                  }, 310);
              }
              
              lastTapTime.current = currentTime;
          }
      }
  }, [addHeart, isFavorite, onToggleFavorite, showProgress, togglePlay, showProgressAndResetTimer]);

  const formatTimeText = useCallback((ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes} 分钟`;
  }, []);

  const formatSecondsToTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
      const handleResize = () => {
          setIsScreenLandscape(window.innerWidth > window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideProgressTimerRef.current) clearTimeout(hideProgressTimerRef.current);
    };
  }, [resetHideTimer]);

  useEffect(() => {
    if (isActive && isPlaying) {
      saveProgressIntervalRef.current = setInterval(() => {
        saveProgress();
      }, 5000);
    } else if (saveProgressIntervalRef.current) {
      saveProgress();
      clearInterval(saveProgressIntervalRef.current);
      saveProgressIntervalRef.current = null;
    }
    
    return () => {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      saveProgress();
    };
  }, [isActive, isPlaying, saveProgress]);

  // 根据活跃状态动态调整视频 preload 策略
  useEffect(() => {
    if (isActive) {
      setVideoPreload('auto');
    } else {
      setVideoPreload('metadata');
    }
  }, [isActive]);

  // 预览计时器清理
  useEffect(() => {
    return () => {
      if (previewHoverTimerRef.current) {
        clearTimeout(previewHoverTimerRef.current);
        previewHoverTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = isMuted;

    if (isActive) {
      setError(null);
      video.playbackRate = 1.0;
      setPlaybackRate(1.0);
      setIsUserPaused(false);
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
              setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Autoplay failed", err);
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

  return (
    <div 
        ref={containerRef}
        tabIndex={isActive ? 0 : -1}
        className="relative w-full h-full bg-black snap-start shrink-0 flex items-center justify-center overflow-hidden touch-pan-y select-none focus:outline-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
    >
      {showBlurBackground && posterSrc && (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
               <img 
                  src={posterSrc} 
                  alt="" 
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                  loading="lazy"
                  decoding="async"
               />
               <div className="absolute inset-0 bg-black/30"></div>
          </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full pointer-events-none relative z-10 bg-transparent ${videoObjectFitClass}`}
        src={videoSrc}
        loop={!isAutoPlay}
        playsInline
        muted={isMuted}
        preload={videoPreload}
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onCanPlayThrough={() => {
          setIsLoading(false);
        }}
        onError={(e) => {
          const video = e.target as HTMLVideoElement;
          let errorMsg = t.unknownError;
          
          if (video.error) {
            switch (video.error.code) {
              case video.error.MEDIA_ERR_ABORTED:
                errorMsg = t.unknownError;
                break;
              case video.error.MEDIA_ERR_NETWORK:
                errorMsg = t.networkError;
                break;
              case video.error.MEDIA_ERR_DECODE:
                errorMsg = t.formatNotSupported;
                break;
              case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = t.fileNotFound;
                break;
            }
          }
          setError(errorMsg);
        }}
      />

      {posterSrc && !hasStarted && (
        <>
          <img 
              ref={setPosterRef}
              data-src={posterSrc}
              className={`absolute inset-0 w-full h-full z-10 bg-transparent pointer-events-none ${videoObjectFitClass} ${posterIsLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              alt=""
              decoding="async"
              onLoad={() => {}}
              onError={() => setImageLoadError(true)}
          />
          {!posterIsLoaded && (
            <div className="absolute inset-0 w-full h-full z-9 bg-zinc-900 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
          {posterIsError && canRetryPoster && (
            <div className="absolute inset-0 w-full h-full z-9 bg-zinc-900 flex flex-col items-center justify-center gap-3">
              <p className="text-white/70 text-sm">{t.imageLoadError}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setImageLoadError(false);
                  retryPosterLoad();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
              >
                {language === 'zh' ? '重试' : 'Retry'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 预览触发区域和预览组件 - 仅预览模式显示 */}
      {isPreviewMode && posterSrc && (
        <>
          {/* 预览触发区域 - 透明覆盖层 */}
          <div
            className={`absolute inset-0 z-20 transition-opacity duration-200 ${isHovered ? 'bg-black/10' : 'bg-transparent'}`}
            onMouseEnter={handlePreviewHoverStart}
            onMouseLeave={handlePreviewHoverEnd}
            onTouchStart={handlePreviewHoverStart}
            onTouchEnd={handlePreviewHoverEnd}
          />
          
          {/* 视频预览窗口 */}
          <VideoPreview
            videoUrl={videoSrc}
            posterUrl={posterSrc}
            isActive={isPreviewing}
            onPreviewEnd={handlePreviewHoverEnd}
            onPreviewClick={handlePreviewClick}
            previewDuration={3000}
          />
        </>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}

      {!isPlaying && !error && !seekOffset && !isLongPress.current && isUserPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-20">
          <Play className="w-16 h-16 text-white/50 fill-white/50" />
        </div>
      )}

      {showBufferingIndicator && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full">
            <Loader className="w-4 h-4 text-white animate-spin" />
            <span className="text-white text-xs">
              {language === 'zh' ? '缓冲中...' : 'Buffering...'}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence>
          {hearts.map(heart => (
              <motion.div
                  key={heart.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                      scale: [0, heart.scale * 1.3, heart.scale],
                      opacity: [0, 1, 1],
                      y: -100 - Math.random() * 50
                  }}
                  exit={{ scale: heart.scale * 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                      position: 'fixed',
                      left: heart.x - 40,
                      top: heart.y - 40,
                      zIndex: 100,
                      rotate: heart.rotate
                  }}
              >
                  <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg" />
              </motion.div>
          ))}
      </AnimatePresence>

      {currentSpeed !== 1.0 && !showSpeedPanel && (
          <div 
            className="absolute top-24 left-0 right-0 flex justify-center z-50 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeedPanel(true);
            }}
          >
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold text-sm">{currentSpeed}x</span>
            </div>
          </div>
      )}

      {showSpeedPanel && (
        <SpeedControlPanel
          currentSpeed={currentSpeed}
          onSpeedChange={(speed) => {
            setSpeed(speed);
            setShowSpeedPanel(false);
          }}
          onClose={() => setShowSpeedPanel(false)}
          language={language}
        />
      )}

      {seekOffset !== null && (
          <div className="absolute top-24 left-0 right-0 flex flex-col items-center justify-start z-50 pointer-events-none">
              <div className="flex flex-col items-center gap-1 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl">
                  {seekOffset > 0 ? (
                       <FastForward className="w-6 h-6 text-white/90 fill-white/20" />
                  ) : (
                       <Rewind className="w-6 h-6 text-white/90 fill-white/20" />
                  )}
                  <div className="text-lg font-bold text-white drop-shadow-lg">
                      {seekOffset > 0 ? '+' : ''}{seekOffset}s
                  </div>
              </div>
          </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-center mb-4">{error}</p>
          {retryCount < MAX_RETRIES && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
                setRetryCount(prev => prev + 1);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-sm font-bold"
            >
              {language === 'zh' ? `重试 (${MAX_RETRIES - retryCount})` : `Retry (${MAX_RETRIES - retryCount})`}
            </button>
          )}
        </div>
      )}
      
      <div className="absolute bottom-8 right-2 z-40 w-12 flex flex-col items-center justify-center pointer-events-auto">
          <button
            onTouchStart={stopProp} 
            onMouseDown={stopProp}
            onTouchEnd={(e) => handleButtonAction(e, onToggleAutoPlay)}
            onClick={(e) => handleButtonAction(e, onToggleAutoPlay)}
            className={`p-2.5 rounded-full backdrop-blur-sm transition-all active:scale-90 focus:ring-2 focus:ring-green-500 outline-none shadow-lg ${isAutoPlay ? 'bg-green-500/80 text-white' : 'bg-black/30 text-white/50 hover:bg-black/50 hover:text-white'}`}
          >
              <Infinity className="w-6 h-6" />
          </button>
      </div>

      {renderUI && (
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-30 pointer-events-auto">
              <div className="relative w-12 h-12 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                      {posterSrc ? (
                          <img src={posterSrc} alt="Poster" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-xs">Media</div>
                      )}
                  </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                  <button 
                    tabIndex={0}
                    onTouchStart={stopProp} 
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, onToggleFavorite)}
                    onClick={(e) => handleButtonAction(e, onToggleFavorite)}
                    className="p-2 rounded-full transition-transform active:scale-75 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                      <Heart 
                        className={`w-8 h-8 drop-shadow-md transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white fill-transparent'}`} 
                        strokeWidth={isFavorite ? 0 : 2}
                      />
                  </button>

              </div>

              <div className="flex flex-col items-center gap-1">
                  <button 
                    tabIndex={0}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, () => setShowInfo(!showInfo))}
                    onClick={(e) => handleButtonAction(e, () => setShowInfo(!showInfo))}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                      <Info className="w-7 h-7 text-white drop-shadow-md" />
                  </button>

              </div>

              <div className="flex flex-col items-center gap-1">
                  <button 
                    tabIndex={0}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, () => {
                      setShowDeleteConfirm(true);
                    })}
                    onClick={(e) => handleButtonAction(e, () => {
                      setShowDeleteConfirm(true);
                    })}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20 focus:ring-2 focus:ring-red-500 outline-none"
                  >
                      <Trash2 className="w-7 h-7 text-red-500 drop-shadow-md" />
                  </button>

              </div>

              <div className="flex flex-col items-center gap-1">
                  <button 
                    tabIndex={0}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, () => setShowSpeedPanel(!showSpeedPanel))}
                    onClick={(e) => handleButtonAction(e, () => setShowSpeedPanel(!showSpeedPanel))}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                      <ChevronsRight className="w-7 h-7 text-white drop-shadow-md" />
                  </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                  <button 
                    tabIndex={0}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, () => setShowSubtitleControls(!showSubtitleControls))}
                    onClick={(e) => handleButtonAction(e, () => setShowSubtitleControls(!showSubtitleControls))}
                    className={`p-2 rounded-full transition-all active:scale-90 focus:ring-2 focus:ring-indigo-500 outline-none shadow-lg ${subtitleSettings?.enabled ? 'bg-indigo-600/80 text-white' : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'}`}
                  >
                      <Subtitles className="w-7 h-7 drop-shadow-md" />
                  </button>
              </div>

              <div 
                    tabIndex={0}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, onToggleMute)}
                    onClick={(e) => handleButtonAction(e, onToggleMute)}
                    className={`mt-4 w-10 h-10 rounded-full bg-zinc-900 border-4 cursor-pointer transition-colors duration-300 flex items-center justify-center overflow-hidden focus:ring-2 focus:ring-indigo-500 outline-none ${isMuted ? 'border-red-500/80' : 'border-zinc-800'} ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
              >
                    {posterSrc ? (
                        <img src={posterSrc} className="w-full h-full object-cover opacity-70" loading="lazy" decoding="async" />
                    ) : (
                        <Disc className="w-6 h-6 text-zinc-500" />
                    )}
              </div>
          </div>
      )}

      {renderUI && (
          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-300 pointer-events-auto z-10 ${showInfo ? 'h-2/3 from-black/95' : 'pt-24'}`}>
            <div className="flex flex-col items-start max-w-[80%]">
                <h3 className="text-white font-bold text-lg drop-shadow-md mb-2 leading-tight">
                  {item.Name}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-white/90 mb-2 font-medium drop-shadow-md">
                  {item.ProductionYear && <span className="bg-white/20 px-1.5 py-0.5 rounded">{item.ProductionYear}</span>}
                  <span>{formatTimeText(item.RunTimeTicks)}</span>
                  <span className="uppercase border border-white/30 px-1 rounded text-[10px]">{item.MediaType || t.mediaType}</span>
                </div>

                <div 
                    tabIndex={showInfo ? 0 : -1}
                    onTouchStart={stopProp}
                    onMouseDown={stopProp}
                    onTouchEnd={(e) => handleButtonAction(e, () => setShowInfo(!showInfo))}
                    onClick={(e) => handleButtonAction(e, () => setShowInfo(!showInfo))}
                    className={`text-white/80 text-sm drop-shadow-md transition-all duration-300 cursor-pointer focus:ring-1 focus:ring-white/50 rounded ${showInfo ? 'line-clamp-none overflow-y-auto max-h-[40vh]' : 'line-clamp-2'}`}
                >
                  {item.Overview || t.noOverview}
                </div>
            </div>
          </div>
      )}

      {isSpeedAdjusting && !showSpeedPanel && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-2 animate-in fade-in zoom-in">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold">{currentSpeed.toFixed(1)}x</span>
              </div>
          </div>
      )}

      {showProgressBar && duration > 0 && (
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            buffered={videoRef.current?.buffered || null}
            onSeek={(time) => {
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            onSeekStart={() => {
              setIsSeeking(true);
            }}
            onSeekEnd={() => {
              setIsSeeking(false);
            }}
            showTime={true}
            language={language}
          />
      )}

      {subtitleSettings && (
        <SubtitleRenderer
          cues={subtitleCues}
          currentTime={currentTime}
          settings={subtitleSettings}
        />
      )}

      {showSubtitleControls && subtitleSettings && (
        <SubtitleControls
          tracks={subtitleTracks}
          settings={subtitleSettings}
          onToggleSubtitles={() => onUpdateSubtitleSettings({ enabled: !subtitleSettings.enabled })}
          onSelectTrack={(trackId) => onUpdateSubtitleSettings({ selectedTrackId: trackId })}
          onUpdateSettings={onUpdateSubtitleSettings}
          onClose={() => setShowSubtitleControls(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" />
              {t.deleteVideo}
            </h3>
            <p className="text-zinc-300 mb-6">
              {t.deleteWarning}
              <br /><br />
              {t.deleteConfirm}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const arePropsEqual = (prevProps: VideoCardProps, nextProps: VideoCardProps) => {
  return (
    prevProps.item.Id === nextProps.item.Id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.isAutoPlay === nextProps.isAutoPlay &&
    prevProps.language === nextProps.language &&
    prevProps.client === nextProps.client &&
    prevProps.subtitleSettings?.enabled === nextProps.subtitleSettings?.enabled &&
    prevProps.subtitleSettings?.selectedTrackId === nextProps.subtitleSettings?.selectedTrackId &&
    prevProps.subtitleTracks?.length === nextProps.subtitleTracks?.length &&
    prevProps.isPreviewMode === nextProps.isPreviewMode &&
    prevProps.isPreviewing === nextProps.isPreviewing
  );
};

const VideoCard = React.memo(VideoCardComponent, arePropsEqual);

export default VideoCard;

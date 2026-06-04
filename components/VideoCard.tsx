
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Play, AlertCircle, Heart, Info, Disc, ChevronsRight, Rewind, FastForward, Zap, Infinity, Trash2 } from 'lucide-react';

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
}

const VideoCard: React.FC<VideoCardProps> = ({ 
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
    language = 'zh'
}) => {
  const t = {
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
      unknownError: '播放出错，请重试'
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
      unknownError: 'Playback error, please try again'
    }
  }[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 播放失败重试相关
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Progress State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Gesture State
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [seekOffset, setSeekOffset] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [isSpeedAdjusting, setIsSpeedAdjusting] = useState(false);
  const hideProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 用户暂停状态
  const [isUserPaused, setIsUserPaused] = useState(false);
  
  // Screen Orientation State
  const [isScreenLandscape, setIsScreenLandscape] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  
  // --- Gesture Refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isLongPress = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedStartRate = useRef(2.0);
  
  // 双击检测
  const lastTapTime = useRef<number>(0);

  // 进度条区域双击检测
  const progressTapCount = useRef(0);
  const progressTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自动隐藏进度条
  const resetHideTimer = () => {
    if (hideProgressTimerRef.current) {
      clearTimeout(hideProgressTimerRef.current);
    }
    hideProgressTimerRef.current = setTimeout(() => {
      setShowProgress(false);
    }, 5000);
  };

  // 显示进度条并重置隐藏定时器
  const showProgressAndResetTimer = () => {
    setShowProgress(true);
    resetHideTimer();
  };
  
  // 红心动效状态管理
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; rotate: number; scale: number }[]>([]);
  
  const addHeart = useCallback((x: number, y: number) => {
      const id = Date.now();
      const rotate = (Math.random() - 0.5) * 40;
      const scale = 0.8 + Math.random() * 0.6;
      setHearts(prev => [...prev, { id, x, y, rotate, scale }]);
      
      setTimeout(() => {
          setHearts(prev => prev.filter(h => h.id !== id));
      }, 1000);
  }, []);

  // 记忆播放进度相关
  const saveProgressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STORAGE_KEY_PREFIX = 'embystok_progress_';
  
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
          // 静默失败
      }
  }, [item.Id]);

  const loadProgress = useCallback(() => {
      if (!item.Id) return 0;
      try {
          const saved = localStorage.getItem(STORAGE_KEY_PREFIX + item.Id);
          if (saved) {
              const progress = JSON.parse(saved);
              // 只保留最近7天的进度
              if (Date.now() - progress.timestamp < 7 * 24 * 60 * 60 * 1000) {
                  return progress.time;
              }
          }
      } catch (e) {
          // 静默失败
      }
      return 0;
  }, [item.Id]);

  const videoSrc = client.getVideoUrl(item);
  const posterSrc = item.ImageTags?.Primary 
    ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary') 
    : undefined;
    
  const isContentLandscape = (item.Width || 0) > (item.Height || 0);

  useEffect(() => {
      const handleResize = () => {
          setIsScreenLandscape(window.innerWidth > window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化自动隐藏
  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideProgressTimerRef.current) clearTimeout(hideProgressTimerRef.current);
    };
  }, []);

  // 播放进度保存
  useEffect(() => {
    if (isActive && isPlaying) {
      // 每5秒保存一次进度
      saveProgressIntervalRef.current = setInterval(() => {
        saveProgress();
      }, 5000);
    } else if (saveProgressIntervalRef.current) {
      // 停止播放时立即保存一次
      saveProgress();
      clearInterval(saveProgressIntervalRef.current);
      saveProgressIntervalRef.current = null;
    }
    
    return () => {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      saveProgress(); // 组件卸载时保存进度
    };
  }, [isActive, isPlaying, saveProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = isMuted;

    if (isActive) {
      setError(null);
      video.playbackRate = 1.0;
      setPlaybackRate(1.0);
      setIsUserPaused(false); // 重置用户暂停状态
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
              // Only set playing state, hasStarted is set in onPlaying event for smoother visual transition
              setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Autoplay failed", err);
            setIsPlaying(false);
          });
      }
      
      // CRITICAL FIX: preventScroll: true prevents the browser from jumping the scroll position
      containerRef.current?.focus({ preventScroll: true });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setHasStarted(false);
      setIsUserPaused(false); // 重置用户暂停状态
    }
  }, [isActive, isMuted]);

  const togglePlay = () => {
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
  };

  const handlePlaying = () => {
      setIsPlaying(true);
      setHasStarted(true); 
      setIsLoading(false);
  };

  const handleWaiting = () => {
      setIsLoading(true);
  };

  const handleCanPlay = () => {
      setIsLoading(false);
      setRetryCount(0); // 成功播放，重置重试计数
      if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
      }
  };

  const handleTimeUpdate = () => {
      if (videoRef.current && !isSeeking) {
          setCurrentTime(videoRef.current.currentTime);
      }
  };

  const handleLoadedMetadata = () => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
          // 恢复播放进度
          const savedTime = loadProgress();
          if (savedTime > 0 && savedTime < videoRef.current.duration - 10) {
              videoRef.current.currentTime = savedTime;
          }
      }
  };

  const handleVideoEnded = () => {
      // 视频结束时清除保存的进度
      if (item.Id) {
          try {
              localStorage.removeItem(STORAGE_KEY_PREFIX + item.Id);
          } catch (e) {}
      }
      if (isAutoPlay) {
          onVideoEnd();
      }
  };

  // --- Button Handlers with Robust Touch Support ---
  
  const handleButtonAction = (e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent, action: () => void) => {
      e.stopPropagation();
      if (e.type === 'touchend') {
          e.preventDefault(); 
      }
      action();
  };

  const stopProp = (e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  };

  // --- Seek Bar Handlers ---
  const handleSeekStart = (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      setIsSeeking(true);
  };

  const handleSeekMove = (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      if (!isSeeking || !containerRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, clientX / rect.width));
      setCurrentTime(percent * duration);
  };

  // 进度条区域手势处理
  const handleProgressTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
      
      // 显示进度条并重置定时器
      showProgressAndResetTimer();
      
      // 检测双击
      progressTapCount.current += 1;
      if (progressTapTimer.current) clearTimeout(progressTapTimer.current);
      
      progressTapTimer.current = setTimeout(() => {
          progressTapCount.current = 0;
      }, 300);
      
      if (progressTapCount.current === 2) {
          // 双击：切换显示/隐藏
          setShowProgress(!showProgress);
          progressTapCount.current = 0;
          return;
      }
      
      // 长按检测
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      speedStartRate.current = playbackRate;
      
      longPressTimer.current = setTimeout(() => {
          setIsSpeedAdjusting(true);
          setPlaybackRate(2.0);
          if (videoRef.current) videoRef.current.playbackRate = 2.0;
      }, 500);
  };

  const handleProgressTouchMove = (e: React.TouchEvent) => {
      e.stopPropagation();
      
      // 显示进度条并重置定时器
      showProgressAndResetTimer();
      
      if (longPressTimer.current && Math.abs(e.touches[0].clientY - touchStartY.current) > 20) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      
      if (isSpeedAdjusting) {
          const deltaY = e.touches[0].clientY - touchStartY.current;
          // 上下滑动调整速度：向上滑动提高速度，向下滑动降低速度
          let newRate = speedStartRate.current + (-deltaY / 100) * 4.5;
          // 限制在 0.5 - 5.0 范围内
          newRate = Math.max(0.5, Math.min(5.0, newRate));
          setPlaybackRate(newRate);
          if (videoRef.current) videoRef.current.playbackRate = newRate;
      } else {
          // 普通拖动调整进度
          handleSeekMove(e);
      }
  };

  const handleProgressTouchEnd = (e: React.TouchEvent) => {
      e.stopPropagation();
      
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      
      if (isSpeedAdjusting) {
          setIsSpeedAdjusting(false);
      } else {
          handleSeekEnd(e);
      }
  };

  const handleSeekEnd = (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      if (!isSeeking) return;
      
      setIsSeeking(false);
      if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
      }
  };

  // --- Gesture Handlers ---

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
      isLongPress.current = false;
      setSeekOffset(null);

      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          setPlaybackRate(2.0);
          if (videoRef.current) videoRef.current.playbackRate = 2.0;
      }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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

      if (!isLongPress.current && Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
           isDragging.current = true;
           const offset = Math.round(deltaX / 5); 
           setSeekOffset(offset);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

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
      } else {
          if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
              // 检测双击
              const currentTime = Date.now();
              const tapInterval = currentTime - lastTapTime.current;
              
              if (tapInterval < 300 && tapInterval > 0) {
                  // 双击，获取触摸坐标并显示红心动效
                  const touchX = e.changedTouches[0].clientX;
                  const touchY = e.changedTouches[0].clientY;
                  
                  // 添加多个红心，更有视觉冲击力
                  addHeart(touchX, touchY);
                  addHeart(touchX - 30, touchY - 20);
                  addHeart(touchX + 30, touchY + 20);
                  
                  // 只有在无红心的情况下才触发红心
                  if (!isFavorite) {
                      onToggleFavorite();
                  }
              } else {
                  // 单击，延迟判断，避免与双击冲突
                  setTimeout(() => {
                      const newTapTime = Date.now();
                      const newTapInterval = newTapTime - lastTapTime.current;
                      // 如果在300ms内没有新的点击，则认为是单击
                      if (newTapInterval >= 300) {
                          togglePlay();
                      }
                  }, 310);
              }
              
              lastTapTime.current = currentTime;
          }
      }
  };

  const formatTimeText = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 10000000 / 60);
    return `${minutes} 分钟`;
  };

  const formatSecondsToTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const showBlurBackground = isScreenLandscape && !isContentLandscape;
  
  const videoObjectFitClass = (isScreenLandscape || isContentLandscape) 
      ? 'object-contain' 
      : 'object-cover';

  // Only show progress bar for videos longer than 3 minutes, AND when NOT in AutoPlay mode
  const showProgressBar = duration > 180 && !isAutoPlay && showProgress;

  // Render UI elements only if NOT in AutoPlay (Pure) Mode
  const renderUI = !isAutoPlay;

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
      {/* Blurred Background Layer for Vertical Videos in Landscape Mode */}
      {showBlurBackground && posterSrc && (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
               <img 
                  src={posterSrc} 
                  alt="" 
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-110" 
               />
               <div className="absolute inset-0 bg-black/30"></div>
          </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full pointer-events-none relative z-10 bg-transparent ${videoObjectFitClass}`}
        src={videoSrc}
        loop={!isAutoPlay}
        playsInline
        muted={isMuted}
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
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

      {/* Manual Poster Overlay */}
      {posterSrc && !hasStarted && (
        <img 
            src={posterSrc}
            className={`absolute inset-0 w-full h-full z-10 bg-transparent pointer-events-none ${videoObjectFitClass}`}
            alt=""
        />
      )}

      {/* Loading Indicator */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay Icon */}
      {!isPlaying && !error && !seekOffset && !isLongPress.current && isUserPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-20">
          <Play className="w-16 h-16 text-white/50 fill-white/50" />
        </div>
      )}

      {/* 红心动效 */}
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

      {/* Speed Indicator (Clickable) */}
      {playbackRate !== 1.0 && (
          <div 
            className="absolute top-24 left-0 right-0 flex justify-center z-50 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeedMenu(!showSpeedMenu);
            }}
          >
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold text-sm">{playbackRate}x</span>
            </div>
          </div>
      )}

      {/* Speed Selection Menu */}
      {showSpeedMenu && (
          <div 
            className="absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md rounded-2xl p-2 min-w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaybackRate(speed);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = speed;
                  }
                  setShowSpeedMenu(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-white text-sm transition-colors ${
                  playbackRate === speed ? 'bg-indigo-600' : 'hover:bg-white/20'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
      )}

      {/* Seek Overlay */}
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
      
      {/* Toast Notification Removed from here to prevent duplicate alerts */}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-center mb-4">{error}</p>
          {retryCount < MAX_RETRIES && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // 重试播放
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
      
      {/* Auto Play Toggle Button (Always Visible) */}
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

      {/* RIGHT SIDEBAR ACTION BAR (Conditional) */}
      {renderUI && (
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-30 pointer-events-auto">
              <div className="relative w-12 h-12 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                      {posterSrc ? (
                          <img src={posterSrc} alt="Poster" className="w-full h-full object-cover" />
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
                    onTouchEnd={(e) => handleButtonAction(e, () => setShowSpeedMenu(!showSpeedMenu))}
                    onClick={(e) => handleButtonAction(e, () => setShowSpeedMenu(!showSpeedMenu))}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                      <ChevronsRight className="w-7 h-7 text-white drop-shadow-md" />
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
                        <img src={posterSrc} className="w-full h-full object-cover opacity-70" />
                    ) : (
                        <Disc className="w-6 h-6 text-zinc-500" />
                    )}
              </div>
          </div>
      )}

      {/* BOTTOM INFO (Conditional) */}
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

      {/* Speed Adjustment Indicator */}
      {isSpeedAdjusting && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-2 animate-in fade-in zoom-in">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold">{playbackRate.toFixed(1)}x</span>
              </div>
          </div>
      )}

      {/* Progress Bar (Conditional) */}
      {showProgressBar && duration > 0 && (
          <div 
            className="absolute bottom-8 left-4 right-4 h-12 flex items-center gap-3 z-50"
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
            onClick={(e) => {
                e.stopPropagation();
                showProgressAndResetTimer();
            }} 
          >
              {/* Current Time */}
              <span className="text-white text-xs font-medium drop-shadow-md w-10 text-right pointer-events-none">
                {formatSecondsToTime(currentTime)}
              </span>

              {/* Progress Bar Container */}
              <div className="flex-1 relative h-12 flex items-center pointer-events-auto">
                  <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
                      <div 
                          className="h-full bg-indigo-500 transition-all duration-75"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                  </div>
                  <div 
                      className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
              </div>

              {/* Total Time */}
              <span className="text-white text-xs font-medium drop-shadow-md w-10 pointer-events-none">
                {formatSecondsToTime(duration)}
              </span>
          </div>
      )}

      {/* 删除确认对话框 */}
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

export default VideoCard;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, AlertCircle, Zap, ChevronsRight, Rewind, FastForward, Loader, RefreshCw, ChevronDown } from 'lucide-react';

// 预加载时间阈值（秒），播放完毕前多少秒开始预加载下一集
const PRELOAD_AHEAD_SECONDS = 5;
// 过渡动画时长（毫秒）
const TRANSITION_DURATION = 400;
// 默认最大重试次数
const DEFAULT_MAX_RETRIES = 3;
// 默认基础重试延迟（毫秒）
const DEFAULT_BASE_DELAY = 2000;

/**
 * 计算指数退避延迟时间
 */
const calculateBackoffDelay = (retryCount: number, baseDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  const jitter = exponentialDelay * 0.1 * Math.random();
  return Math.min(exponentialDelay + jitter, 15000);
};

interface SeamlessVideoPlayerProps {
  videoSrc: string;
  /** 备用视频源列表 */
  backupSources?: string[];
  nextVideoSrc?: string;
  posterSrc?: string;
  isMuted: boolean;
  isAutoPlay: boolean;
  playbackRate: number;
  videoObjectFitClass: string;
  isBuffering?: boolean;
  bufferedPercent?: number;
  onLoadStart: () => void;
  onCanPlay: () => void;
  onPlaying: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onVideoEnded: () => void;
  onError: (error: string) => void;
  onWaiting?: () => void;
  /** 预加载视频的Blob URL */
  preloadedNextUrl?: string | null;
  /** 是否正在使用预加载视频 */
  isUsingPreloaded?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 启用错误恢复 */
  enableErrorRecovery?: boolean;
}

const SeamlessVideoPlayer: React.FC<SeamlessVideoPlayerProps> = ({
  videoSrc,
  backupSources = [],
  nextVideoSrc,
  posterSrc,
  isMuted,
  isAutoPlay,
  playbackRate,
  videoObjectFitClass,
  isBuffering = false,
  bufferedPercent = 0,
  onLoadStart,
  onCanPlay,
  onPlaying,
  onTimeUpdate,
  onLoadedMetadata,
  onVideoEnded,
  onError,
  onWaiting,
  preloadedNextUrl,
  isUsingPreloaded = false,
  maxRetries = DEFAULT_MAX_RETRIES,
  enableErrorRecovery = true
}) => {
  // 当前视频和下一个视频的ref
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  
  // 过渡动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [nextOpacity, setNextOpacity] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekOffset, setSeekOffset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 用于标识当前激活的视频（'current' | 'next'）
  const activeVideoRef = useRef<'current' | 'next'>('current');
  
  // 定时器引用
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadTimerRef = useRef<number | null>(null);
  const hideProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 错误恢复相关状态
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  // 有效视频源列表（主源 + 备用源）
  const allSources = [videoSrc, ...backupSources];
  const currentSource = allSources[currentSourceIndex] || videoSrc;
  const hasBackupSources = backupSources.length > 0;
  const canTryNextSource = currentSourceIndex < allSources.length - 1;

  // 获取当前激活的视频元素
  const getActiveVideo = useCallback(() => {
    return activeVideoRef.current === 'current' ? currentVideoRef.current : nextVideoRef.current;
  }, []);

  // 重试延迟定时器引用
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 清除重试定时器
   */
  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  /**
   * 执行自动重试
   */
  const performRetry = useCallback(() => {
    clearRetryTimer();
    
    if (!enableErrorRecovery || retryCount >= maxRetries) {
      // 达到最大重试次数，不再重试
      return;
    }

    const video = currentVideoRef.current;
    if (!video) return;

    const nextRetryCount = retryCount + 1;
    setRetryCount(nextRetryCount);
    setIsRetrying(true);
    setError(null);

    // 计算延迟时间
    const delay = calculateBackoffDelay(nextRetryCount - 1, DEFAULT_BASE_DELAY);

    retryTimerRef.current = setTimeout(() => {
      if (currentVideoRef.current) {
        // 重新加载视频
        currentVideoRef.current.load();
      }
      setIsRetrying(false);
    }, delay);
  }, [enableErrorRecovery, retryCount, maxRetries, clearRetryTimer]);

  /**
   * 手动重试（从当前源重新加载）
   */
  const handleManualRetry = useCallback(() => {
    clearRetryTimer();
    setRetryCount(0);
    setIsRetrying(false);
    setError(null);
    
    if (currentVideoRef.current) {
      currentVideoRef.current.load();
    }
  }, [clearRetryTimer]);

  /**
   * 切换到下一个备用源
   */
  const handleSwitchSource = useCallback(() => {
    clearRetryTimer();
    setRetryCount(0);
    setIsRetrying(false);
    setShowSourceMenu(false);
    
    if (canTryNextSource) {
      const nextIndex = currentSourceIndex + 1;
      setCurrentSourceIndex(nextIndex);
      setError(null);
    }
  }, [canTryNextSource, currentSourceIndex, clearRetryTimer]);

  // 处理视频时间更新，检测是否接近播放结束
  useEffect(() => {
    const video = currentVideoRef.current;
    if (!video || !isAutoPlay || !nextVideoSrc) return;

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const remainingTime = video.duration - video.currentTime;
        onTimeUpdate(video.currentTime, video.duration);
        
        // 如果剩余时间小于阈值且还没有开始过渡
        if (remainingTime <= PRELOAD_AHEAD_SECONDS && remainingTime > 0 && !isTransitioning) {
          // 停止当前定时器
          if (preloadTimerRef.current) {
            clearTimeout(preloadTimerRef.current);
            preloadTimerRef.current = null;
          }
          
          // 开始预加载下一个视频（如果还没有预加载）
          if (nextVideoSrc && nextVideoRef.current) {
            // 预加载下一个视频
            if (!nextVideoRef.current.src || nextVideoRef.current.src === '') {
              nextVideoRef.current.src = preloadedNextUrl || nextVideoSrc;
            }
          }
        }
        
        // 如果剩余时间小于等于1秒，开始过渡
        if (remainingTime <= 1 && remainingTime > 0 && !isTransitioning) {
          startTransition();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isAutoPlay, nextVideoSrc, isTransitioning, preloadedNextUrl, onTimeUpdate]);

  // 开始过渡动画
  const startTransition = useCallback(() => {
    if (isTransitioning || !nextVideoSrc) return;
    
    setIsTransitioning(true);
    
    // 1. 切换 refs
    activeVideoRef.current = 'next';
    
    // 2. 开始过渡动画 - 当前视频淡出，下一个视频淡入
    setCurrentOpacity(0);
    setNextOpacity(1);
    
    // 3. 播放下一个视频
    if (nextVideoRef.current) {
      nextVideoRef.current.play().catch(() => {});
    }
    
    // 过渡完成后清理
    transitionTimerRef.current = setTimeout(() => {
      // 停止当前视频
      if (currentVideoRef.current) {
        currentVideoRef.current.pause();
        currentVideoRef.current.src = '';
        currentVideoRef.current.load();
      }
      
      setIsTransitioning(false);
      setCurrentOpacity(1);
      setNextOpacity(0);
      
      // 触发视频结束回调
      onVideoEnded();
    }, TRANSITION_DURATION);
  }, [isTransitioning, nextVideoSrc, onVideoEnded]);

  // 监听当前视频播放状态
  useEffect(() => {
    const video = currentVideoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => onWaiting?.();
    const handleCanPlay = () => {
      onCanPlay();
      setDuration(video.duration);
    };
    const handleLoadedMetadata = () => {
      onLoadedMetadata(video.duration);
      setDuration(video.duration);
    };
    const handleError = () => {
      const errorMsg = '视频加载失败';
      setError(errorMsg);
      onError(errorMsg);
      
      // 如果启用错误恢复且还有重试机会，则自动重试
      if (enableErrorRecovery && retryCount < maxRetries) {
        performRetry();
      }
    };
    const handleEnded = () => {
      if (isAutoPlay && !isTransitioning) {
        if (nextVideoSrc) {
          startTransition();
        } else {
          onVideoEnded();
        }
      } else {
        onVideoEnded();
      }
    };

    video.addEventListener('playing', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isAutoPlay, nextVideoSrc, isTransitioning, onCanPlay, onLoadedMetadata, onError, onVideoEnded, onWaiting, startTransition, enableErrorRecovery, retryCount, maxRetries, performRetry]);

  // 监听播放速率变化
  useEffect(() => {
    const video = getActiveVideo();
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate, getActiveVideo]);

  // 监听静音状态变化
  useEffect(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.muted = isMuted;
    }
    if (nextVideoRef.current) {
      nextVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 视频源变化时重置过渡状态
  useEffect(() => {
    // 当 videoSrc 或 currentSourceIndex 变化时，说明视频已经切换，需要重置状态
    setIsTransitioning(false);
    setCurrentOpacity(1);
    setNextOpacity(0);
    setError(null);
    setHasStarted(false);
    activeVideoRef.current = 'current';
    // 重置重试计数（仅当视频源真正改变时）
    if (currentSourceIndex === 0) {
      setRetryCount(0);
    }
    
    // 清理过渡定时器
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    
    // 重置 nextVideoRef 的 src（为下一次预加载做准备）
    if (nextVideoRef.current) {
      nextVideoRef.current.pause();
      nextVideoRef.current.src = '';
      nextVideoRef.current.load();
    }
  }, [videoSrc, currentSourceIndex]);

  // 监听 currentSourceIndex 变化，切换视频源
  useEffect(() => {
    if (currentVideoRef.current && currentSource !== currentVideoRef.current.src) {
      currentVideoRef.current.src = currentSource;
      currentVideoRef.current.load();
    }
  }, [currentSource]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
      if (hideProgressTimerRef.current) {
        clearTimeout(hideProgressTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // 格式化时间显示
  const formatSecondsToTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <>
      {/* 当前视频层 */}
      <video
        ref={currentVideoRef}
        className={`w-full h-full pointer-events-none relative z-10 bg-transparent ${videoObjectFitClass}`}
        src={currentSource}
        poster={posterSrc}
        loop={!isAutoPlay && !nextVideoSrc}
        playsInline
        muted={isMuted}
        preload="metadata"
        onLoadStart={onLoadStart}
        style={{
          opacity: currentOpacity,
          transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`
        }}
      />

      {/* 下一个视频层（预加载） */}
      <video
        ref={nextVideoRef}
        className={`w-full h-full pointer-events-none absolute inset-0 z-20 bg-transparent ${videoObjectFitClass}`}
        src={preloadedNextUrl || nextVideoSrc || ''}
        loop={false}
        playsInline
        muted={isMuted}
        preload="auto"
        style={{ 
          opacity: nextOpacity,
          transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`
        }}
      />

      {/* 海报层（当前视频未开始时显示） */}
      {posterSrc && !hasStarted && (
        <img
          src={posterSrc}
          className={`absolute inset-0 w-full h-full z-10 bg-transparent pointer-events-none ${videoObjectFitClass}`}
          alt=""
          loading="lazy"
        />
      )}

      {/* 播放按钮覆盖层 */}
      {!isPlaying && !error && seekOffset === null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-30">
          <Play className="w-16 h-16 text-white/50 fill-white/50" />
        </div>
      )}

      {/* 倍速显示 */}
      {playbackRate > 1.0 && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-sm">{playbackRate}x</span>
            <ChevronsRight className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* 缓冲指示器 */}
      {isBuffering && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-3 rounded-full">
            <Loader className="w-6 h-6 text-white animate-spin" />
            <span className="text-white text-xs">Buffering...</span>
          </div>
        </div>
      )}

      {/* 重试指示器 */}
      {isRetrying && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <Loader className="w-4 h-4 text-yellow-400 animate-spin" />
            <span className="text-white text-xs">正在重试 ({retryCount}/{maxRetries})...</span>
          </div>
        </div>
      )}

      {/* 跳转指示器 */}
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

      {/* 错误显示 - 增强版 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm text-white p-4 z-40">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-center text-lg font-medium mb-1">{error}</p>
          
          {retryCount > 0 && retryCount < maxRetries && (
            <p className="text-white/60 text-sm mb-4">
              将在片刻后自动重试...
            </p>
          )}
          
          {retryCount >= maxRetries && (
            <p className="text-white/60 text-sm mb-4">
              自动重试次数已用完
            </p>
          )}
          
          {/* 操作按钮 */}
          <div className="flex flex-col gap-2 items-center mt-2">
            <button
              onClick={handleManualRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">重试播放</span>
            </button>
            
            {/* 备用源切换按钮 */}
            {hasBackupSources && (
              <div className="relative">
                <button
                  onClick={() => setShowSourceMenu(!showSourceMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <span className="text-sm">切换视频源</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSourceMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* 源选择菜单 */}
                {showSourceMenu && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px]">
                    <div className="px-3 py-2 text-xs text-white/50 border-b border-white/10">
                      选择视频源
                    </div>
                    {allSources.map((source, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentSourceIndex(index);
                          setShowSourceMenu(false);
                          setRetryCount(0);
                          setError(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                          index === currentSourceIndex ? 'text-yellow-400' : 'text-white'
                        }`}
                      >
                        {index === 0 ? '主视频源' : `备用源 ${index}`}
                        {index === currentSourceIndex && ' (当前)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

SeamlessVideoPlayer.displayName = 'SeamlessVideoPlayer';

export default SeamlessVideoPlayer;
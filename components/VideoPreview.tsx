import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, X } from 'lucide-react';

export interface VideoPreviewProps {
  /** 视频URL */
  videoUrl: string;
  /** 海报图片URL */
  posterUrl?: string;
  /** 是否激活播放 */
  isActive: boolean;
  /** 预览结束时回调 */
  onPreviewEnd?: () => void;
  /** 预览被点击时的回调 */
  onPreviewClick?: () => void;
  /** 预览时长（毫秒），默认3000ms */
  previewDuration?: number;
  /** 自定义类名 */
  className?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  posterUrl,
  isActive,
  onPreviewEnd,
  onPreviewClick,
  previewDuration = 3000,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeBtnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清除定时器
  const clearTimers = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (closeBtnTimerRef.current) {
      clearTimeout(closeBtnTimerRef.current);
      closeBtnTimerRef.current = null;
    }
  }, []);

  // 停止播放
  const stopPlayback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(true);
    clearTimers();
  }, [clearTimers]);

  // 处理视频结束
  const handleEnded = useCallback(() => {
    stopPlayback();
    onPreviewEnd?.();
  }, [stopPlayback, onPreviewEnd]);

  // 处理视频加载完成
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    if (videoRef.current && isActive) {
      videoRef.current.play().catch(() => {});
    }
  }, [isActive]);

  // 开始播放
  const startPlayback = useCallback(() => {
    if (!videoRef.current || !videoUrl) return;

    setIsLoading(true);
    setIsPlaying(true);

    // 设置静音播放
    videoRef.current.muted = true;
    videoRef.current.currentTime = 0;

    // 尝试播放
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          // 设置预览时长
          clearTimers();
          previewTimerRef.current = setTimeout(() => {
            stopPlayback();
            onPreviewEnd?.();
          }, previewDuration);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  }, [videoUrl, previewDuration, clearTimers, stopPlayback, onPreviewEnd]);

  // 激活状态变化时开始/停止预览
  useEffect(() => {
    if (isActive && videoUrl) {
      startPlayback();
      // 显示关闭按钮延迟
      closeBtnTimerRef.current = setTimeout(() => {
        setShowCloseBtn(true);
      }, 500);
    } else {
      stopPlayback();
      setShowCloseBtn(false);
    }

    return () => {
      clearTimers();
      setShowCloseBtn(false);
    };
  }, [isActive, videoUrl, startPlayback, stopPlayback, clearTimers]);

  // 组件卸载时停止
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    stopPlayback();
    onPreviewEnd?.();
  }, [stopPlayback, onPreviewEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPreviewClick?.();
  }, [onPreviewClick]);

  return (
    <div
      ref={containerRef}
      className={`
        absolute bottom-2 right-2 z-30
        w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36
        rounded-lg overflow-hidden
        bg-black/80 backdrop-blur-sm
        border border-white/20
        shadow-xl
        transition-all duration-200
        ${isPlaying ? 'ring-2 ring-white/40' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        muted
        playsInline
        loop={false}
        preload="metadata"
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={() => setIsLoading(false)}
      />

      {/* 海报图片（加载中或视频未播放时显示） */}
      {posterUrl && !isPlaying && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 加载指示器 */}
      {isLoading && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}

      {/* 播放指示器 */}
      {isPlaying && !isLoading && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-white/90 font-medium">预览</span>
        </div>
      )}

      {/* 关闭按钮 */}
      {showCloseBtn && isPlaying && (
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <X className="w-3 h-3 text-white/90" />
        </button>
      )}

      {/* 预览图标（未播放时） */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      )}

      {/* 底部渐变 */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default React.memo(VideoPreview);

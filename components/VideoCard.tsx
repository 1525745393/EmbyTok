import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EmbyItem, ServerConfig } from '../types';
import { getVideoUrl, getImageUrl } from '../services/embyService';
import { Play, AlertCircle, Heart, Info, Disc } from 'lucide-react';

interface VideoCardProps {
  item: EmbyItem;
  config: ServerConfig;
  isActive: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
    item, 
    config, 
    isActive, 
    isFavorite, 
    onToggleFavorite,
    isMuted,
    onToggleMute
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFastSpeed, setIsFastSpeed] = useState(false);
  
  // 触摸滑动相关状态
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekStart, setSeekStart] = useState({ x: 0, time: 0 });
  const [seekPreview, setSeekPreview] = useState<number | null>(null);

  const videoSrc = getVideoUrl(config.url, item.Id, config.token);
  const posterSrc = item.ImageTags?.Primary 
    ? getImageUrl(config.url, item.Id, item.ImageTags.Primary, 'Primary') 
    : undefined;

  // 检查视频时长是否超过3分钟 (180秒)
  const isLongVideo = item.RunTimeTicks ? (item.RunTimeTicks / 10000000) > 180 : false;

  // 更新进度条
  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Sync mute state
    video.muted = isMuted;

    if (isActive) {
      setError(null);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Autoplay failed", err);
            setIsPlaying(false);
            // If failed, likely due to unmuted autoplay policies. Ensure mute is on and try again locally?
            // Since we control isMuted globally, if autoplay fails, it's often user interaction required.
          });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  // 监听时间更新以更新进度条
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.addEventListener('timeupdate', updateProgress);
    
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
    };
  }, [updateProgress]);

  // 处理长按开始
  const handleLongPressStart = () => {
    if (!isActive) return;
    
    // 设置长按定时器（500毫秒）
    longPressTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = 2.0;
        setIsFastSpeed(true);
      }
    }, 500);
  };

  // 处理长按结束
  const handleLongPressEnd = () => {
    // 清除长按定时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // 恢复正常播放速度
    const video = videoRef.current;
    if (video && isFastSpeed) {
      video.playbackRate = 1.0;
      setIsFastSpeed(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleMute();
  };

  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive) return;
    
    // 开始长按检测
    handleLongPressStart();
    
    const video = videoRef.current;
    if (!video) return;
    
    const touch = e.touches[0];
    setSeekStart({
      x: touch.clientX,
      time: video.currentTime
    });
    setIsSeeking(true);
    setSeekPreview(video.currentTime);
  };

  // 处理触摸移动事件
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSeeking || !isActive) return;
    
    // 如果在滑动，则取消长按
    handleLongPressEnd();
    
    const video = videoRef.current;
    if (!video) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - seekStart.x;
    const containerWidth = video.clientWidth;
    
    // 计算预览时间（限制在视频长度范围内）
    const percentDelta = (deltaX / containerWidth) * 2; // 增加灵敏度
    const newTime = Math.max(0, Math.min(video.duration, seekStart.time + (percentDelta * video.duration)));
    
    setSeekPreview(newTime);
    
    // 阻止默认滚动行为
    e.preventDefault();
  };

  // 处理触摸结束事件
  const handleTouchEnd = () => {
    // 结束长按检测
    handleLongPressEnd();
    
    if (!isSeeking || !isActive) return;
    
    const video = videoRef.current;
    if (!video || seekPreview === null) return;
    
    // 设置新的播放位置
    video.currentTime = seekPreview;
    setProgress((seekPreview / video.duration) * 100);
    
    setIsSeeking(false);
    setSeekPreview(null);
  };

  const formatTime = (ticks?: number) => {
      if (!ticks) return '';
      const minutes = Math.round(ticks / 10000000 / 60);
      return `${minutes} 分钟`;
  }

  // 格式化时间为 mm:ss
  const formatVideoTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      className="relative w-full h-full bg-black snap-start shrink-0 flex items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()} // 阻止右键菜单
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        poster={posterSrc}
        loop
        playsInline
        muted={isMuted}
        onError={() => setError("无法加载视频")}
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()} // 阻止视频右键菜单
      />

      {/* Play Icon Overlay (only when paused and no error) */}
      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/50 fill-white/50" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-center">{error}</p>
        </div>
      )}

      {/* 进度预览 */}
      {isSeeking && seekPreview !== null && !isFastSpeed && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg z-30">
          <div className="text-center">
            <div className="text-lg font-bold">{formatVideoTime(seekPreview)}</div>
            <div className="text-xs opacity-75">拖拽调整进度</div>
          </div>
        </div>
      )}

      {/* 2倍速播放提示 */}
      {isFastSpeed && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg z-30">
          <div className="text-center">
            <div className="text-lg font-bold">{formatVideoTime(seekPreview !== null ? seekPreview : (videoRef.current?.currentTime || 0))}</div>
            <div className="text-xs opacity-75">x2 倍速播放中</div>
          </div>
        </div>
      )}

      {/* 右上角 2x 标识 */}
      {isFastSpeed && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full z-30 text-sm font-bold">
          2x
        </div>
      )}

      {/* 底部进度条 - 仅对超过3分钟的视频显示 */}
      {isLongVideo && (
        <div className="absolute bottom-20 left-4 right-4 h-1.5 bg-black/30 z-20 rounded-full">
          <div 
            className="h-full bg-red-500 transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* RIGHT SIDEBAR ACTION BAR */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-6 z-20">
          {/* Avatar / Poster Circle */}
          <div className="relative w-12 h-12 mb-2">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                  {posterSrc ? (
                      <img src={posterSrc} alt="Poster" className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-xs">Emby</div>
                  )}
              </div>
          </div>

          {/* Heart / Favorite */}
          <div className="flex flex-col items-center gap-1">
              <button 
                onClick={handleFavorite}
                className="p-2 rounded-full transition-transform active:scale-75"
              >
                  <Heart 
                    className={`w-8 h-8 drop-shadow-md transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white fill-transparent'}`} 
                    strokeWidth={isFavorite ? 0 : 2}
                  />
              </button>
              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
                {isFavorite ? '已赞' : '点赞'}
              </span>
          </div>

          {/* Info / More Details */}
          <div className="flex flex-col items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20"
              >
                  <Info className="w-7 h-7 text-white drop-shadow-md" />
              </button>
              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">信息</span>
          </div>

           {/* Mute / Spinning Disc Toggle */}
           <div 
                onClick={handleMuteToggle}
                className={`mt-4 w-10 h-10 rounded-full bg-zinc-900 border-4 cursor-pointer transition-colors duration-300 flex items-center justify-center overflow-hidden ${isMuted ? 'border-red-500/80' : 'border-zinc-800'} ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
           >
                {posterSrc ? (
                    <img src={posterSrc} className="w-full h-full object-cover opacity-70" />
                ) : (
                    <Disc className="w-6 h-6 text-zinc-500" />
                )}
           </div>
      </div>

      {/* BOTTOM TEXT OVERLAY */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-300 ${showInfo ? 'h-2/3 from-black/95' : 'pt-24'}`}>
        <div className="flex flex-col items-start max-w-[80%]">
            <h3 className="text-white font-bold text-lg drop-shadow-md mb-2 leading-tight">
              {item.Name}
            </h3>
            
            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-white/90 mb-2 font-medium drop-shadow-md">
               {item.ProductionYear && <span className="bg-white/20 px-1.5 py-0.5 rounded">{item.ProductionYear}</span>}
               <span>{formatTime(item.RunTimeTicks)}</span>
               <span className="uppercase border border-white/30 px-1 rounded text-[10px]">{item.MediaType || '视频'}</span>
            </div>

            {/* Description - Expandable */}
            <div 
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className={`text-white/80 text-sm drop-shadow-md transition-all duration-300 cursor-pointer ${showInfo ? 'line-clamp-none overflow-y-auto max-h-[40vh]' : 'line-clamp-2'}`}
            >
                {item.Overview || '暂无简介'}
            </div>
            
            {!showInfo && item.Overview && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="text-white/60 text-xs font-semibold mt-1"
                >
                    更多
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
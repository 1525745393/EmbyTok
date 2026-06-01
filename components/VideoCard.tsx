import React, { useState, useCallback, useMemo } from 'react';
import { EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Translations } from '../src/locales';
import { useDeviceDetection, useVideoControls, useGestureControls } from '../src/hooks';
import HeartAnimation from './HeartAnimation';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import VideoInfo from './VideoInfo';

type VideoCardTranslations = Translations['videoCard'];

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
  onVideoLoadStart?: () => void;
  onVideoLoadComplete?: () => void;
  onSwipeDown?: () => void;
  t: VideoCardTranslations;
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
    onVideoLoadStart = () => {},
    onVideoLoadComplete = () => {},
    onSwipeDown,
    t,
    language = 'zh'
}) => {
    const { isLandscape: isScreenLandscape } = useDeviceDetection();
    
    const {
      isPlaying,
      hasStarted,
      currentTime,
      duration,
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
    } = useVideoControls({ isActive, isMuted, isAutoPlay, onVideoEnd, onVideoLoadStart, onVideoLoadComplete });

    const {
      playbackRate,
      seekOffset,
      hearts,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    } = useGestureControls({ 
      togglePlay, 
      onDoubleTap: useCallback(() => {
        if (!isFavorite) {
          onToggleFavorite();
        }
      }, [isFavorite, onToggleFavorite]), 
      onSwipeDown,
      videoRef 
    });

    const [showInfo, setShowInfo] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const videoSrc = useMemo(() => client.getVideoUrl(item), [client, item]);
    const posterSrc = useMemo(() => item.ImageTags?.Primary 
      ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary') 
      : undefined, [client, item]);
    
    const isContentLandscape = useMemo(() => (item.Width || 0) > (item.Height || 0), [item]);

    const showBlurBackground = useMemo(() => isScreenLandscape && !isContentLandscape, [isScreenLandscape, isContentLandscape]);
    
    const videoObjectFitClass = useMemo(() => (isScreenLandscape || isContentLandscape) 
      ? 'object-contain' 
      : 'object-cover', [isScreenLandscape, isContentLandscape]);

    const showProgressBar = useMemo(() => duration > 180 && !isAutoPlay, [duration, isAutoPlay]);
    const renderUI = useMemo(() => !isAutoPlay, [isAutoPlay]);

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
    }, [togglePlay, onToggleMute, onToggleFavorite, videoRef]);

    const handleDeleteClick = useCallback(() => setShowDeleteConfirm(true), []);
    const handleDeleteCancel = useCallback(() => setShowDeleteConfirm(false), []);
    const handleDeleteConfirm = useCallback(() => {
        onDelete();
        setShowDeleteConfirm(false);
    }, [onDelete]);
    const toggleInfo = useCallback(() => setShowInfo(prev => !prev), []);

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
                />
                 <div className="absolute inset-0 bg-black/30"></div>
            </div>
        )}

        <VideoPlayer
          videoRef={videoRef}
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          isMuted={isMuted}
          isPlaying={isPlaying}
          hasStarted={hasStarted}
          isUserPaused={isUserPaused}
          error={error}
          playbackRate={playbackRate}
          seekOffset={seekOffset}
          isAutoPlay={isAutoPlay}
          videoObjectFitClass={videoObjectFitClass}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVideoEnded={handleVideoEnded}
          onError={useCallback(() => setError(t.videoLoadError), [setError, t.videoLoadError])}
        />

        <HeartAnimation hearts={hearts} />

        <VideoControls
          posterSrc={posterSrc}
          isFavorite={isFavorite}
          isMuted={isMuted}
          isPlaying={isPlaying}
          isAutoPlay={isAutoPlay}
          renderUI={renderUI}
          t={t}
          onToggleFavorite={onToggleFavorite}
          onToggleInfo={toggleInfo}
          onDeleteClick={handleDeleteClick}
          onToggleMute={onToggleMute}
          onToggleAutoPlay={onToggleAutoPlay}
        />

        <VideoInfo
          item={item}
          showInfo={showInfo}
          renderUI={renderUI}
          isPlaying={isPlaying}
          t={t}
          onToggleInfo={toggleInfo}
        />

        {showProgressBar && duration > 0 && (
            <div 
              className="absolute bottom-8 left-4 right-4 h-8 flex items-center z-50 pointer-events-auto touch-none"
              onTouchStart={handleSeekStart}
              onTouchMove={handleSeekMove}
              onTouchEnd={handleSeekEnd}
              onClick={(e) => e.stopPropagation()} 
            >
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-75"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
                 <div 
                    className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-2"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                />
            </div>
        )}

        <DeleteConfirmDialog
          show={showDeleteConfirm}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          t={t}
        />
      </div>
    );
};

export default React.memo(VideoCard);

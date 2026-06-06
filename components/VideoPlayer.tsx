import React from 'react';
import { Play, AlertCircle, Zap, ChevronsRight, Rewind, FastForward } from 'lucide-react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoSrc: string;
  posterSrc?: string;
  isMuted: boolean;
  isPlaying: boolean;
  hasStarted: boolean;
  isUserPaused: boolean;
  error?: string;
  playbackRate: number;
  seekOffset: number | null;
  isAutoPlay: boolean;
  videoObjectFitClass: string;
  onLoadStart: () => void;
  onCanPlay: () => void;
  onPlaying: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onVideoEnded: () => void;
  onError: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(
  ({
    videoRef,
    videoSrc,
    posterSrc,
    isMuted,
    isPlaying,
    hasStarted,
    isUserPaused,
    error,
    playbackRate,
    seekOffset,
    isAutoPlay,
    videoObjectFitClass,
    onLoadStart,
    onCanPlay,
    onPlaying,
    onTimeUpdate,
    onLoadedMetadata,
    onVideoEnded,
    onError,
  }) => {
    return (
      <>
        <video
          ref={videoRef}
          className={`w-full h-full pointer-events-none relative z-10 bg-transparent ${videoObjectFitClass}`}
          src={videoSrc}
          poster={posterSrc}
          loop={!isAutoPlay}
          playsInline
          muted={isMuted}
          preload="metadata"
          onLoadStart={onLoadStart}
          onCanPlay={onCanPlay}
          onPlaying={onPlaying}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onVideoEnded}
          onError={onError}
        />

        {posterSrc && !hasStarted && (
          <img
            src={posterSrc}
            className={`absolute inset-0 w-full h-full z-10 bg-transparent pointer-events-none ${videoObjectFitClass}`}
            alt=""
            loading="lazy"
          />
        )}

        {!isPlaying && !error && seekOffset === null && playbackRate === 1.0 && isUserPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-20">
            <Play className="w-16 h-16 text-white/50 fill-white/50" />
          </div>
        )}

        {playbackRate > 1.0 && (
          <div className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold text-sm">Double Speed</span>
              <ChevronsRight className="w-4 h-4 text-white" />
            </div>
          </div>
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
                {seekOffset > 0 ? '+' : ''}
                {seekOffset}s
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-center">{error}</p>
          </div>
        )}
      </>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

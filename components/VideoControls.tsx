import React, { useCallback, useMemo } from 'react';
import { Translations } from '../src/locales';
import { Heart, Info, Disc, Infinity, Trash2 } from 'lucide-react';

type VideoControlsTranslations = Translations['videoCard'];

interface VideoControlsProps {
  posterSrc?: string;
  isFavorite: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  isAutoPlay: boolean;
  renderUI: boolean;
  t: VideoControlsTranslations;
  onToggleFavorite: () => void;
  onToggleInfo: () => void;
  onDeleteClick: () => void;
  onToggleMute: () => void;
  onToggleAutoPlay: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = React.memo(
  ({
    posterSrc,
    isFavorite,
    isMuted,
    isPlaying,
    isAutoPlay,
    renderUI,
    t,
    onToggleFavorite,
    onToggleInfo,
    onDeleteClick,
    onToggleMute,
    onToggleAutoPlay,
  }) => {
    const handleButtonAction = useCallback(
      (e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent, action: () => void) => {
        e.stopPropagation();
        if (e.type === 'touchend') {
          e.preventDefault();
        }
        action();
      },
      []
    );

    const stopProp = useCallback((e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
    }, []);

    const autoPlayButtonClass = useMemo(() => {
      return `p-2.5 rounded-full backdrop-blur-sm transition-all active:scale-90 focus:ring-2 focus:ring-green-500 outline-none shadow-lg ${isAutoPlay ? 'bg-green-500/80 text-white' : 'bg-black/30 text-white/50 hover:bg-black/50 hover:text-white'}`;
    }, [isAutoPlay]);

    const heartClass = useMemo(() => {
      return `w-8 h-8 drop-shadow-md transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white fill-transparent'}`;
    }, [isFavorite]);

    const muteButtonClass = useMemo(() => {
      return `mt-4 w-10 h-10 rounded-full bg-zinc-900 border-4 cursor-pointer transition-colors duration-300 flex items-center justify-center overflow-hidden focus:ring-2 focus:ring-indigo-500 outline-none ${isMuted ? 'border-red-500/80' : 'border-zinc-800'} ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`;
    }, [isMuted, isPlaying]);

    return (
      <>
        <div className="absolute bottom-8 right-2 z-40 w-12 flex flex-col items-center justify-center pointer-events-auto">
          <button
            onTouchStart={stopProp}
            onMouseDown={stopProp}
            onTouchEnd={(e) => handleButtonAction(e, onToggleAutoPlay)}
            onClick={(e) => handleButtonAction(e, onToggleAutoPlay)}
            className={autoPlayButtonClass}
          >
            <Infinity className="w-6 h-6" />
          </button>
        </div>

        {renderUI && (
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-30 pointer-events-auto">
            <div className="relative w-12 h-12 mb-2">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                {posterSrc ? (
                  <img
                    src={posterSrc}
                    alt="Poster"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-xs">
                    Media
                  </div>
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
                <Heart className={heartClass} strokeWidth={isFavorite ? 0 : 2} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                tabIndex={0}
                onTouchStart={stopProp}
                onMouseDown={stopProp}
                onTouchEnd={(e) => handleButtonAction(e, onToggleInfo)}
                onClick={(e) => handleButtonAction(e, onToggleInfo)}
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
                onTouchEnd={(e) => handleButtonAction(e, onDeleteClick)}
                onClick={(e) => handleButtonAction(e, onDeleteClick)}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm active:bg-white/20 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <Trash2 className="w-7 h-7 text-red-500 drop-shadow-md" />
              </button>
            </div>

            <div
              tabIndex={0}
              onTouchStart={stopProp}
              onMouseDown={stopProp}
              onTouchEnd={(e) => handleButtonAction(e, onToggleMute)}
              onClick={(e) => handleButtonAction(e, onToggleMute)}
              className={muteButtonClass}
            >
              {posterSrc ? (
                <img
                  src={posterSrc}
                  className="w-full h-full object-cover opacity-70"
                  loading="lazy"
                />
              ) : (
                <Disc className="w-6 h-6 text-zinc-500" />
              )}
            </div>
          </div>
        )}
      </>
    );
  }
);

VideoControls.displayName = 'VideoControls';

export default VideoControls;

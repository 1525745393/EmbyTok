import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { EmbyItem } from '../types';
import { Translations } from '../src/locales';
import { formatTimeText } from '../utils';

type VideoInfoTranslations = Translations['videoCard'];

interface VideoInfoProps {
  item: EmbyItem;
  showInfo: boolean;
  renderUI: boolean;
  isPlaying?: boolean;
  t: VideoInfoTranslations;
  onToggleInfo: () => void;
}

const VideoInfo: React.FC<VideoInfoProps> = React.memo(
  ({ item, showInfo, renderUI, isPlaying = false, t, onToggleInfo }) => {
    const [isVisible, setIsVisible] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetHideTimer = useCallback(() => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      setIsVisible(true);

      if (isPlaying) {
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    }, [isPlaying]);

    const stopProp = useCallback(
      (e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        resetHideTimer();
      },
      [resetHideTimer]
    );

    const handleButtonAction = useCallback(
      (e: React.TouchEvent | React.MouseEvent | React.KeyboardEvent, action: () => void) => {
        e.stopPropagation();
        resetHideTimer();
        if (e.type === 'touchend') {
          e.preventDefault();
        }
        action();
      },
      [resetHideTimer]
    );

    useEffect(() => {
      resetHideTimer();
      return () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
      };
    }, [isPlaying, resetHideTimer]);

    const containerClass = useMemo(() => {
      return `absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-300 pointer-events-auto z-10 ${showInfo ? 'h-2/3 from-black/95' : 'pt-24'} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;
    }, [showInfo, isVisible]);

    const overviewClass = useMemo(() => {
      return `text-white/80 text-sm drop-shadow-md transition-all duration-300 cursor-pointer focus:ring-1 focus:ring-white/50 rounded ${showInfo ? 'line-clamp-none overflow-y-auto max-h-[40vh]' : 'line-clamp-2'}`;
    }, [showInfo]);

    if (!renderUI) return null;

    return (
      <div className={containerClass} onClick={stopProp}>
        <div className="flex flex-col items-start max-w-[80%]">
          <h3 className="text-white font-bold text-lg drop-shadow-md mb-2 leading-tight">
            {item.Name}
          </h3>

          <div className="flex items-center gap-3 text-xs text-white/90 mb-2 font-medium drop-shadow-md">
            {item.ProductionYear && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded">{item.ProductionYear}</span>
            )}
            <span>{formatTimeText(item.RunTimeTicks)}</span>
            <span className="uppercase border border-white/30 px-1 rounded text-[10px]">
              {item.MediaType || t.mediaType}
            </span>
          </div>

          <div
            tabIndex={showInfo ? 0 : -1}
            onTouchStart={stopProp}
            onMouseDown={stopProp}
            onTouchEnd={(e) => handleButtonAction(e, onToggleInfo)}
            onClick={(e) => handleButtonAction(e, onToggleInfo)}
            className={overviewClass}
          >
            {item.Overview || t.noOverview}
          </div>
        </div>
      </div>
    );
  }
);

VideoInfo.displayName = 'VideoInfo';

export default VideoInfo;

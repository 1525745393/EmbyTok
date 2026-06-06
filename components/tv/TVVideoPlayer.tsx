import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EmbyItem } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import {
  Play,
  Pause,
  ChevronLeft,
  Heart,
  Volume2,
  VolumeX,
  Infinity,
  Rewind,
  FastForward,
} from 'lucide-react';

interface TVVideoPlayerProps {
  videos: EmbyItem[];
  initialIndex: number;
  onBack: () => void;
  client: MediaClient;
  libraryName: string;
  language: 'zh' | 'en'; // 补全：新增语言支持
}

const TVVideoPlayer: React.FC<TVVideoPlayerProps> = ({
  videos,
  initialIndex,
  onBack,
  client,
  libraryName,
  language,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentItem = videos[currentIndex];
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posterSrc = currentItem.ImageTags?.Primary
    ? client.getImageUrl(currentItem.Id, currentItem.ImageTags.Primary, 'Primary')
    : null;

  const backdropSrc = currentItem.ImageTags?.Backdrop
    ? client.getImageUrl(currentItem.Id, currentItem.ImageTags.Backdrop, 'Backdrop')
    : posterSrc;

  // 1. 获取初始收藏状态
  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const favs = await client.getFavorites(libraryName);
        setFavoriteIds(favs);
      } catch (e) {}
    };
    fetchFavs();
  }, [client, libraryName]);

  // 2. 视频加载逻辑
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    setIsPlaying(false);
    setIsBuffering(true);
    setShowInfoOverlay(true);
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    }
  }, [currentIndex]);

  const changeVideo = useCallback(
    (offset: number) => {
      const nextIdx = currentIndex + offset;
      if (nextIdx >= 0 && nextIdx < videos.length) {
        setCurrentIndex(nextIdx);
      }
    },
    [currentIndex, videos.length]
  );

  const toggleFavorite = useCallback(async () => {
    const id = currentItem.Id;
    const isFav = favoriteIds.has(id);
    try {
      await client.toggleFavorite(id, isFav, libraryName);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(id);
        else next.add(id);
        return next;
      });
    } catch (e) {}
  }, [currentItem.Id, favoriteIds, client, libraryName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showInfoOverlay) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            changeVideo(-1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            changeVideo(1);
            break;
          case 'ArrowLeft':
            if (videoRef.current) videoRef.current.currentTime -= 15;
            break;
          case 'ArrowRight':
            if (videoRef.current) videoRef.current.currentTime += 15;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            videoRef.current?.pause();
            setShowInfoOverlay(true);
            break;
          case 'Escape':
          case 'Backspace':
            e.preventDefault();
            e.stopImmediatePropagation();
            onBack();
            break;
        }
      } else {
        if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const btns = Array.from(document.querySelectorAll('.player-action-btn')) as HTMLElement[];
          const currIdx = btns.indexOf(document.activeElement as HTMLElement);
          if (e.key === 'ArrowLeft' && currIdx > 0) btns[currIdx - 1].focus();
          if (e.key === 'ArrowRight' && currIdx < btns.length - 1) btns[currIdx + 1].focus();
        }
        if (e.key === 'Enter' || e.key === ' ') {
          if (
            document.activeElement?.id === 'tv-player-play-btn' ||
            document.activeElement?.tagName !== 'BUTTON'
          ) {
            e.preventDefault();
            if (isPlaying) setShowInfoOverlay(false);
            else videoRef.current?.play();
          }
        }
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (isPlaying) setShowInfoOverlay(false);
          else onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInfoOverlay, isPlaying, changeVideo, onBack]);

  useEffect(() => {
    if (showInfoOverlay) {
      setTimeout(() => document.getElementById('tv-player-play-btn')?.focus(), 100);
    }
  }, [showInfoOverlay]);

  // 语言字典
  const t = {
    zh: {
      loading: '加载中',
      resume: '继续播放',
      favorite: '收藏',
      favorited: '已收藏',
      sound: '声音',
      muted: '静音',
      infinity: '连播: 开',
      single: '连播: 关',
      desc: '为您准备精彩内容...',
    },
    en: {
      loading: 'LOADING',
      resume: 'RESUME',
      favorite: 'FAVORITE',
      favorited: 'FAVORITED',
      sound: 'SOUND',
      muted: 'MUTED',
      infinity: 'INFINITY: ON',
      single: 'INFINITY: OFF',
      desc: 'Dive into this cinematic experience...',
    },
  }[language];

  return (
    <div className="h-full w-full bg-black relative flex items-center justify-center overflow-hidden font-sans">
      <video
        ref={videoRef}
        muted={isMuted}
        style={{ backgroundColor: 'black' }}
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
        className="w-full h-full object-contain relative z-10"
        src={client.getVideoUrl(currentIndex < videos.length ? currentItem : videos[0])}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsBuffering(false);
          if (overlayTimer.current) clearTimeout(overlayTimer.current);
          overlayTimer.current = setTimeout(() => setShowInfoOverlay(false), 2500);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => (isAutoPlay ? changeVideo(1) : setIsPlaying(false))}
      />

      <div
        className={`absolute inset-0 z-20 flex flex-col transition-all duration-1000 ease-out ${showInfoOverlay ? 'opacity-100 scale-100 backdrop-blur-xl bg-black/40' : 'opacity-0 pointer-events-none scale-110 backdrop-blur-none bg-transparent'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-transparent to-transparent z-0" />
        <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10">
          {posterSrc && (
            <div className="relative animate-in zoom-in-95 duration-1000">
              <div className="absolute -inset-8 bg-indigo-600/10 blur-3xl opacity-30" />
              <img
                src={posterSrc}
                className={`w-[240px] aspect-[2/3] object-cover rounded-[20px] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] border border-white/5 relative z-10 transition-transform duration-[3500ms] ease-out ${showInfoOverlay ? 'scale-105' : 'scale-100'}`}
                alt="Poster"
              />
            </div>
          )}
        </div>
        <div className="absolute right-10 left-[340px] top-0 bottom-0 flex flex-col justify-center items-end text-right z-10">
          <div className="absolute top-8 right-0">
            <button
              onClick={onBack}
              tabIndex={0}
              className="player-action-btn p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white hover:text-black outline-none focus:ring-2 focus:ring-white transition-all shadow-xl"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="animate-in slide-in-from-right-8 duration-700 w-full">
            <h1 className="text-4xl font-black mb-2 tracking-tight text-white drop-shadow-2xl uppercase leading-tight">
              {currentItem.Name}
            </h1>
            <div className="flex gap-3 text-indigo-400 font-black uppercase tracking-[0.3em] text-[8px] justify-end">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">
                {currentItem.ProductionYear}
              </span>
              <span className="opacity-60">● {currentItem.Type}</span>
            </div>
          </div>
          <div className="mt-6 animate-in slide-in-from-right-6 duration-700 delay-100 w-full max-w-[500px]">
            <p className="text-sm text-white/80 leading-relaxed line-clamp-6 font-medium tracking-wide italic drop-shadow-md">
              {currentItem.Overview || t.desc}
            </p>
          </div>
          <div className="mt-10 flex gap-3 animate-in slide-in-from-right-4 duration-700 delay-200">
            <ActionButton
              id="tv-player-play-btn"
              icon={<Play fill="currentColor" size={14} />}
              label={isBuffering ? t.loading : t.resume}
              onClick={() => {
                if (!isBuffering) setShowInfoOverlay(false);
              }}
              primary
            />
            <ActionButton
              icon={
                <Heart
                  className={favoriteIds.has(currentItem.Id) ? 'fill-red-500 text-red-500' : ''}
                  size={14}
                />
              }
              label={favoriteIds.has(currentItem.Id) ? t.favorited : t.favorite}
              onClick={toggleFavorite}
            />
            <ActionButton
              icon={
                isMuted ? <VolumeX className="text-red-500" size={14} /> : <Volume2 size={14} />
              }
              label={isMuted ? t.muted : t.sound}
              onClick={() => setIsMuted(!isMuted)}
            />
            <ActionButton
              icon={<Infinity size={14} />}
              label={isAutoPlay ? t.infinity : t.single}
              onClick={() => setIsAutoPlay(!isAutoPlay)}
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
          <div
            className={`h-full bg-indigo-600 transition-all duration-[2500ms] linear ${showInfoOverlay ? 'w-full' : 'w-0'}`}
          />
        </div>
      </div>
    </div>
  );
};

function ActionButton({
  id,
  icon,
  label,
  onClick,
  primary = false,
}: {
  id?: string;
  icon: any;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      id={id}
      tabIndex={0}
      onClick={onClick}
      className={`player-action-btn flex items-center gap-2 px-5 py-2.5 rounded-[14px] transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105 focus:-translate-y-1 active:scale-95 ${primary ? 'bg-white text-black font-black shadow-lg' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 font-black'}`}
    >
      {icon}
      <span className="text-[9px] font-black tracking-widest">{label}</span>
    </button>
  );
}

export default TVVideoPlayer;

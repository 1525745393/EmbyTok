import React, { useLayoutEffect, useState } from 'react';
import Login from '../Login';
import VideoFeed from '../VideoFeed';
import VideoGrid from '../VideoGrid';
import LibrarySelect from '../LibrarySelect';
import { FeedType, EmbyItem } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import { Translations } from '../../src/locales';
import {
  Menu,
  LayoutGrid,
  Smartphone,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
} from 'lucide-react';
import {
  useTranslation,
  useConfig,
  useLibraries,
  useVideoList,
  useUIState,
  useDeviceDetection,
} from '../../src/hooks';
import { isFolderType } from '../../utils';

interface StandardRootProps {
  onToggleMode?: () => void;
}

interface StandardContentViewProps {
  viewMode: 'feed' | 'grid';
  videos: EmbyItem[];
  client: MediaClient;
  loading: boolean;
  feedType: FeedType;
  hasMore: boolean;
  currentIndex: number;
  favoriteIds: Set<string>;
  isMuted: boolean;
  isAutoPlay: boolean;
  setIsMuted: (muted: boolean) => void;
  setIsAutoPlay: (autoPlay: boolean) => void;
  onSelect: (index: number) => void;
  onNavigate: (id: string, title: string) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onIndexChange: (index: number) => void;
  t: Translations;
}

const APP_VERSION = '1.2.3';

const StandardTopBar = React.memo(
  ({
    navStack,
    feedType,
    setFeedType,
    viewMode,
    setViewMode,
    isMuted,
    isFullscreen,
    isAutoPlay,
    onNavigateBack,
    onOpenMenu,
    onToggleMute,
    onToggleFullscreen,
    t,
  }: {
    navStack: { id: string; title: string }[];
    feedType: FeedType;
    setFeedType: (type: FeedType) => void;
    viewMode: 'feed' | 'grid';
    setViewMode: (mode: 'feed' | 'grid') => void;
    isMuted: boolean;
    isFullscreen: boolean;
    isAutoPlay: boolean;
    onNavigateBack: () => void;
    onOpenMenu: () => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    t: Translations;
  }) => {
    return (
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 to-transparent backdrop-blur-sm flex items-center justify-between px-3 transition-all duration-500 ${
          viewMode === 'feed' && isAutoPlay
            ? 'opacity-0 pointer-events-none -translate-y-full'
            : 'opacity-100 translate-y-0'
        }`}
        style={{
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
          height: 'calc(4rem + env(safe-area-inset-top))',
        }}
      >
        <div className="min-w-[44px] flex items-center">
          {navStack.length > 0 ? (
            <button onClick={onNavigateBack} className="p-2">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <button onClick={onOpenMenu} className="p-2">
              <Menu size={24} />
            </button>
          )}
        </div>
        <div className="flex-1 flex justify-center items-center overflow-hidden mx-1">
          {navStack.length > 0 ? (
            <h2 className="font-bold truncate text-[clamp(13px,4vw,15px)] text-center">
              {navStack[navStack.length - 1].title}
            </h2>
          ) : (
            <div className="flex items-center font-bold gap-4 sm:gap-8">
              {(['favorites', 'random', 'latest'] as FeedType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFeedType(type)}
                  className={`transition-all duration-300 relative py-1 text-sm ${
                    feedType === type ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {t.standardRoot[type as keyof typeof t.standardRoot]}
                  {feedType === type && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 justify-end min-w-[90px]">
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-white/80"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button onClick={onToggleMute} className="p-2 text-white/80">
            {isMuted ? (
              <VolumeX size={20} className="text-red-500" />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'feed' ? 'grid' : 'feed')}
            className="p-2 text-white/80"
          >
            {viewMode === 'feed' ? (
              <LayoutGrid size={20} />
            ) : (
              <Smartphone size={20} />
            )}
          </button>
        </div>
      </div>
    );
  }
);
StandardTopBar.displayName = 'StandardTopBar';

const StandardContentView = React.memo(
  ({
    viewMode,
    videos,
    client,
    loading,
    feedType,
    hasMore,
    currentIndex,
    favoriteIds,
    isMuted,
    isAutoPlay,
    setIsMuted,
    setIsAutoPlay,
    onSelect,
    onNavigate,
    onLoadMore,
    onRefresh,
    onToggleFavorite,
    onDelete,
    onIndexChange,
    t,
  }: StandardContentViewProps) => {
    return (
      <div className="w-full h-full bg-black relative z-10">
        {viewMode === 'grid' ? (
          <VideoGrid
            videos={videos}
            client={client}
            isLoading={loading}
            feedType={feedType}
            hasMore={hasMore}
            onSelect={onSelect}
            onLoadMore={onLoadMore}
            onRefresh={onRefresh}
            currentIndex={currentIndex}
            onNavigate={onNavigate}
          />
        ) : (
          <VideoFeed
            videos={videos}
            client={client}
            onRefresh={onRefresh}
            isLoading={loading}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
            initialIndex={currentIndex}
            onIndexChange={onIndexChange}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            feedType={feedType}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            isAutoPlay={isAutoPlay}
            onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
            t={t}
          />
        )}
      </div>
    );
  }
);
StandardContentView.displayName = 'StandardContentView';

function StandardRoot({ onToggleMode }: StandardRootProps) {
  const { t, language, toggleLanguage } = useTranslation();
  const { config, setConfig, client, logout } = useConfig();
  const { isIOSSafari: isIOSSafariDevice } = useDeviceDetection();
  const {
    libraries,
    selectedLib,
    setSelectedLib,
    hiddenLibIds,
    hiddenLibIdsSet,
    toggleHiddenLib,
  } = useLibraries(client);
  const { isMenuOpen, setIsMenuOpen, ...uiState } = useUIState();
  const [feedType, setFeedType] = useState<FeedType>('latest');

  const {
    videos,
    loading,
    hasMore,
    navStack,
    favoriteIds,
    viewMode,
    setViewMode,
    currentIndex,
    setCurrentIndex,
    loadVideos,
    toggleFavorite,
    deleteVideo,
    navigateTo,
    navigateBack,
    selectVideo,
  } = useVideoList({
    client,
    selectedLib,
    feedType,
    orientationMode: uiState.orientationMode,
    hiddenLibIds: hiddenLibIdsSet,
    libraries,
  });

  useLayoutEffect(() => {
    if (isIOSSafariDevice) {
      document.documentElement.classList.add('ios-safari');
    }

    return () => {
      document.documentElement.classList.remove('ios-safari');
    };
  }, [isIOSSafariDevice]);

  const handleDelete = async (itemId: string) => {
    try {
      await deleteVideo(itemId);
    } catch (error) {
      console.error('删除视频失败:', error);
      alert(t.standardRoot.deleteFailed);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(id, isFavorite);
    } catch (error) {
      console.error('切换收藏失败:', error);
    }
  };

  if (!config || !client) {
    return <Login onLogin={setConfig} />;
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans text-white">
      <StandardTopBar
        navStack={navStack}
        feedType={feedType}
        setFeedType={setFeedType}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMuted={uiState.isMuted}
        isFullscreen={uiState.isFullscreen}
        isAutoPlay={uiState.isAutoPlay}
        onNavigateBack={navigateBack}
        onOpenMenu={() => setIsMenuOpen(true)}
        onToggleMute={uiState.toggleMute}
        onToggleFullscreen={uiState.toggleFullscreen}
        t={t}
      />
      <StandardContentView
        viewMode={viewMode}
        videos={videos}
        client={client}
        loading={loading}
        feedType={feedType}
        hasMore={hasMore}
        currentIndex={currentIndex}
        favoriteIds={favoriteIds}
        isMuted={uiState.isMuted}
        isAutoPlay={uiState.isAutoPlay}
        setIsMuted={uiState.setIsMuted}
        setIsAutoPlay={uiState.setIsAutoPlay}
        onSelect={selectVideo}
        onNavigate={navigateTo}
        onLoadMore={() => loadVideos(false)}
        onRefresh={() => loadVideos(true)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onIndexChange={setCurrentIndex}
        t={t}
      />
      <LibrarySelect
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        libraries={libraries}
        selectedId={selectedLib?.Id || null}
        onSelect={lib => {
          setSelectedLib(lib);
          setIsMenuOpen(false);
        }}
        hiddenLibIds={new Set(hiddenLibIds)}
        onToggleHidden={toggleHiddenLib}
        onLogout={logout}
        serverUrl={config.url}
        username={config.username}
        orientationMode={uiState.orientationMode}
        onOrientationChange={uiState.setOrientationMode}
        onToggleMode={onToggleMode}
        t={t}
        toggleLanguage={toggleLanguage}
        language={language}
        version={APP_VERSION}
      />
    </div>
  );
}

export default React.memo(StandardRoot);

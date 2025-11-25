import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import VideoFeed from './components/VideoFeed';
import VideoGrid from './components/VideoGrid';
import LibrarySelect from './components/LibrarySelect';
import { ServerConfig, EmbyLibrary, EmbyItem, FeedType } from './types';
import { getLibraries, getVerticalVideos, getTokPlaylistItems, addToTokPlaylist, removeFromTokPlaylist } from './services/embyService';
import { Menu, LayoutGrid, Smartphone, Volume2, VolumeX } from 'lucide-react';

type ViewMode = 'feed' | 'grid';
const PAGE_SIZE = 80;

function App() {
  const [config, setConfig] = useState<ServerConfig | null>(() => {
    const saved = localStorage.getItem('embyConfig');
    return saved ? JSON.parse(saved) : null;
  });

  const [libraries, setLibraries] = useState<EmbyLibrary[]>([]);
  const [selectedLib, setSelectedLib] = useState<EmbyLibrary | null>(null);
  
  // Content State
  const [videos, setVideos] = useState<EmbyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [serverStartIndex, setServerStartIndex] = useState(0); // Track Emby's cursor
  
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [feedType, setFeedType] = useState<FeedType>('latest');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Settings State
  const [hiddenLibIds, setHiddenLibIds] = useState<Set<string>>(() => {
      const saved = localStorage.getItem('embyHiddenLibs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Audio State
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (config) {
      localStorage.setItem('embyConfig', JSON.stringify(config));
    } else {
      localStorage.removeItem('embyConfig');
    }
  }, [config]);

  // Persist Hidden Libs
  useEffect(() => {
      localStorage.setItem('embyHiddenLibs', JSON.stringify(Array.from(hiddenLibIds)));
  }, [hiddenLibIds]);

  useEffect(() => {
    if (config) {
      fetchLibraries();
      // Initial load handled by the feedType/selectedLib effect below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const fetchLibraries = async () => {
    if (!config) return;
    try {
      const libs = await getLibraries(config.url, config.userId, config.token);
      setLibraries(libs);
    } catch (e) {
      console.error("Error fetching libs", e);
    }
  };

  const getCurrentLibraryName = (lib: EmbyLibrary | null) => {
      return lib ? lib.Name : "收藏"; 
  };

  // Central function to load videos (both initial and pagination)
  const loadVideos = async (reset: boolean = false) => {
      if (!config) return;
      if (loading) return;

      setLoading(true);
      
      // If resetting, we start from 0. If loading more, we use the saved server index.
      const currentServerSkip = reset ? 0 : serverStartIndex;

      if (reset) {
          setVideos([]);
          setCurrentIndex(0);
          setHasMore(true);
          setServerStartIndex(0);
      }

      const libName = getCurrentLibraryName(selectedLib);

      // 1. Fetch Favorites IDs (only on reset/initial load to save bandwidth)
      if (reset) {
        try {
            const favItems = await getTokPlaylistItems(config.url, config.userId, config.token, libName);
            const ids = new Set(favItems.map(i => i.Id));
            setFavoriteIds(ids);
        } catch (e) {
            console.error("Failed to load favorites list", e);
        }
      }

      // 2. Fetch Videos
      try {
          const { items: newVideos, nextStartIndex, totalCount } = await getVerticalVideos(
            config.url, 
            config.userId, 
            config.token, 
            selectedLib ? selectedLib.Id : undefined,
            libName,
            feedType,
            currentServerSkip,
            PAGE_SIZE
          );
          
          if (reset) {
              setVideos(newVideos);
          } else {
              setVideos(prev => [...prev, ...newVideos]);
          }

          // Update the cursor for next time
          setServerStartIndex(nextStartIndex);

          // Determine if we have more based on server totals
          if (nextStartIndex >= totalCount) {
              setHasMore(false);
          } else {
              setHasMore(true);
          }

      } catch (e) {
          console.error("Error fetching videos", e);
          setHasMore(false);
      } finally {
          setLoading(false);
      }
  };

  // Wrapper for refreshing content (switching tabs, libraries, or manual refresh)
  const refreshContent = () => {
      loadVideos(true);
  };

  const handleLibrarySelect = (lib: EmbyLibrary | null) => {
    setSelectedLib(lib);
    // Rely on useEffect to trigger load
  };

  const handleFeedTypeChange = (type: FeedType) => {
      if (type === feedType) return;
      setFeedType(type);
      // CRITICAL FIX: Do NOT call loadVideos here. 
      // Rely on the useEffect below to trigger loadVideos when the state actually updates.
      // This prevents the "stale closure" bug where it loads with the old feedType.
  };

  // This effect ensures we load videos whenever the context changes (Type or Library)
  useEffect(() => {
     if (config) {
         loadVideos(true);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, selectedLib]);


  const handleToggleFavorite = async (itemId: string, isCurrentlyFavorite: boolean) => {
      if (!config) return;
      
      const nextFavIds = new Set(favoriteIds);
      if (isCurrentlyFavorite) {
          nextFavIds.delete(itemId);
      } else {
          nextFavIds.add(itemId);
      }
      setFavoriteIds(nextFavIds);

      const libName = getCurrentLibraryName(selectedLib);
      try {
          if (isCurrentlyFavorite) {
              await removeFromTokPlaylist(config.url, config.userId, config.token, libName, itemId);
          } else {
              await addToTokPlaylist(config.url, config.userId, config.token, libName, itemId);
          }
      } catch (e) {
          console.error("Failed to toggle favorite playlist", e);
          setFavoriteIds(favoriteIds);
      }
  };

  const handleGridSelect = (index: number) => {
      setCurrentIndex(index);
      setViewMode('feed');
  };

  const handleToggleHideLib = (libId: string) => {
      const newSet = new Set(hiddenLibIds);
      if (newSet.has(libId)) {
          newSet.delete(libId);
      } else {
          newSet.add(libId);
      }
      setHiddenLibIds(newSet);
  };

  const handleLogout = () => {
      setConfig(null);
      localStorage.removeItem('embyConfig');
      setVideos([]);
      setIsMenuOpen(false);
  };

  if (!config) {
    return <Login onLogin={setConfig} />;
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans text-white">
      
      {/* TOP NAVIGATION BAR */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-4 pt-2">
        <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-white/80 hover:text-white transition-colors"
        >
             <Menu className="w-6 h-6 drop-shadow-md" />
        </button>

        <div className="flex items-center gap-4 font-bold text-md drop-shadow-md transform translate-x-1">
             <button 
                onClick={() => handleFeedTypeChange('favorites')}
                className={`transition-colors ${feedType === 'favorites' ? 'text-white scale-105' : 'text-white/50 hover:text-white/80'}`}
             >
                 收藏
             </button>
             <div className="w-[1px] h-3 bg-white/20"></div>
             <button 
                onClick={() => handleFeedTypeChange('random')}
                className={`transition-colors ${feedType === 'random' ? 'text-white scale-105' : 'text-white/50 hover:text-white/80'}`}
             >
                 随机
             </button>
             <div className="w-[1px] h-3 bg-white/20"></div>
             <button 
                onClick={() => handleFeedTypeChange('latest')}
                className={`transition-colors ${feedType === 'latest' ? 'text-white scale-105' : 'text-white/50 hover:text-white/80'}`}
             >
                 最新
             </button>
        </div>
        
        <div className="flex items-center gap-1">
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-white/80 hover:text-white transition-colors"
            >
                {isMuted ? (
                     <VolumeX className="w-6 h-6 drop-shadow-md text-red-500" />
                ) : (
                     <Volume2 className="w-6 h-6 drop-shadow-md" />
                )}
            </button>
            <button 
                onClick={() => setViewMode(viewMode === 'feed' ? 'grid' : 'feed')}
                className="p-2 text-white/80 hover:text-white transition-colors"
            >
                {viewMode === 'feed' ? (
                    <LayoutGrid className="w-6 h-6 drop-shadow-md" />
                ) : (
                    <Smartphone className="w-6 h-6 drop-shadow-md" />
                )}
            </button>
        </div>
      </div>

      {selectedLib && (
          <div className="absolute top-16 left-0 right-0 z-30 flex justify-center pointer-events-none">
              <span className="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-white/70 border border-white/10 uppercase tracking-widest">
                  {selectedLib.Name}
              </span>
          </div>
      )}

      <div className="w-full h-full bg-black">
        {viewMode === 'grid' ? (
            <VideoGrid 
                videos={videos} 
                config={config} 
                onSelect={handleGridSelect} 
                isLoading={loading}
                // New Props for Grid Logic
                feedType={feedType}
                hasMore={hasMore}
                onLoadMore={() => loadVideos(false)}
                onRefresh={refreshContent}
            />
        ) : (
            <VideoFeed 
                key={`${selectedLib?.Id}-${feedType}`} // Force remount on context change
                videos={videos} 
                serverUrl={config.url} 
                token={config.token} 
                onRefresh={refreshContent}
                isLoading={loading}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                initialIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                
                // New Props
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                feedType={feedType}
                hasMore={hasMore}
                onLoadMore={() => loadVideos(false)}
            />
        )}
      </div>

      <LibrarySelect 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        libraries={libraries}
        selectedId={selectedLib?.Id || null}
        onSelect={handleLibrarySelect}
        // Settings Props
        hiddenLibIds={hiddenLibIds}
        onToggleHidden={handleToggleHideLib}
        onLogout={handleLogout}
        serverUrl={config.url}
        username={config.username}
      />
    </div>
  );
}

export default App;
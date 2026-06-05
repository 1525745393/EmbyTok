
import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, lazy, Suspense } from 'react';
import { ServerConfig, EmbyLibrary, EmbyItem, FeedType, OrientationMode, WatchHistoryItem, SearchHistoryItem, FavoriteCollection, SubtitleSettings, SubtitleTrack } from '../../types';
import { ClientFactory } from '../../services/clientFactory';
import { Menu, LayoutGrid, Smartphone, Volume2, VolumeX, Maximize, Minimize, ChevronLeft, Search, History, Heart } from 'lucide-react';

// 导入我们新创建的组件
const WatchHistoryView = lazy(() => import('../WatchHistoryView'));
const SearchBarComponent = lazy(() => import('../SearchBar'));
const SearchResultsComponent = lazy(() => import('../SearchResults'));
const FavoritesManagerComponent = lazy(() => import('../FavoritesManager'));

// 代码分割：延迟加载组件
const Login = lazy(() => import('../Login'));
const VideoFeed = lazy(() => import('../VideoFeed'));
const VideoGrid = lazy(() => import('../VideoGrid'));
const LibrarySelect = lazy(() => import('../LibrarySelect'));

// 简单的加载组件
const ComponentFallback = () => (
  <div className="flex items-center justify-center h-full w-full bg-black">
    <div className="w-8 h-8 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

type ViewMode = 'feed' | 'grid';
const PAGE_SIZE = 200;

interface NavItem {
    id: string;
    title: string;
}

interface StandardRootProps {
    onToggleMode?: () => void;
}

function StandardRoot({ onToggleMode }: StandardRootProps) {
  const [config, setConfig] = useState<ServerConfig | null>(() => {
    try { const saved = localStorage.getItem('embyConfig'); return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  const client = useMemo(() => config ? ClientFactory.create(config) : null, [config]);
  const [libraries, setLibraries] = useState<EmbyLibrary[]>([]);
  const [selectedLib, setSelectedLib] = useState<EmbyLibrary | null>(null);
  const [videos, setVideos] = useState<EmbyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [serverStartIndex, setServerStartIndex] = useState(0); 
  const [navStack, setNavStack] = useState<NavItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [feedType, setFeedType] = useState<FeedType>('latest');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  
  // 语言状态
  const [language, setLanguage] = useState<'zh' | 'en'>(() => (localStorage.getItem('embyLanguage') as any) || 'zh');
  // 版本号
  const [appVersion, setAppVersion] = useState<string>('1.2.3');
  
  // 搜索相关状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmbyItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('embySearchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // 观看历史相关状态
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('embyWatchHistory');
      return saved ? JSON.parse(saved).items : [];
    } catch (e) {
      return [];
    }
  });
  
  // 收藏相关状态
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  const [favoritesCollections, setFavoritesCollections] = useState<FavoriteCollection[]>(() => {
    try {
      const saved = localStorage.getItem('embyFavorites');
      if (saved) {
        return JSON.parse(saved).collections;
      }
      return [{
        id: 'default',
        name: '默认收藏',
        createdAt: Date.now(),
        itemIds: []
      }];
    } catch (e) {
      return [{
        id: 'default',
        name: '默认收藏',
        createdAt: Date.now(),
        itemIds: []
      }];
    }
  });
  
  // 字幕相关状态
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(() => {
    try {
      const saved = localStorage.getItem('embySubtitleSettings');
      return saved ? JSON.parse(saved) : {
        enabled: false,
        fontSize: 'medium',
        textColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        position: 'bottom'
      };
    } catch (e) {
      return {
        enabled: false,
        fontSize: 'medium',
        textColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        position: 'bottom'
      };
    }
  });
  
  // 用于收藏管理的视频详情映射
  const [itemDetailsMap, setItemDetailsMap] = useState<Map<string, EmbyItem>>(new Map());

  const [orientationMode, setOrientationMode] = useState<OrientationMode>(() => (localStorage.getItem('embyOrientationMode') as OrientationMode) || 'vertical');
  const [hiddenLibIds, setHiddenLibIds] = useState<Set<string>>(() => {
      try { const s = localStorage.getItem('embyHiddenLibs'); return s ? new Set(JSON.parse(s)) : new Set(); } catch (e) { return new Set(); }
  });

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (config) localStorage.setItem('embyConfig', JSON.stringify(config));
    else localStorage.removeItem('embyConfig');
  }, [config]);

  useEffect(() => {
    if (client) fetchLibraries();
  }, [client]);
  const fetchLibraries = async () => { if (client) setLibraries(await client.getLibraries()); };
  
  // 保存搜索历史到 localStorage
  useEffect(() => {
    localStorage.setItem('embySearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  // 保存观看历史到 localStorage
  useEffect(() => {
    localStorage.setItem('embyWatchHistory', JSON.stringify({
      items: watchHistory,
      lastUpdated: Date.now()
    }));
  }, [watchHistory]);
  
  // 保存收藏到 localStorage
  useEffect(() => {
    localStorage.setItem('embyFavorites', JSON.stringify({
      collections: favoritesCollections,
      defaultCollectionId: 'default'
    }));
  }, [favoritesCollections]);
  
  // 保存字幕设置到 localStorage
  useEffect(() => {
    localStorage.setItem('embySubtitleSettings', JSON.stringify(subtitleSettings));
  }, [subtitleSettings]);
  
  // 搜索函数
  const handleSearch = useCallback(async (query: string) => {
    if (!client || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await client.searchItems(query);
      setSearchResults(results);
      
      // 添加到搜索历史
      if (results.length > 0) {
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
          const newItem: SearchHistoryItem = {
            query: query.trim(),
            timestamp: Date.now()
          };
          return [newItem, ...filtered].slice(0, 20);
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [client]);
  
  // 添加到观看历史
  const handleAddToWatchHistory = useCallback((item: EmbyItem, currentTime: number, duration: number) => {
    const imageUrl = item.ImageTags?.Primary 
      ? client?.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary') 
      : undefined;
    
    setWatchHistory(prev => {
      const existingIndex = prev.findIndex(h => h.itemId === item.Id);
      const newItem: WatchHistoryItem = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `${item.Id}_${Date.now()}`,
        itemId: item.Id,
        name: item.Name,
        imageUrl,
        positionTicks: currentTime,
        totalTicks: duration,
        watchedAt: Date.now(),
        libraryId: ''
      };
      
      if (existingIndex >= 0) {
        return [newItem, ...prev.filter((_, i) => i !== existingIndex)];
      }
      
      return [newItem, ...prev].slice(0, 100);
    });
  }, [client]);
  
  // 从观看历史移除
  const handleRemoveFromWatchHistory = useCallback((itemId: string) => {
    setWatchHistory(prev => prev.filter(item => item.itemId !== itemId));
  }, []);
  
  // 清空观看历史
  const handleClearWatchHistory = useCallback(() => {
    setWatchHistory([]);
  }, []);
  
  // 处理从历史记录选择视频
  const handleSelectFromHistory = useCallback((itemId: string, positionTicks: number) => {
    // 查找视频在当前视频列表中的索引
    const index = videos.findIndex(v => v.Id === itemId);
    if (index >= 0) {
      setCurrentIndex(index);
      setShowWatchHistory(false);
      setViewMode('feed');
      // TODO: 设置播放进度
    }
  }, [videos]);
  
  // 收藏相关函数
  const handleCreateCollection = useCallback((name: string) => {
    const newCollection: FavoriteCollection = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      createdAt: Date.now(),
      itemIds: []
    };
    setFavoritesCollections(prev => [...prev, newCollection]);
  }, []);
  
  const handleDeleteCollection = useCallback((collectionId: string) => {
    setFavoritesCollections(prev => prev.filter(c => c.id !== collectionId));
  }, []);
  
  const handleRenameCollection = useCallback((collectionId: string, newName: string) => {
    setFavoritesCollections(prev => prev.map(c => 
      c.id === collectionId ? { ...c, name: newName.trim() } : c
    ));
  }, []);
  
  const handleAddToCollection = useCallback((itemId: string, collectionId: string) => {
    setFavoritesCollections(prev => prev.map(c => {
      if (c.id === collectionId && !c.itemIds.includes(itemId)) {
        return { ...c, itemIds: [...c.itemIds, itemId] };
      }
      return c;
    }));
  }, []);
  
  const handleRemoveFromCollection = useCallback((itemId: string, collectionId: string) => {
    setFavoritesCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        return { ...c, itemIds: c.itemIds.filter(id => id !== itemId) };
      }
      return c;
    }));
  }, []);
  
  // 更新字幕设置
  const handleUpdateSubtitleSettings = useCallback((settings: Partial<SubtitleSettings>) => {
    setSubtitleSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  // 将视频添加到 itemDetailsMap 以便收藏管理使用
  useEffect(() => {
    const newMap = new Map(itemDetailsMap);
    videos.forEach(video => {
      newMap.set(video.Id, video);
    });
    setItemDetailsMap(newMap);
  }, [videos]);

  const loadVideos = async (reset: boolean = false, overrideParentId?: string) => {
      if (!client || loading) return;
      setLoading(true);
      const skip = 0;
      const effectiveParentId = overrideParentId !== undefined ? overrideParentId : (navStack.length > 0 ? navStack[navStack.length - 1].id : undefined);
      if (reset) { setVideos([]); setHasMore(false); setServerStartIndex(0); setCurrentIndex(0); }
      let includeIds = !selectedLib ? libraries.filter(l => !hiddenLibIds.has(l.Id)).map(l => l.Id).join(',') : undefined;
      try {
          if (reset) setFavoriteIds(await client.getFavorites(selectedLib?.Name || "收藏"));
          const { items: newVideos, totalCount } = await client.getVideos(effectiveParentId, selectedLib, feedType, skip, PAGE_SIZE, orientationMode, includeIds);
          setVideos(newVideos);
          setHasMore(false);
          if (reset && effectiveParentId && newVideos.length > 0) {
              const type = (newVideos[0].Type || '').toLowerCase();
              if (['series', 'season', 'folder', 'boxset', 'show'].includes(type) && viewMode === 'feed') setViewMode('grid');
          }
      } catch (e) { setHasMore(false); } finally { setLoading(false); }
  };

  useEffect(() => { if (client) loadVideos(true); }, [navStack, client, feedType, selectedLib, orientationMode, hiddenLibIds]);

  // 处理iOS Safari安全区域
  useLayoutEffect(() => {
    // 检测是否为iOS Safari
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream && /Safari/.test(navigator.userAgent);
    
    if (isIOSSafari) {
      // 为iOS Safari添加特殊样式
      document.documentElement.classList.add('ios-safari');
    }
    
    return () => {
      document.documentElement.classList.remove('ios-safari');
    };
  }, []);

  const toggleLanguage = () => {
      const next = language === 'zh' ? 'en' : 'zh';
      setLanguage(next);
      localStorage.setItem('embyLanguage', next);
  };

  if (!config || !client) {
    return (
      <Suspense fallback={<ComponentFallback />}>
        <Login onLogin={setConfig} />
      </Suspense>
    );
  }

  const t = {
      zh: { favorites: '收藏', random: '随机', latest: '最新', discover: '发现中心' },
      en: { favorites: 'Fav', random: 'Random', latest: 'Latest', discover: 'Discover' }
  }[language];

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans text-white">
      <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 to-transparent backdrop-blur-sm flex items-center justify-between px-3 transition-all duration-500 ${(viewMode === 'feed' && isAutoPlay) ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'}`}
        style={{
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
          height: 'calc(4rem + env(safe-area-inset-top))'
        }}
      >
        <div className="min-w-[44px] flex items-center">
          {navStack.length > 0 ? (
            <button onClick={() => setNavStack(prev => prev.slice(0, -1))} className="p-2"><ChevronLeft size={24} /></button>
          ) : (
            <button onClick={() => setIsMenuOpen(true)} className="p-2"><Menu size={24} /></button>
          )}
        </div>
        <div className="flex-1 flex justify-center items-center overflow-hidden mx-1">
          {navStack.length > 0 ? (
            <h2 className="font-bold truncate text-[clamp(13px,4vw,15px)] text-center">{navStack[navStack.length - 1].title}</h2>
          ) : (
            <div className="flex items-center font-bold gap-4 sm:gap-8">
                 {['favorites', 'random', 'latest'].map(type => (
                     <button key={type} onClick={() => setFeedType(type as FeedType)} className={`transition-all duration-300 relative py-1 text-sm ${feedType === type ? 'text-white' : 'text-white/40'}`}>
                         {t[type as keyof typeof t]}
                         {feedType === type && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                     </button>
                 ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 justify-end min-w-[90px]">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className={`p-2 transition-colors ${showSearch ? 'text-indigo-400' : 'text-white/80 hover:text-white'}`}
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => setShowWatchHistory(!showWatchHistory)} 
              className={`p-2 transition-colors ${showWatchHistory ? 'text-indigo-400' : 'text-white/80 hover:text-white'}`}
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setShowFavoritesManager(!showFavoritesManager)} 
              className={`p-2 transition-colors ${showFavoritesManager ? 'text-indigo-400' : 'text-white/80 hover:text-white'}`}
            >
              <Heart size={20} />
            </button>
            <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }} className="p-2 text-white/80">{isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/80">{isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}</button>
            <button onClick={() => setViewMode(viewMode === 'feed' ? 'grid' : 'feed')} className="p-2 text-white/80">{viewMode === 'feed' ? <LayoutGrid size={20} /> : <Smartphone size={20} />}</button>
        </div>
      </div>
      <div className="w-full h-full bg-black relative z-10">
        <Suspense fallback={<ComponentFallback />}>
        {/* 搜索视图 */}
        {showSearch && (
          <div className="absolute inset-0 bg-black z-30 flex flex-col">
            <div className="p-4">
              <Suspense fallback={<div className="h-12 bg-zinc-800 rounded-full animate-pulse" />}>
                <SearchBarComponent
                  query={searchQuery}
                  isFocused={true}
                  searchHistory={searchHistory}
                  onQueryChange={(q) => {
                    setSearchQuery(q);
                    handleSearch(q);
                  }}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  onHistoryItemClick={(q) => {
                    setSearchQuery(q);
                    handleSearch(q);
                  }}
                  onClearHistory={() => setSearchHistory([])}
                  onClearQuery={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                />
              </Suspense>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<ComponentFallback />}>
                <SearchResultsComponent
                  results={searchResults}
                  loading={searchLoading}
                  query={searchQuery}
                  client={client}
                  onSelectVideo={(item) => {
                    // 找到视频在列表中的索引，或添加到列表
                    const index = videos.findIndex(v => v.Id === item.Id);
                    if (index >= 0) {
                      setCurrentIndex(index);
                    } else {
                      setVideos(prev => [item, ...prev]);
                      setCurrentIndex(0);
                    }
                    setShowSearch(false);
                    setViewMode('feed');
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* 观看历史视图 */}
        {showWatchHistory && (
          <div className="absolute inset-0 bg-black/95 z-40">
            <Suspense fallback={<ComponentFallback />}>
              <WatchHistoryView
                history={watchHistory}
                client={client}
                onSelectVideo={handleSelectFromHistory}
                onRemoveFromHistory={handleRemoveFromWatchHistory}
                onClearHistory={handleClearWatchHistory}
                onClose={() => setShowWatchHistory(false)}
              />
            </Suspense>
          </div>
        )}

        {/* 收藏管理器 */}
        {showFavoritesManager && (
          <div className="absolute inset-0 bg-black/95 z-40">
            <Suspense fallback={<ComponentFallback />}>
              <FavoritesManagerComponent
                collections={favoritesCollections}
                client={client}
                items={itemDetailsMap}
                onSelectVideo={(item) => {
                  const index = videos.findIndex(v => v.Id === item.Id);
                  if (index >= 0) {
                    setCurrentIndex(index);
                  } else {
                    setVideos(prev => [item, ...prev]);
                    setCurrentIndex(0);
                  }
                  setShowFavoritesManager(false);
                  setViewMode('feed');
                }}
                onCreateCollection={handleCreateCollection}
                onDeleteCollection={handleDeleteCollection}
                onRenameCollection={handleRenameCollection}
                onAddToCollection={handleAddToCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onClose={() => setShowFavoritesManager(false)}
              />
            </Suspense>
          </div>
        )}

        {/* 正常视图 */}
        {!showSearch && !showWatchHistory && !showFavoritesManager && (
          <>
            {viewMode === 'grid' ? (
                <VideoGrid videos={videos} client={client} isLoading={loading} feedType={feedType} hasMore={hasMore} onSelect={(idx) => { setCurrentIndex(idx); setViewMode('feed'); }} onLoadMore={() => loadVideos(false)} onRefresh={() => loadVideos(true)} currentIndex={currentIndex} onNavigate={(id, title) => { setNavStack(prev => [...prev, { id, title }]); setViewMode('grid'); }} />
            ) : (
                <VideoFeed 
                    videos={videos} 
                    client={client} 
                    onRefresh={() => loadVideos(true)} 
                    isLoading={loading} 
                    favoriteIds={favoriteIds} 
                    onToggleFavorite={async (id, fav) => { 
                        await client.toggleFavorite(id, fav, selectedLib?.Name || "收藏"); 
                        setFavoriteIds(prev => { 
                            const n = new Set(prev); 
                            if (fav) n.delete(id); else n.add(id); 
                            return n; 
                        }); 
                        // 同时也更新我们的本地收藏
                        if (fav) {
                          handleRemoveFromCollection(id, 'default');
                        } else {
                          handleAddToCollection(id, 'default');
                        }
                    }} 
                    onDelete={async (itemId) => {
                        try {
                            await client.deleteItem(itemId);
                            setVideos(prev => prev.filter(video => video.Id !== itemId));
                        } catch (error) {
                            console.error('删除视频失败:', error);
                            alert(language === 'zh' ? '删除失败，请检查权限' : 'Deletion failed, please check permissions');
                        }
                    }}
                    initialIndex={currentIndex} 
                    onIndexChange={setCurrentIndex} 
                    isMuted={isMuted} 
                    onToggleMute={() => setIsMuted(!isMuted)} 
                    feedType={feedType} 
                    hasMore={hasMore} 
                    onLoadMore={() => loadVideos(false)} 
                    isAutoPlay={isAutoPlay} 
                    onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)} 
                    language={language}
                    subtitleSettings={subtitleSettings}
                    onUpdateSubtitleSettings={handleUpdateSubtitleSettings}
                    onAddToWatchHistory={handleAddToWatchHistory}
                />
            )}
          </>
        )}
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <LibrarySelect isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} libraries={libraries} selectedId={selectedLib?.Id || null} onSelect={(lib) => { setSelectedLib(lib); setIsMenuOpen(false); }} hiddenLibIds={hiddenLibIds} onToggleHidden={(id) => {
            const n = new Set(hiddenLibIds); if (n.has(id)) n.delete(id); else n.add(id);
            setHiddenLibIds(n); localStorage.setItem('embyHiddenLibs', JSON.stringify(Array.from(n)));
        }} onLogout={() => { setConfig(null); localStorage.removeItem('embyConfig'); window.location.reload(); }} serverUrl={config.url} username={config.username} orientationMode={orientationMode} onOrientationChange={setOrientationMode} onToggleMode={onToggleMode}
        language={language} onToggleLanguage={toggleLanguage}
        version={appVersion}
      />
      </Suspense>
    </div>
  );
}

export default StandardRoot;

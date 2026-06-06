
import { MediaClient } from './MediaClient';
import { EmbyItem, EmbyLibrary, FeedType, ServerConfig, VideoResponse, OrientationMode, SubtitleTrack, RecommendationCategory, WatchedHistoryItem, PlayQueue, PlayQueueItem, PlayMode } from '../types';
import { ApiRequestPool } from '../src/utils/apiRequestPool';

export class EmbyClient extends MediaClient {
    
    // API 请求池实例
    private requestPool: ApiRequestPool;

    // 请求池配置
    private requestPoolConfig = {
        cacheTTL: 5000,  // 5秒缓存
        maxConcurrency: 5 // 最大并发数
    };

    constructor(config: ServerConfig) {
        super(config);
        // 初始化请求池
        this.requestPool = new ApiRequestPool(this.requestPoolConfig);
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Emby-Authorization': `MediaBrowser Client="EmbyTok Web", Device="Web Browser", DeviceId="embytok-web-emby", Version="1.0.0", Token="${this.config.token}"`,
            'X-Emby-Token': this.config.token,
            'X-MediaBrowser-Token': this.config.token
        };
    }

    private getCleanUrl() {
        return this.config.url.replace(/\/$/, "");
    }

    async authenticate(username: string, password: string): Promise<ServerConfig> {
        const response = await fetch(`${this.getCleanUrl()}/Users/AuthenticateByName`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ Username: username, Pw: password }),
        });
        if (!response.ok) throw new Error('Emby Authentication failed');
        const data = await response.json();
        return { url: this.config.url, username: data.User.Name, userId: data.User.Id, token: data.AccessToken, serverType: 'emby' };
    }

    async getLibraries(): Promise<EmbyLibrary[]> {
        const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Views`;
        const cacheKey = `getLibraries:${url}`;
        
        const data = await this.requestPool.request<any>(cacheKey, async () => {
            const response = await fetch(url, { headers: this.getHeaders() });
            return response.json();
        });
        return data.Items || [];
    }

    // 仅为 TV 首页增加此接口，不干扰原有逻辑
    async getResumeItems(): Promise<EmbyItem[]> {
        const params = new URLSearchParams({
            Recursive: 'true',
            Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear,UserData',
            ImageTypeLimit: '1',
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            MediaTypes: 'Video',
            Limit: '12'
        });
        const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items/Resume?${params.toString()}`;
        const cacheKey = `getResumeItems:${url}`;
        
        const data = await this.requestPool.request<any>(cacheKey, async () => {
            const response = await fetch(url, { headers: this.getHeaders() });
            return response.json();
        });
        return (data.Items || []).map((i: any) => ({ ...i, Name: this.formatItemName(i) }));
    }

    private formatItemName(item: any): string {
        if (item.Type === 'Episode') {
            const index = item.IndexNumber !== undefined ? String(item.IndexNumber).padStart(2, '0') : '--';
            const season = item.ParentIndexNumber !== undefined ? `S${String(item.ParentIndexNumber).padStart(2, '0')}` : '';
            return `${season}E${index}. ${item.Name}`;
        }
        return item.Name || '未命名';
    }

    private applyOrientationFilter(items: any[], mode: OrientationMode): any[] {
        if (mode === 'both') return items;
        return items.filter(item => {
            const isNavFolder = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet'].includes(item.Type);
            if (isNavFolder) return true;
            const w = item.Width || 0;
            const h = item.Height || 0;
            if (w === 0 || h === 0) return true; 
            if (mode === 'vertical') return h >= w * 0.8;
            if (mode === 'horizontal') return w > h;
            return true;
        });
    }

    async getVideos(
        navParentId: string | undefined, 
        library: EmbyLibrary | null, 
        feedType: FeedType, 
        skip: number, 
        limit: number, 
        orientationMode: OrientationMode,
        includeIds?: string
    ): Promise<VideoResponse> {
        
        const libraryName = library ? library.Name : "收藏";

        // 严格遵循 backup 中的 Playlist 逻辑
        if (feedType === 'favorites') {
            const playlistItems = await this.getTokPlaylistItemsInternal(libraryName);
            const filtered = this.applyOrientationFilter(playlistItems, orientationMode);
            const paged = filtered.reverse().slice(skip, skip + limit);
            return { items: paged, nextStartIndex: skip + limit, totalCount: filtered.length };
        }

        const params = new URLSearchParams({
            Fields: 'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
            Limit: (limit * 2).toString(), 
            StartIndex: skip.toString(),
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
        });

        if (includeIds && !navParentId && !library) {
            params.append('ParentIds', includeIds);
        }

        if (navParentId) {
            params.append('ParentId', navParentId);
            params.append('Recursive', 'false');
            params.append('SortBy', 'SortName');
            params.append('IncludeItemTypes', 'Movie,Video,Episode,Folder,BoxSet,Series,Season');
        } else {
            if (library) {
                params.append('ParentId', library.Id);
                const collectionType = (library.CollectionType || '').toLowerCase();
                if (collectionType === 'tvshows' || collectionType === 'show') {
                    params.append('IncludeItemTypes', 'Series');
                } else if (collectionType === 'folders') {
                    params.append('IncludeItemTypes', 'Movie,Video,Episode,Folder,BoxSet');
                } else {
                    params.append('IncludeItemTypes', 'Movie,Video,Episode');
                }
            } else {
                params.append('IncludeItemTypes', 'Movie,Video,Episode');
            }
            params.append('Recursive', 'true');
            params.append('SortBy', feedType === 'random' ? 'Random' : 'DateCreated');
            params.append('SortOrder', 'Descending');
        }

        const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`;
        const cacheKey = `getVideos:${url}`;
        
        const data = await this.requestPool.request<any>(cacheKey, async () => {
            const response = await fetch(url, { headers: this.getHeaders() });
            return response.json();
        });
        const rawItems = data.Items || [];
        const filteredItems = this.applyOrientationFilter(rawItems, orientationMode);
        
        const items = filteredItems.map((item: any) => ({
            ...item,
            Name: this.formatItemName(item),
            UserData: item.UserData ? {
                ...item.UserData,
                Played: item.UserData.Played || false,
                PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
                LastPlayedDate: item.UserData.LastPlayedDate
            } : undefined
        }));

        return {
            items,
            nextStartIndex: skip + rawItems.length,
            totalCount: data.TotalRecordCount || 0
        };
    }

    getVideoUrl(item: EmbyItem): string {
        // 直接获取原始文件，完全不转码
        // 优先从MediaSources中找到可以直接播放的媒体源
        if (item.MediaSources && item.MediaSources.length > 0) {
            const directSource = item.MediaSources.find(m => m.SupportsDirectPlay && m.Path);
            if (directSource) {
                return `${this.getCleanUrl()}/Videos/${item.Id}/stream?Static=true&MediaSourceId=${directSource.Id}&PlaySessionId=${Date.now()}&api_key=${this.config.token}`;
            }
        }
        
        // 回退到直接流方式，但明确告诉Emby我们不想要转码
        return `${this.getCleanUrl()}/Videos/${item.Id}/stream?Static=true&MediaSourceId=${item.Id}&PlaySessionId=${Date.now()}&RequireAvc=false&RequireNonAnamorphic=false&MaxWidth=3840&MaxHeight=2160&api_key=${this.config.token}`;
    }

    getImageUrl(itemId: string, tag?: string, type: 'Primary' | 'Backdrop' = 'Primary'): string {
        if (!tag) return '';
        // 补全 api_key 确保 TV 端加载正常
        return `${this.getCleanUrl()}/Items/${itemId}/Images/${type}?maxWidth=800&tag=${tag}&quality=90&api_key=${this.config.token}`;
    }

    // --- 恢复 Playlist 原始实现 ---
    private async getTokPlaylistId(libraryName: string): Promise<string> {
        const playlistName = `Tok-${libraryName}`;
        const searchRes = await fetch(`${this.getCleanUrl()}/Users/${this.config.userId}/Items?IncludeItemTypes=Playlist&Recursive=true`, { headers: this.getHeaders() });
        const searchData = await searchRes.json();
        const existing = searchData.Items?.find((i: any) => i.Name === playlistName);
        if (existing) return existing.Id;
        const createRes = await fetch(`${this.getCleanUrl()}/Playlists?Name=${playlistName}&UserId=${this.config.userId}`, { method: 'POST', headers: this.getHeaders() });
        const createData = await createRes.json();
        return createData.Id;
    }

    private async getTokPlaylistItemsInternal(libraryName: string): Promise<EmbyItem[]> {
        try {
            const pid = await this.getTokPlaylistId(libraryName);
            const response = await fetch(`${this.getCleanUrl()}/Playlists/${pid}/Items?UserId=${this.config.userId}&Fields=MediaSources,Width,Height,Overview,UserData`, { headers: this.getHeaders() });
            const data = await response.json();
            return data.Items || [];
        } catch (e) { return []; }
    }

    async getFavorites(libraryName: string): Promise<Set<string>> {
        const items = await this.getTokPlaylistItemsInternal(libraryName);
        return new Set(items.map(i => i.Id));
    }

    async toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void> {
        const pid = await this.getTokPlaylistId(libraryName);
        if (!isFavorite) {
             await fetch(`${this.getCleanUrl()}/Playlists/${pid}/Items?Ids=${itemId}&UserId=${this.config.userId}`, { method: 'POST', headers: this.getHeaders() });
        } else {
            const itemsRes = await fetch(`${this.getCleanUrl()}/Playlists/${pid}/Items?UserId=${this.config.userId}`, { headers: this.getHeaders() });
            const entry = (await itemsRes.json()).Items.find((i: any) => i.Id === itemId);
            if (entry?.PlaylistItemId) {
                await fetch(`${this.getCleanUrl()}/Playlists/${pid}/Items?EntryIds=${entry.PlaylistItemId}`, { method: 'DELETE', headers: this.getHeaders() });
            }
        }
    }

    async deleteItem(itemId: string): Promise<void> {
        const response = await fetch(`${this.getCleanUrl()}/Items/${itemId}?api_key=${this.config.token}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete item: ${response.status}`);
        }
    }

    async searchItems(query: string): Promise<EmbyItem[]> {
        const params = new URLSearchParams({
            SearchTerm: query,
            IncludeItemTypes: 'Movie,Video,Episode,Series',
            Recursive: 'true',
            Fields: 'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
            Limit: '50'
        });

        const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`;
        const cacheKey = `searchItems:${url}`;
        
        const data = await this.requestPool.request<any>(cacheKey, async () => {
            const response = await fetch(url, { headers: this.getHeaders() });
            return response.json();
        });
        
        return (data.Items || []).map((item: any) => ({
            ...item,
            Name: this.formatItemName(item),
            UserData: item.UserData ? {
                ...item.UserData,
                Played: item.UserData.Played || false,
                PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
                LastPlayedDate: item.UserData.LastPlayedDate
            } : undefined
        }));
    }

    async getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]> {
        try {
            const params = new URLSearchParams({
                Fields: 'MediaSources'
            });
            
            const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items/${itemId}?${params.toString()}`;
            const cacheKey = `getSubtitleTracks:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                return response.json();
            });
            
            const mediaSources = data.MediaSources || [];
            
            const subtitleTracks: SubtitleTrack[] = [];
            mediaSources.forEach((source: any) => {
                if (source.MediaStreams) {
                    source.MediaStreams
                        .filter((stream: any) => stream.Type === 'Subtitle')
                        .forEach((stream: any) => {
                            let url: string | undefined;
                            if (stream.IsExternal && stream.Path) {
                                url = `${this.getCleanUrl()}/Videos/${itemId}/${stream.Index}/Stream?api_key=${this.config.token}`;
                            } else if (stream.Codec === 'srt' || stream.Codec === 'vtt') {
                                url = `${this.getCleanUrl()}/Videos/${itemId}/${stream.Index}/Stream?api_key=${this.config.token}`;
                            }
                            
                            subtitleTracks.push({
                                id: `${itemId}_${stream.Index}`,
                                label: stream.DisplayTitle || stream.Language || `字幕 ${subtitleTracks.length + 1}`,
                                language: stream.Language || 'und',
                                isDefault: stream.IsDefault || false,
                                codec: stream.Codec,
                                isExternal: stream.IsExternal || false,
                                url
                            });
                        });
                }
            });
            
            return subtitleTracks;
        } catch (error) {
            console.error('Failed to get subtitle tracks:', error);
            return [];
        }
    }

    /**
     * 获取BoxSet详情
     * @param boxSetId BoxSet ID
     */
    async getBoxSet(boxSetId: string): Promise<EmbyItem | null> {
        try {
            const params = new URLSearchParams({
                Fields: 'BasicSyncInfo,ProductionYear,UserData,Overview,Taglines,Genres'
            });
            const url = `${this.getCleanUrl()}/Items/${boxSetId}?${params.toString()}`;
            const cacheKey = `getBoxSet:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) return null;
                return response.json();
            });
            if (!data) return null;
            return {
                ...data,
                Name: data.Name || '未命名',
                UserData: data.UserData ? {
                    IsFavorite: data.UserData.IsFavorite || false,
                    PlaybackPositionTicks: data.UserData.PlaybackPositionTicks || 0,
                    PlayCount: data.UserData.PlayCount || 0,
                    Played: data.UserData.Played || false
                } : undefined
            };
        } catch (e) {
            console.error('获取BoxSet详情失败:', e);
            return null;
        }
    }

    /**
     * 获取BoxSet内部所有影片
     * @param boxSetId BoxSet ID
     */
    async getBoxSetItems(boxSetId: string): Promise<EmbyItem[]> {
        try {
            const params = new URLSearchParams({
                ParentId: boxSetId,
                Recursive: 'false',
                SortBy: 'SortName',
                Fields: 'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
                IncludeItemTypes: 'Movie,Video'
            });
            const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`;
            const cacheKey = `getBoxSetItems:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                return response.json();
            });
            const items = (data.Items || []).map((item: any) => ({
                ...item,
                Name: this.formatItemName(item),
                UserData: item.UserData ? {
                    IsFavorite: item.UserData.IsFavorite || false,
                    PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
                    PlayCount: item.UserData.PlayCount || 0,
                    Played: item.UserData.Played || false
                } : undefined
            }));
            return items;
        } catch (e) {
            console.error('获取BoxSet影片列表失败:', e);
            return [];
        }
    }

    /**
     * 获取推荐数据
     * 调用 /Users/{userId}/Items/Recommendations API
     * 支持获取"因为您喜欢"、"相似导演"、"同演员"等推荐类型
     */
    async getRecommendations(): Promise<RecommendationCategory[]> {
        try {
            const params = new URLSearchParams({
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear,UserData,MediaSources',
                ImageTypeLimit: '1',
                EnableImageTypes: 'Primary,Backdrop,Thumb'
            });

            const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items/Recommendations?${params.toString()}`;
            const cacheKey = `getRecommendations:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) {
                    throw new Error(`Recommendations API 请求失败: ${response.status}`);
                }
                return response.json();
            });
            
            const categories: RecommendationCategory[] = [];

            if (data.Items && Array.isArray(data.Items)) {
                for (const category of data.Items) {
                    // 格式化推荐类别数据
                    const recommendationCategory: RecommendationCategory = {
                        CategoryId: category.CategoryId || category.RecommendationType || '',
                        CategoryTitle: category.DisplayName || category.CategoryTitle || '推荐',
                        RecommendationType: category.RecommendationType || 'SimilarToRecentlyWatched',
                        Items: (category.Items || []).map((item: any) => ({
                            Id: item.Id,
                            Name: this.formatItemName(item),
                            Type: item.Type,
                            MediaType: item.MediaType,
                            Overview: item.Overview,
                            ProductionYear: item.ProductionYear,
                            Width: item.Width,
                            Height: item.Height,
                            RunTimeTicks: item.RunTimeTicks,
                            ImageTags: item.ImageTags,
                            UserData: item.UserData ? {
                                IsFavorite: item.UserData.IsFavorite || false,
                                PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
                                PlayCount: item.UserData.PlayCount || 0,
                                Played: item.UserData.Played || false,
                                LastPlayedDate: item.UserData.LastPlayedDate
                            } : undefined
                        }))
                    };
                    categories.push(recommendationCategory);
                }
            }

            return categories;
        } catch (error) {
            console.error('获取推荐数据失败:', error);
            return [];
        }
    }

    /**
     * 更新播放进度到Emby服务器
     * 调用 POST /Users/{userId}/PlayingItems/{itemId}
     * @param itemId 媒体项ID
     * @param positionTicks 播放位置（ ticks单位，1秒=10000000 ticks）
     */
    async updatePlaybackProgress(itemId: string, positionTicks: number): Promise<void> {
        try {
            const response = await fetch(
                `${this.getCleanUrl()}/Users/${this.config.userId}/PlayingItems/${itemId}`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        PositionTicks: positionTicks
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`更新播放进度失败: ${response.status}`);
            }
        } catch (error) {
            console.error('更新播放进度失败:', error);
            throw error;
        }
    }

    /**
     * 更新用户对媒体的评分
     * 调用 POST /Users/{userId}/Items/{itemId}
     * @param itemId 媒体项ID
     * @param rating 评分（0-10分制，内部转换为0-100）
     */
    async updateUserRating(itemId: string, rating: number): Promise<void> {
        try {
            // 将0-10分制转换为Emby的0-100分制
            const embyRating = Math.round(rating * 10);

            const response = await fetch(
                `${this.getCleanUrl()}/Users/${this.config.userId}/Items/${itemId}`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        UserRating: embyRating
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`更新用户评分失败: ${response.status}`);
            }
        } catch (error) {
            console.error('更新用户评分失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户的观影历史
     * 调用 GET /Users/{userId}/Items 使用 Filters=IsPlayed 过滤已观看项目
     * @param limit 返回记录数量限制，默认50
     */
    async getWatchedHistory(limit: number = 50): Promise<WatchedHistoryItem[]> {
        try {
            const params = new URLSearchParams({
                Filters: 'IsPlayed',
                SortBy: 'LastPlayedDate',
                SortOrder: 'Descending',
                Limit: limit.toString(),
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear,UserData,MediaSources',
                Recursive: 'true',
                IncludeItemTypes: 'Movie,Video,Episode'
            });

            const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`;
            const cacheKey = `getWatchedHistory:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) {
                    throw new Error(`获取观影历史失败: ${response.status}`);
                }
                return response.json();
            });
            
            const items: WatchedHistoryItem[] = (data.Items || []).map((item: any) => ({
                id: item.Id,
                itemId: item.Id,
                name: this.formatItemName(item),
                type: item.Type,
                mediaType: item.MediaType,
                overview: item.Overview,
                productionYear: item.ProductionYear,
                width: item.Width,
                height: item.Height,
                runTimeTicks: item.RunTimeTicks,
                playbackPositionTicks: item.UserData?.PlaybackPositionTicks || 0,
                playCount: item.UserData?.PlayCount || 0,
                played: item.UserData?.Played || false,
                lastPlayedDate: item.UserData?.LastPlayedDate,
                isFavorite: item.UserData?.IsFavorite || false
            }));

            return items;
        } catch (error) {
            console.error('获取观影历史失败:', error);
            return [];
        }
    }

    /**
     * 标记媒体为已观看
     * 调用 POST /Users/{userId}/PlayedItems/{itemId}
     * @param itemId 媒体项ID
     */
    async markAsWatched(itemId: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.getCleanUrl()}/Users/${this.config.userId}/PlayedItems/${itemId}`,
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`标记已观看失败: ${response.status}`);
            }
        } catch (error) {
            console.error('标记已观看失败:', error);
            throw error;
        }
    }

    /**
     * 标记媒体为未观看
     * 调用 POST /Users/{userId}/UnplayedItems/{itemId}
     * @param itemId 媒体项ID
     */
    async markAsUnwatched(itemId: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.getCleanUrl()}/Users/${this.config.userId}/UnplayedItems/${itemId}`,
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`标记未观看失败: ${response.status}`);
            }
        } catch (error) {
            console.error('标记未观看失败:', error);
            throw error;
        }
    }

    // ==================== 播放队列相关实现 ====================

    /**
     * 创建播放队列
     * 优先调用 Emby 播放队列 API，如果不支持则使用本地队列模拟
     */
    async createPlayQueue(items: EmbyItem[], startIndex: number = 0): Promise<PlayQueue> {
        const now = Date.now();
        const queueId = `local_queue_${now}`;

        // 构建队列项
        const queueItems: PlayQueueItem[] = items.map((item, index) => ({
            id: `queue_item_${now}_${index}`,
            item: item,
            addedAt: now
        }));

        // 尝试调用 Emby 播放队列 API
        try {
            const itemIds = items.map(item => item.Id).join(',');
            const response = await fetch(
                `${this.getCleanUrl()}/Playlists?Name=EmbyTokQueue&UserId=${this.config.userId}&Ids=${itemIds}`,
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.Id) {
                    return {
                        id: data.Id,
                        name: 'EmbyTok Queue',
                        items: queueItems,
                        currentIndex: startIndex,
                        playMode: PlayMode.Sequential,
                        createdAt: now,
                        updatedAt: now
                    };
                }
            }
        } catch (e) {
            console.warn('Emby 播放队列 API 不可用，使用本地队列:', e);
        }

        // 回退到本地队列
        return {
            id: queueId,
            name: 'EmbyTok Queue',
            items: queueItems,
            currentIndex: startIndex,
            playMode: PlayMode.Sequential,
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * 添加项目到播放队列
     * 由于 Emby 没有标准的播放队列添加 API，使用本地模拟
     */
    async addToPlayQueue(queueId: string, items: EmbyItem[]): Promise<void> {
        // Emby 原生不支持动态修改播放队列，这里仅记录日志
        // 实际队列管理由 usePlayQueue hook 在本地完成
        console.log(`[EmbyClient] 添加 ${items.length} 个项目到队列 ${queueId}`);
    }

    /**
     * 从播放队列移除项目
     */
    async removeFromPlayQueue(queueId: string, itemIds: string[]): Promise<void> {
        console.log(`[EmbyClient] 从队列 ${queueId} 移除项目: ${itemIds.join(', ')}`);
    }

    /**
     * 获取剧集的下一集
     * 调用 /Shows/{seriesId}/Episodes 获取剧集列表，然后找到当前集的下一集
     */
    async getNextEpisode(seriesId: string, currentEpisodeId: string): Promise<EmbyItem | null> {
        try {
            const params = new URLSearchParams({
                SeriesId: seriesId,
                Fields: 'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                Limit: '500'
            });

            const url = `${this.getCleanUrl()}/Shows/${seriesId}/Episodes?${params.toString()}`;
            const cacheKey = `getNextEpisode:${url}`;
            
            const data = await this.requestPool.request<any>(cacheKey, async () => {
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) {
                    console.error(`获取剧集列表失败: ${response.status}`);
                    return null;
                }
                return response.json();
            });
            
            if (!data) return null;
            const episodes: any[] = data.Items || [];

            if (episodes.length === 0) {
                return null;
            }

            // 找到当前剧集的索引
            const currentIndex = episodes.findIndex((ep: any) => ep.Id === currentEpisodeId);

            if (currentIndex === -1) {
                console.warn(`未找到当前剧集 ${currentEpisodeId}`);
                return null;
            }

            // 获取下一集
            const nextIndex = currentIndex + 1;

            if (nextIndex >= episodes.length) {
                // 已是最有一集
                return null;
            }

            const nextEp = episodes[nextIndex];

            return {
                ...nextEp,
                Name: this.formatItemName(nextEp),
                UserData: nextEp.UserData ? {
                    IsFavorite: nextEp.UserData.IsFavorite || false,
                    PlaybackPositionTicks: nextEp.UserData.PlaybackPositionTicks || 0,
                    PlayCount: nextEp.UserData.PlayCount || 0,
                    Played: nextEp.UserData.Played || false,
                    LastPlayedDate: nextEp.UserData.LastPlayedDate
                } : undefined
            };
        } catch (error) {
            console.error('获取下一集失败:', error);
            return null;
        }
    }

    /**
     * 获取播放队列
     * Emby 原生不支持获取外部创建的播放队列，返回本地模拟队列
     */
    async getPlayQueue(queueId: string): Promise<PlayQueue> {
        // 由于 Emby 不存储本地队列，返回空队列
        return {
            id: queueId,
            name: 'EmbyTok Queue',
            items: [],
            currentIndex: 0,
            playMode: PlayMode.Sequential,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    // ==================== 批量数据获取优化 ====================

    /**
     * 批量获取视频详情
     * 使用请求池进行去重和缓存，限制最大并发数
     * @param ids - 视频 ID 数组
     * @returns 视频详情数组（顺序与输入 ID 顺序一致）
     */
    async batchGetVideoDetails(ids: string[]): Promise<EmbyItem[]> {
        if (ids.length === 0) {
            return [];
        }

        // 去重
        const uniqueIds = Array.from(new Set(ids));
        
        // 构建请求列表
        const requests = uniqueIds.map((id) => ({
            key: `batchGetVideoDetails:${id}`,
            fetcher: async () => {
                const params = new URLSearchParams({
                    Fields: 'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type,BasicSyncInfo,ProductionYear'
                });
                const url = `${this.getCleanUrl()}/Users/${this.config.userId}/Items/${id}?${params.toString()}`;
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) return null;
                const data = await response.json();
                return {
                    ...data,
                    Name: this.formatItemName(data),
                    UserData: data.UserData ? {
                        IsFavorite: data.UserData.IsFavorite || false,
                        PlaybackPositionTicks: data.UserData.PlaybackPositionTicks || 0,
                        PlayCount: data.UserData.PlayCount || 0,
                        Played: data.UserData.Played || false,
                        LastPlayedDate: data.UserData.LastPlayedDate
                    } : undefined
                } as EmbyItem;
            }
        }));

        // 使用请求池的批量去重方法执行
        const results = await this.requestPool.batchWithDeduplication<EmbyItem | null>(requests);
        
        // 过滤掉 null 结果并保持原始顺序
        const resultMap = new Map<string, EmbyItem>();
        uniqueIds.forEach((id, index) => {
            if (results[index]) {
                resultMap.set(id, results[index]!);
            }
        });
        
        return ids.map((id) => resultMap.get(id)!).filter(Boolean);
    }

    /**
     * 批量获取图片标签
     * 用于预加载多个视频的封面信息
     * @param ids - 视频 ID 数组
     * @returns ID 到图片标签的映射
     */
    async batchGetImageTags(ids: string[]): Promise<Map<string, { Primary?: string; Backdrop?: string }>> {
        if (ids.length === 0) {
            return new Map();
        }

        const uniqueIds = Array.from(new Set(ids));
        
        const requests = uniqueIds.map((id) => ({
            key: `batchGetImageTags:${id}`,
            fetcher: async () => {
                const url = `${this.getCleanUrl()}/Items/${id}?Fields=ImageTags`;
                const response = await fetch(url, { headers: this.getHeaders() });
                if (!response.ok) return { id, tags: null };
                const data = await response.json();
                return { id, tags: data.ImageTags || null };
            }
        }));

        const results = await this.requestPool.batchWithDeduplication<{ id: string; tags: { Primary?: string; Backdrop?: string } | null }>(requests);
        
        const tagMap = new Map<string, { Primary?: string; Backdrop?: string }>();
        results.forEach((result) => {
            if (result && result.tags) {
                tagMap.set(result.id, result.tags);
            }
        });
        
        return tagMap;
    }
}

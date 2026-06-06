
import { MediaClient } from './MediaClient';
import { EmbyItem, EmbyLibrary, FeedType, ServerConfig, VideoResponse, OrientationMode, SubtitleTrack, RecommendationCategory, WatchedHistoryItem, PlayQueue, PlayQueueItem, PlayMode } from '../types';

export class PlexClient extends MediaClient {
    
    private getCleanUrl() {
        return this.config.url.replace(/\/$/, "");
    }

    private getHeaders() {
        return {
            'Accept': 'application/json',
            'X-Plex-Token': this.config.token
        };
    }

    private async getMachineIdentifier(): Promise<string> {
        if (this.config.userId && this.config.userId !== '1') return this.config.userId;
        try {
            const response = await fetch(`${this.getCleanUrl()}/identity`, { headers: this.getHeaders() });
            if (response.ok) {
                const data = await response.json();
                return data.MediaContainer.machineIdentifier || data.MediaContainer.MachineIdentifier || '1';
            }
        } catch (e) {
            // Ignore fetch errors
        }
        return '1';
    }

    async authenticate(username: string, password: string): Promise<ServerConfig> {
        const token = password; 
        const response = await fetch(`${this.getCleanUrl()}/identity`, {
            headers: { 'Accept': 'application/json', 'X-Plex-Token': token }
        });
        if (!response.ok) throw new Error('Plex Connection Failed');
        const data = await response.json();
        const machineIdentifier = data.MediaContainer.machineIdentifier || data.MediaContainer.MachineIdentifier;
        return { url: this.config.url, username: username || 'Plex User', userId: machineIdentifier || '1', token: token, serverType: 'plex' };
    }

    async getLibraries(): Promise<EmbyLibrary[]> {
        const response = await fetch(`${this.getCleanUrl()}/library/sections`, { headers: this.getHeaders() });
        const data = await response.json();
        return data.MediaContainer.Directory.map((d: any) => ({ 
            Id: d.key, 
            Name: d.title, 
            CollectionType: d.type 
        }));
    }

    async getResumeItems(): Promise<EmbyItem[]> {
        try {
            const response = await fetch(`${this.getCleanUrl()}/library/onDeck`, { headers: this.getHeaders() });
            const data = await response.json();
            return this.mapPlexItems(data.MediaContainer.Metadata || []).slice(0, 12);
        } catch (e) {
            return [];
        }
    }

    private filterItems(items: EmbyItem[], mode: OrientationMode): EmbyItem[] {
        if (mode === 'both') return items;
        return items.filter(item => {
            const type = (item.Type || '').toLowerCase();
            const isNavFolder = ['show', 'season', 'folder'].includes(type);
            if (isNavFolder) return true;

            const w = item.Width || 0;
            const h = item.Height || 0;
            if (w === 0) return true; 
            if (mode === 'vertical') return h >= w * 0.8; 
            return w > h;
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
        
        if (feedType === 'favorites') {
            const playlist = await this.findPlaylist(libraryName);
            if (!playlist) return { items: [], nextStartIndex: 0, totalCount: 0 };
            const response = await fetch(`${this.getCleanUrl()}/playlists/${playlist.ratingKey}/items?X-Plex-Container-Start=0&X-Plex-Container-Size=2000`, { headers: this.getHeaders() });
            const data = await response.json();
            const mappedItems = this.mapPlexItems(data.MediaContainer.Metadata || []);
            const filtered = this.filterItems(mappedItems, orientationMode);
            const reversed = filtered.reverse();
            return { items: reversed.slice(skip, skip + limit), nextStartIndex: skip + limit, totalCount: reversed.length };
        }

        let url: string;
        const isLibraryRoot = navParentId === undefined || (library && navParentId === library.Id);

        if (!isLibraryRoot && navParentId) {
            url = `${this.getCleanUrl()}/library/metadata/${navParentId}/children?X-Plex-Container-Start=${skip}&X-Plex-Container-Size=${limit}`;
        } else {
            const sectionId = navParentId || library?.Id;
            if (!sectionId && includeIds) {
                url = `${this.getCleanUrl()}/library/sections/${includeIds.split(',')[0]}/all?X-Plex-Container-Start=${skip}&X-Plex-Container-Size=${limit}`;
            } else if (!sectionId) {
                return { items: [], nextStartIndex: 0, totalCount: 0 };
            } else {
                let sort = 'addedAt:desc';
                if (feedType === 'random') sort = 'random';
                url = `${this.getCleanUrl()}/library/sections/${sectionId}/all?sort=${sort}&X-Plex-Container-Start=${skip}&X-Plex-Container-Size=${limit}`;
            }
        }

        const response = await fetch(url, { headers: this.getHeaders() });
        const data = await response.json();
        const items = data.MediaContainer.Metadata || [];
        const mappedItems = this.mapPlexItems(items);
        const filtered = this.filterItems(mappedItems, orientationMode);
        
        return { 
            items: filtered, 
            nextStartIndex: skip + items.length, 
            totalCount: data.MediaContainer.totalSize || data.MediaContainer.size || 0 
        };
    }

    private mapPlexItems(items: any[]): EmbyItem[] {
        return items.map((p: any) => {
             const media = p.Media?.[0];
             let formattedName = p.title;
             
             if (p.type === 'episode') {
                 const idx = p.index !== undefined ? String(p.index).padStart(2, '0') : '--';
                 formattedName = `${idx}. ${p.title}`;
             }

             return { 
                Id: p.ratingKey, 
                Name: formattedName, 
                Type: p.type, 
                MediaType: 'Video', 
                Overview: p.summary, 
                ProductionYear: p.year, 
                Width: media?.width, 
                Height: media?.height, 
                RunTimeTicks: p.duration ? p.duration * 10000 : undefined, 
                ImageTags: { Primary: p.thumb ? 'true' : undefined }, 
                UserData: {
                    IsFavorite: false,
                    PlayCount: p.viewCount || 0,
                    Played: (p.viewCount || 0) > 0,
                    PlaybackPositionTicks: p.viewOffset ? p.viewOffset * 10000 : 0,
                    LastPlayedDate: p.lastViewedAt ? new Date(p.lastViewedAt * 1000).toISOString() : undefined
                },
                _PlexThumb: p.thumb, 
                _PlexKey: media?.Part?.[0]?.key 
             };
        });
    }

    getVideoUrl(item: EmbyItem): string {
        const plexItem = item as any;
        if (plexItem._PlexKey) return `${this.getCleanUrl()}${plexItem._PlexKey}?X-Plex-Token=${this.config.token}`;
        return `${this.getCleanUrl()}/video/:/transcode/universal/start?path=${encodeURIComponent('/library/metadata/' + item.Id)}&mediaIndex=0&partIndex=0&protocol=hls&offset=0&fastSeek=1&directPlay=0&directStream=1&subtitleSize=100&audioBoost=100&X-Plex-Token=${this.config.token}`;
    }

    getImageUrl(itemId: string, tag?: string, type?: 'Primary' | 'Backdrop'): string {
        return `${this.getCleanUrl()}/photo/:/transcode?url=${encodeURIComponent(`/library/metadata/${itemId}/thumb`)}&width=800&height=1200&X-Plex-Token=${this.config.token}`;
    }

    private async findPlaylist(libraryName: string): Promise<any | null> {
        const title = `Tok-${libraryName}`;
        try {
            const response = await fetch(`${this.getCleanUrl()}/playlists?title=${encodeURIComponent(title)}`, { headers: this.getHeaders() });
            const data = await response.json();
            return data.MediaContainer.Metadata?.find((p: any) => p.title === title) || null;
        } catch (e) { return null; }
    }

    async getFavorites(libraryName: string): Promise<Set<string>> {
        const playlist = await this.findPlaylist(libraryName);
        if (!playlist) return new Set();
        try {
            const response = await fetch(`${this.getCleanUrl()}/playlists/${playlist.ratingKey}/items?X-Plex-Container-Size=2000`, { headers: this.getHeaders() });
            const data = await response.json();
            return new Set((data.MediaContainer.Metadata || []).map((i: any) => i.ratingKey));
        } catch (e) { return new Set(); }
    }

    async toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void> {
        const playlist = await this.findPlaylist(libraryName);
        const machineId = await this.getMachineIdentifier();
        const itemUri = `server://${machineId}/com.plexapp.plugins.library/library/metadata/${itemId}`;
        if (isFavorite) {
            if (!playlist) return;
            const itemsRes = await fetch(`${this.getCleanUrl()}/playlists/${playlist.ratingKey}/items?X-Plex-Container-Size=2000`, { headers: this.getHeaders() });
            const entry = (await itemsRes.json()).MediaContainer.Metadata?.find((i: any) => i.ratingKey === itemId);
            if (entry?.playlistItemID) {
                await fetch(`${this.getCleanUrl()}/playlists/${playlist.ratingKey}/items/${entry.playlistItemID}?X-Plex-Token=${this.config.token}`, { method: 'DELETE', headers: this.getHeaders() });
            }
        } else {
            if (playlist) {
                await fetch(`${this.getCleanUrl()}/playlists/${playlist.ratingKey}/items?uri=${encodeURIComponent(itemUri)}&X-Plex-Token=${this.config.token}`, { method: 'PUT', headers: this.getHeaders() });
            } else {
                await fetch(`${this.getCleanUrl()}/playlists?type=video&title=${encodeURIComponent(`Tok-${libraryName}`)}&smart=0&uri=${encodeURIComponent(itemUri)}&X-Plex-Token=${this.config.token}`, { method: 'POST', headers: this.getHeaders() });
            }
        }
    }

    async deleteItem(itemId: string): Promise<void> {
        throw new Error('Plex does not support delete functionality');
    }

    async searchItems(query: string): Promise<EmbyItem[]> {
        try {
            const response = await fetch(`${this.getCleanUrl()}/search?query=${encodeURIComponent(query)}`, { 
                headers: this.getHeaders() 
            });
            
            const data = await response.json();
            const items = data.MediaContainer?.Metadata || [];
            const videoItems = items.filter((item: any) => 
                ['movie', 'episode', 'show', 'video'].includes(item.type)
            );
            
            return this.mapPlexItems(videoItems);
        } catch (error) {
            console.error('Plex search failed:', error);
            return [];
        }
    }

    async getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]> {
        try {
            const response = await fetch(`${this.getCleanUrl()}/library/metadata/${itemId}`, { 
                headers: this.getHeaders() 
            });
            
            const data = await response.json();
            const metadata = data.MediaContainer?.Metadata?.[0];
            const subtitleTracks: SubtitleTrack[] = [];
            
            if (metadata?.Media) {
                metadata.Media.forEach((media: any) => {
                    if (media.Part) {
                        media.Part.forEach((part: any) => {
                            if (part.Stream) {
                                part.Stream
                                    .filter((stream: any) => stream.streamType === 3) // 3 = subtitle
                                    .forEach((stream: any) => {
                                        let url: string | undefined;
                                        if (stream.key) {
                                            url = `${this.getCleanUrl()}${stream.key}?X-Plex-Token=${this.config.token}`;
                                        }
                                        
                                        subtitleTracks.push({
                                            id: `${itemId}_${stream.id}`,
                                            label: stream.displayTitle || stream.languageCode || `字幕 ${subtitleTracks.length + 1}`,
                                            language: stream.languageCode || 'und',
                                            isDefault: stream.default || false,
                                            codec: stream.codec,
                                            isExternal: false,
                                            url
                                        });
                                    });
                            }
                        });
                    }
                });
            }
            
            return subtitleTracks;
        } catch (error) {
            console.error('Failed to get subtitle tracks:', error);
            return [];
        }
    }

    /**
     * Plex 暂不支持 Recommendations API
     * 返回空数组
     */
    async getRecommendations(): Promise<RecommendationCategory[]> {
        // Plex API 不提供与 Emby 相同的推荐功能
        return [];
    }

    /**
     * Plex 暂不支持播放进度同步到服务器
     * @param itemId 媒体项ID
     * @param positionTicks 播放位置
     */
    async updatePlaybackProgress(itemId: string, positionTicks: number): Promise<void> {
        // Plex 不支持此功能，保持本地状态
        console.warn('Plex 不支持远程播放进度同步');
    }

    /**
     * Plex 暂不支持用户评分
     * @param itemId 媒体项ID
     * @param rating 评分（0-10）
     */
    async updateUserRating(itemId: string, rating: number): Promise<void> {
        // Plex 不支持此功能
        console.warn('Plex 不支持用户评分同步');
    }

    /**
     * Plex 获取观影历史
     * 通过已观看的媒体获取历史记录
     * @param limit 返回记录数量限制
     */
    async getWatchedHistory(limit: number = 50): Promise<WatchedHistoryItem[]> {
        try {
            // Plex 使用 /library/allLeaves?viewedAt=1 获取已观看项目
            const response = await fetch(
                `${this.getCleanUrl()}/library/all?type=4&viewedAt=1&X-Plex-Container-Start=0&X-Plex-Container-Size=${limit}`,
                { headers: this.getHeaders() }
            );
            
            const data = await response.json();
            const items = data.MediaContainer?.Metadata || [];
            
            return items.map((item: any) => ({
                id: item.ratingKey,
                itemId: item.ratingKey,
                name: item.title || '未命名',
                type: item.type,
                mediaType: 'Video',
                overview: item.summary,
                productionYear: item.year,
                width: item.Media?.[0]?.width,
                height: item.Media?.[0]?.height,
                runTimeTicks: item.duration ? item.duration * 10000 : 0,
                playbackPositionTicks: item.viewOffset ? item.viewOffset * 10000 : 0,
                playCount: item.viewCount || 0,
                played: (item.viewCount || 0) > 0,
                lastPlayedDate: item.lastViewedAt ? new Date(item.lastViewedAt * 1000).toISOString() : undefined,
                isFavorite: false
            }));
        } catch (error) {
            console.error('获取观影历史失败:', error);
            return [];
        }
    }

    /**
     * Plex 标记为已观看（不支持远程同步）
     * @param itemId 媒体项ID
     */
    async markAsWatched(itemId: string): Promise<void> {
        // Plex 不支持远程标记已观看
        console.warn('Plex 不支持远程标记已观看');
    }

    /**
     * Plex 标记为未观看（不支持远程同步）
     * @param itemId 媒体项ID
     */
    async markAsUnwatched(itemId: string): Promise<void> {
        // Plex 不支持远程标记未观看
        console.warn('Plex 不支持远程标记未观看');
    }

    // ==================== 播放队列相关实现 ====================

    /**
     * 创建播放队列
     * Plex 不支持播放队列 API，使用本地队列模拟
     */
    async createPlayQueue(items: EmbyItem[], startIndex: number = 0): Promise<PlayQueue> {
        const now = Date.now();
        const queueId = `local_queue_${now}`;

        const queueItems: PlayQueueItem[] = items.map((item, index) => ({
            id: `queue_item_${now}_${index}`,
            item: item,
            addedAt: now
        }));

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
     */
    async addToPlayQueue(queueId: string, items: EmbyItem[]): Promise<void> {
        console.log(`[PlexClient] 添加 ${items.length} 个项目到队列 ${queueId}`);
    }

    /**
     * 从播放队列移除项目
     */
    async removeFromPlayQueue(queueId: string, itemIds: string[]): Promise<void> {
        console.log(`[PlexClient] 从队列 ${queueId} 移除项目: ${itemIds.join(', ')}`);
    }

    /**
     * 获取剧集的下一集
     * 调用 Plex 的 /shows/{ratingKey}/allLeaves 获取剧集列表
     */
    async getNextEpisode(seriesId: string, currentEpisodeId: string): Promise<EmbyItem | null> {
        try {
            const response = await fetch(
                `${this.getCleanUrl()}/shows/${seriesId}/allLeaves?X-Plex-Container-Start=0&X-Plex-Container-Size=500`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                console.error(`获取剧集列表失败: ${response.status}`);
                return null;
            }

            const data = await response.json();
            const episodes = data.MediaContainer?.Metadata || [];

            if (episodes.length === 0) {
                return null;
            }

            // 找到当前剧集的索引
            const currentIndex = episodes.findIndex((ep: any) => ep.ratingKey === currentEpisodeId);

            if (currentIndex === -1) {
                console.warn(`未找到当前剧集 ${currentEpisodeId}`);
                return null;
            }

            // 获取下一集
            const nextIndex = currentIndex + 1;

            if (nextIndex >= episodes.length) {
                return null;
            }

            const nextEp = episodes[nextIndex];
            const mapped = this.mapPlexItems([nextEp]);

            return mapped[0] || null;
        } catch (error) {
            console.error('获取下一集失败:', error);
            return null;
        }
    }

    /**
     * 获取播放队列
     * Plex 不支持播放队列，返回空队列
     */
    async getPlayQueue(queueId: string): Promise<PlayQueue> {
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
}

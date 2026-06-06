
import { EmbyItem, EmbyLibrary, FeedType, ServerConfig, VideoResponse, OrientationMode, SubtitleTrack, RecommendationCategory, PlaybackProgress, UserRating, WatchedHistoryItem, PlayQueue, PlayQueueItem, PlayMode } from '../types';

export abstract class MediaClient {
    config: ServerConfig;

    constructor(config: ServerConfig) {
        this.config = config;
    }

    abstract authenticate(username: string, password: string): Promise<ServerConfig>;
    
    abstract getLibraries(): Promise<EmbyLibrary[]>;
    
    // 仅新增此方法供 TV 首页使用，不改动原有收藏接口
    abstract getResumeItems(): Promise<EmbyItem[]>;

    abstract getVideos(
        parentId: string | undefined, 
        library: EmbyLibrary | null, 
        feedType: FeedType, 
        skip: number, 
        limit: number,
        orientationMode: OrientationMode,
        includeIds?: string 
    ): Promise<VideoResponse>;

    abstract getVideoUrl(item: EmbyItem): string;
    
    abstract getImageUrl(itemId: string, tag?: string, type?: 'Primary' | 'Backdrop'): string;

    // 严格保留原有的播放列表收藏逻辑
    abstract getFavorites(libraryName: string): Promise<Set<string>>;
    abstract toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>;
    
    // 删除视频方法
    abstract deleteItem(itemId: string): Promise<void>;

    // 搜索功能
    abstract searchItems(query: string): Promise<EmbyItem[]>;

    // 字幕功能
    abstract getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]>;

    // 推荐功能
    abstract getRecommendations(): Promise<RecommendationCategory[]>;

    // UserData 深度集成功能
    // 更新播放进度到服务器
    abstract updatePlaybackProgress(itemId: string, positionTicks: number): Promise<void>;
    
    // 更新用户评分（0-10分制）
    abstract updateUserRating(itemId: string, rating: number): Promise<void>;
    
    // 获取观影历史
    abstract getWatchedHistory(limit?: number): Promise<WatchedHistoryItem[]>;
    
    // 标记为已观看
    abstract markAsWatched(itemId: string): Promise<void>;
    
    // 标记为未观看
    abstract markAsUnwatched(itemId: string): Promise<void>;

    // ==================== 播放队列相关方法 ====================

    /**
     * 创建播放队列
     * @param items 队列项目列表
     * @param startIndex 起始播放索引
     */
    abstract createPlayQueue(items: EmbyItem[], startIndex?: number): Promise<PlayQueue>;

    /**
     * 添加项目到播放队列
     * @param queueId 队列ID
     * @param items 要添加的项目
     */
    abstract addToPlayQueue(queueId: string, items: EmbyItem[]): Promise<void>;

    /**
     * 从播放队列移除项目
     * @param queueId 队列ID
     * @param itemIds 要移除的项目ID列表
     */
    abstract removeFromPlayQueue(queueId: string, itemIds: string[]): Promise<void>;

    /**
     * 获取剧集的下一集
     * @param seriesId 剧集ID
     * @param currentEpisodeId 当前剧集ID
     * @returns 下一集信息，如果不存在返回null
     */
    abstract getNextEpisode(seriesId: string, currentEpisodeId: string): Promise<EmbyItem | null>;

    /**
     * 获取播放队列
     * @param queueId 队列ID
     */
    abstract getPlayQueue(queueId: string): Promise<PlayQueue>;
}

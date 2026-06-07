import {
  EmbyItem,
  EmbyLibrary,
  FeedType,
  ServerConfig,
  VideoResponse,
  OrientationMode,
  SubtitleTrack,
} from '../types';

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

  abstract getVideoUrl(item: EmbyItem, mode?: 'direct' | 'transcode' | 'fallback'): string;

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
}

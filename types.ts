
export type ServerType = 'emby' | 'plex';

export interface ServerConfig {
  url: string;
  username: string;
  token: string;
  userId: string;
  serverType: ServerType;
}

export interface EmbyAuthResponse {
  User: {
    Id: string;
    Name: string;
    Policy?: {
      IsAdministrator: boolean;
    };
  };
  AccessToken: string;
  ServerId: string;
}

export interface EmbyLibrary {
  Id: string;
  Name: string;
  CollectionType?: string;
}

export interface MediaSource {
  Id: string;
  Container: string;
  Path: string;
  Protocol: string;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
}

export interface EmbyItem {
  Id: string;
  Name: string;
  Type: string;
  MediaType: string;
  Overview?: string;
  ProductionYear?: number;
  Width?: number;
  Height?: number;
  RunTimeTicks?: number;
  MediaSources?: MediaSource[];
  ImageTags?: {
    Primary?: string;
    Logo?: string;
    Thumb?: string;
    Backdrop?: string;
  };
  UserData?: {
    IsFavorite: boolean;
    PlaybackPositionTicks: number;
    PlayCount: number;
    Played: boolean;
    LastPlayedDate?: string;
  };
  /** Internal key used by Plex to store the media part path */
  _PlexKey?: string;
}

export type FeedType = 'latest' | 'random' | 'favorites' | 'history';

export interface WatchHistoryItem {
  id: string;
  itemId: string;
  name: string;
  imageUrl?: string;
  positionTicks: number;
  totalTicks: number;
  watchedAt: number;
  libraryId?: string;
}

export interface WatchHistory {
  items: WatchHistoryItem[];
  lastUpdated: number;
}

export interface SearchResult {
  items: EmbyItem[];
  totalRecordCount: number;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  createdAt: number;
  itemIds: string[];
}

export interface FavoritesState {
  collections: FavoriteCollection[];
  defaultCollectionId: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isDefault: boolean;
  codec?: string;
  isExternal?: boolean;
  url?: string;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  selectedTrackId?: string;
  fontSize: 'small' | 'medium' | 'large';
  textColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top';
}

export type OrientationMode = 'vertical' | 'horizontal' | 'both';

export interface VideoResponse {
    items: EmbyItem[];
    nextStartIndex: number;
    totalCount: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  release?: GitHubRelease;
}

// Playback Experience Types
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0;

export interface PlaybackSpeedOption {
  value: PlaybackSpeed;
  label: string;
}

export interface BufferingState {
  isBuffering: boolean;
  bufferedPercent: number;
  waitingForData: boolean;
}

// Playback Progress Types
export interface PlaybackProgress {
  itemId: string;
  positionTicks: number;
  durationTicks?: number;
  mediaRate?: number;
}

// User Rating Types (0-10分制，内部自动转换为Emby的0-100)
export interface UserRating {
  itemId: string;
  rating: number; // 0-10
  type?: 'manual' | 'predicted';
}

// Enhanced Watched History Item for API responses
export interface WatchedHistoryItem {
  id: string;
  itemId: string;
  name: string;
  type: string;
  mediaType: string;
  overview?: string;
  productionYear?: number;
  width?: number;
  height?: number;
  runTimeTicks?: number;
  imageUrl?: string;
  playbackPositionTicks: number;
  playCount: number;
  played: boolean;
  lastPlayedDate?: string;
  isFavorite: boolean;
}

export interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  onSeek: (time: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  showTime?: boolean;
  language?: 'zh' | 'en';
}

export interface SpeedControlPanelProps {
  currentSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onClose: () => void;
  language?: 'zh' | 'en';
}

export interface GestureControlsOptions {
  togglePlay: () => void;
  onDoubleTap?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  longPressDelay?: number;
}

// Recommendations API 类型
export type RecommendationType = 
  | 'SimilarToRecentlyWatched'    // 因为您喜欢
  | 'SimilarToCurrentlyPlayed'    // 相似于当前播放
  | 'SimilarToLikedItem'          // 相似于喜欢的项目
  | 'DirectorRelated'            // 同导演
  | 'ActorRelated'                // 同演员
  | 'ContinueWatching'           // 继续观看
  | 'Upcoming';                  // 即将上线

export interface Recommendation {
  Id: string;
  Name: string;
  Type: string;
  MediaType: string;
  Overview?: string;
  ProductionYear?: number;
  Width?: number;
  Height?: number;
  RunTimeTicks?: number;
  ImageTags?: {
    Primary?: string;
    Logo?: string;
    Thumb?: string;
    Backdrop?: string;
  };
  UserData?: {
    IsFavorite: boolean;
    PlaybackPositionTicks: number;
    PlayCount: number;
    Played: boolean;
    LastPlayedDate?: string;
  };
}

export interface RecommendationCategory {
  CategoryId: string;
  CategoryTitle: string;
  RecommendationType: RecommendationType;
  Items: Recommendation[];
}

// 多用户相关类型
export interface UserProfile {
  id: string;
  name: string;
  serverUrl: string;
  username: string;
  token: string;
  serverType: ServerType;
  lastUsed: number;
}

export interface MultiUserConfig {
  users: UserProfile[];
  currentUserId: string | null;
}

// ==================== 播放队列类型 ====================

/**
 * 播放模式枚举
 */
export enum PlayMode {
  Sequential = 'sequential',   // 顺序播放
  Shuffle = 'shuffle',          // 随机播放
  LoopSingle = 'loop_single',   // 单曲循环
  LoopAll = 'loop_all'          // 列表循环
}

/**
 * 播放队列项
 */
export interface PlayQueueItem {
  id: string;                   // 队列项唯一ID
  item: EmbyItem;               // 关联的媒体项
  addedAt: number;              // 添加时间戳
}

/**
 * 播放队列
 */
export interface PlayQueue {
  id: string;                   // 队列唯一ID
  name?: string;                // 队列名称
  items: PlayQueueItem[];       // 队列中的项目
  currentIndex: number;         // 当前播放索引
  playMode: PlayMode;           // 播放模式
  createdAt: number;            // 创建时间
  updatedAt: number;            // 更新时间
}

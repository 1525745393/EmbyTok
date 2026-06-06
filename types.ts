
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

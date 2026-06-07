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

export interface MediaStream {
  Type: string;
  Codec?: string;
  Language?: string;
  DisplayTitle?: string;
  IsDefault?: boolean;
  IsExternal?: boolean;
  Index?: number;
  Path?: string;
}

export interface MediaSource {
  Id: string;
  Container: string;
  Path: string;
  Protocol: string;
  Name?: string;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  MediaStreams?: MediaStream[];
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
  SeriesName?: string;
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

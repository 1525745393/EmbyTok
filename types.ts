
import type { LucideIcon } from 'lucide-react';

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

export interface EmbyImageTags {
  Primary?: string;
  Logo?: string;
  Thumb?: string;
  Backdrop?: string;
}

export interface EmbyUserData {
  IsFavorite: boolean;
  PlaybackPositionTicks: number;
  PlayCount: number;
  Played: boolean;
  LastPlayedDate?: string;
}

export interface MediaSource {
  Id: string;
  Container: string;
  Path: string;
  Protocol: string;
}

export interface EmbyLibrary {
  Id: string;
  Name: string;
  CollectionType?: string;
  ImageTags?: EmbyImageTags;
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
  ImageTags?: EmbyImageTags;
  UserData?: EmbyUserData;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  SeriesName?: string;
  /** Internal key used by Plex to store the media part path */
  _PlexKey?: string;
  /** Internal key used by Plex to store the thumbnail path */
  _PlexThumb?: string;
  /** Playlist item ID for Emby */
  PlaylistItemId?: string;
}

export interface EmbyItemsResponse {
  Items?: EmbyItem[];
  TotalRecordCount?: number;
}

export interface EmbyPlaylistResponse {
  Id: string;
}

export type FeedType = 'latest' | 'random' | 'favorites';

export type OrientationMode = 'vertical' | 'horizontal' | 'both';

export interface VideoResponse {
  items: EmbyItem[];
  nextStartIndex: number;
  totalCount: number;
}

/**
 * Plex-specific types
 */
export interface PlexMediaContainer {
  machineIdentifier?: string;
  MachineIdentifier?: string;
  totalSize?: number;
  size?: number;
  Directory?: PlexLibraryDirectory[];
  Metadata?: PlexMetadata[];
}

export interface PlexResponse {
  MediaContainer: PlexMediaContainer;
}

export interface PlexLibraryDirectory {
  key: string;
  title: string;
  type: string;
}

export interface PlexMediaPart {
  key: string;
}

export interface PlexMedia {
  width?: number;
  height?: number;
  Part?: PlexMediaPart[];
}

export interface PlexMetadata {
  ratingKey: string;
  title: string;
  type: string;
  summary?: string;
  year?: number;
  duration?: number;
  thumb?: string;
  viewCount?: number;
  viewOffset?: number;
  lastViewedAt?: number;
  index?: number;
  Media?: PlexMedia[];
  playlistItemID?: string;
}

export interface PlexPlaylist extends PlexMetadata {
  ratingKey: string;
}

/**
 * Icon component type
 */
export type IconComponent = LucideIcon;

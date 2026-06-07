import { MediaClient } from './MediaClient';
import {
  EmbyItem,
  EmbyLibrary,
  FeedType,
  ServerConfig,
  VideoResponse,
  OrientationMode,
  SubtitleTrack,
} from '../types';
import { getDeviceId } from '../utils/device';

const DEVICE_ID = getDeviceId();

export class EmbyClient extends MediaClient {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="EmbyTok Web", Device="Web Browser", DeviceId="${DEVICE_ID}", Version="1.0.0", Token="${this.config.token}"`,
      'X-Emby-Token': this.config.token,
      'X-MediaBrowser-Token': this.config.token,
    };
  }

  private getCleanUrl() {
    return this.config.url.replace(/\/$/, '');
  }

  async authenticate(username: string, password: string): Promise<ServerConfig> {
    const response = await fetch(`${this.getCleanUrl()}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ Username: username, Pw: password }),
    });
    if (!response.ok) throw new Error('Emby Authentication failed');
    const data = await response.json();
    return {
      url: this.config.url,
      username: data.User.Name,
      userId: data.User.Id,
      token: data.AccessToken,
      serverType: 'emby',
    };
  }

  async getLibraries(): Promise<EmbyLibrary[]> {
    const response = await fetch(`${this.getCleanUrl()}/Users/${this.config.userId}/Views`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
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
      Limit: '12',
    });
    const response = await fetch(
      `${this.getCleanUrl()}/Users/${this.config.userId}/Items/Resume?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    const data = await response.json();
    return (data.Items || []).map((i: any) => ({ ...i, Name: this.formatItemName(i) }));
  }

  private formatItemName(item: any): string {
    if (item.Type === 'Episode') {
      const index =
        item.IndexNumber !== undefined ? String(item.IndexNumber).padStart(2, '0') : '--';
      const season =
        item.ParentIndexNumber !== undefined
          ? `S${String(item.ParentIndexNumber).padStart(2, '0')}`
          : '';
      return `${season}E${index}. ${item.Name}`;
    }
    return item.Name || '未命名';
  }

  private applyOrientationFilter(items: any[], mode: OrientationMode): any[] {
    if (mode === 'both') return items;
    return items.filter((item) => {
      const isNavFolder = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet'].includes(
        item.Type
      );
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
    const libraryName = library ? library.Name : '收藏';

    // 严格遵循 backup 中的 Playlist 逻辑
    if (feedType === 'favorites') {
      const playlistItems = await this.getTokPlaylistItemsInternal(libraryName);
      const filtered = this.applyOrientationFilter(playlistItems, orientationMode);
      const paged = filtered.reverse().slice(skip, skip + limit);
      return { items: paged, nextStartIndex: skip + limit, totalCount: filtered.length };
    }

    const params = new URLSearchParams({
      Fields:
        'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
      Limit: (limit * 2).toString(),
      StartIndex: skip.toString(),
      EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      _t: Date.now().toString(),
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

    const response = await fetch(
      `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    const data = await response.json();
    const rawItems = data.Items || [];
    const filteredItems = this.applyOrientationFilter(rawItems, orientationMode);

    const items = filteredItems.map((item: any) => ({
      ...item,
      Name: this.formatItemName(item),
      UserData: item.UserData
        ? {
            ...item.UserData,
            Played: item.UserData.Played || false,
            PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
            LastPlayedDate: item.UserData.LastPlayedDate,
          }
        : undefined,
    }));

    return {
      items,
      nextStartIndex: skip + rawItems.length,
      totalCount: data.TotalRecordCount || 0,
    };
  }

  getVideoUrl(item: EmbyItem, mode: 'direct' | 'transcode' | 'fallback' = 'direct'): string {
    const playSessionId = Date.now();
    const baseUrl = this.getCleanUrl();

    if (mode === 'direct' && item.MediaSources && item.MediaSources.length > 0) {
      // 直接播放模式：优先从MediaSources中找到可以直接播放的媒体源
      const directSource = item.MediaSources.find((m) => m.SupportsDirectPlay && m.Path);
      if (directSource) {
        return `${baseUrl}/Videos/${item.Id}/stream?Static=true&MediaSourceId=${directSource.Id}&PlaySessionId=${playSessionId}&api_key=${this.config.token}`;
      }

      // 如果没有找到直接播放源，也尝试直接流
      return `${baseUrl}/Videos/${item.Id}/stream?Static=true&MediaSourceId=${item.Id}&PlaySessionId=${playSessionId}&RequireAvc=false&RequireNonAnamorphic=false&MaxWidth=3840&MaxHeight=2160&api_key=${this.config.token}`;
    }

    if (mode === 'transcode') {
      // 转码模式：让Emby服务器转码为兼容格式
      return `${baseUrl}/Videos/${item.Id}/master.m3u8?MediaSourceId=${item.Id}&PlaySessionId=${playSessionId}&VideoCodec=h264&AudioCodec=aac&MaxWidth=1920&MaxHeight=1080&VideoBitrate=4000000&AudioBitrate=192000&api_key=${this.config.token}`;
    }

    // 备用模式：更保守的转码设置
    return `${baseUrl}/Videos/${item.Id}/stream?MediaSourceId=${item.Id}&PlaySessionId=${playSessionId}&VideoCodec=h264&AudioCodec=aac&MaxWidth=1280&MaxHeight=720&VideoBitrate=2000000&AudioBitrate=128000&api_key=${this.config.token}`;
  }

  getImageUrl(itemId: string, tag?: string, type: 'Primary' | 'Backdrop' = 'Primary'): string {
    if (!tag) return '';
    // 补全 api_key 确保 TV 端加载正常
    return `${this.getCleanUrl()}/Items/${itemId}/Images/${type}?maxWidth=800&tag=${tag}&quality=90&api_key=${this.config.token}`;
  }

  // --- 恢复 Playlist 原始实现 ---
  private async getTokPlaylistId(libraryName: string): Promise<string> {
    const playlistName = `Tok-${libraryName}`;
    const searchRes = await fetch(
      `${this.getCleanUrl()}/Users/${this.config.userId}/Items?IncludeItemTypes=Playlist&Recursive=true`,
      { headers: this.getHeaders() }
    );
    const searchData = await searchRes.json();
    const existing = searchData.Items?.find((i: any) => i.Name === playlistName);
    if (existing) return existing.Id;
    const createRes = await fetch(
      `${this.getCleanUrl()}/Playlists?Name=${playlistName}&UserId=${this.config.userId}`,
      { method: 'POST', headers: this.getHeaders() }
    );
    const createData = await createRes.json();
    return createData.Id;
  }

  private async getTokPlaylistItemsInternal(libraryName: string): Promise<EmbyItem[]> {
    try {
      const pid = await this.getTokPlaylistId(libraryName);
      const response = await fetch(
        `${this.getCleanUrl()}/Playlists/${pid}/Items?UserId=${this.config.userId}&Fields=MediaSources,Width,Height,Overview,UserData`,
        { headers: this.getHeaders() }
      );
      const data = await response.json();
      return data.Items || [];
    } catch (e) {
      return [];
    }
  }

  async getFavorites(libraryName: string): Promise<Set<string>> {
    const items = await this.getTokPlaylistItemsInternal(libraryName);
    return new Set(items.map((i) => i.Id));
  }

  async toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void> {
    const pid = await this.getTokPlaylistId(libraryName);
    if (!isFavorite) {
      await fetch(
        `${this.getCleanUrl()}/Playlists/${pid}/Items?Ids=${itemId}&UserId=${this.config.userId}`,
        { method: 'POST', headers: this.getHeaders() }
      );
    } else {
      const itemsRes = await fetch(
        `${this.getCleanUrl()}/Playlists/${pid}/Items?UserId=${this.config.userId}`,
        { headers: this.getHeaders() }
      );
      const entry = (await itemsRes.json()).Items.find((i: any) => i.Id === itemId);
      if (entry?.PlaylistItemId) {
        await fetch(
          `${this.getCleanUrl()}/Playlists/${pid}/Items?EntryIds=${entry.PlaylistItemId}`,
          { method: 'DELETE', headers: this.getHeaders() }
        );
      }
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    const response = await fetch(
      `${this.getCleanUrl()}/Items/${itemId}?api_key=${this.config.token}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.status}`);
    }
  }

  async searchItems(query: string): Promise<EmbyItem[]> {
    const params = new URLSearchParams({
      SearchTerm: query,
      IncludeItemTypes: 'Movie,Video,Episode,Series',
      Recursive: 'true',
      Fields:
        'MediaSources,Width,Height,Overview,UserData,SeriesName,ParentIndexNumber,IndexNumber,Type',
      Limit: '50',
    });

    const response = await fetch(
      `${this.getCleanUrl()}/Users/${this.config.userId}/Items?${params.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    const data = await response.json();
    return (data.Items || []).map((item: any) => ({
      ...item,
      Name: this.formatItemName(item),
      UserData: item.UserData
        ? {
            ...item.UserData,
            Played: item.UserData.Played || false,
            PlaybackPositionTicks: item.UserData.PlaybackPositionTicks || 0,
            LastPlayedDate: item.UserData.LastPlayedDate,
          }
        : undefined,
    }));
  }

  async getSubtitleTracks(itemId: string): Promise<SubtitleTrack[]> {
    try {
      const params = new URLSearchParams({
        Fields: 'MediaSources',
      });

      const response = await fetch(
        `${this.getCleanUrl()}/Users/${this.config.userId}/Items/${itemId}?${params.toString()}`,
        {
          headers: this.getHeaders(),
        }
      );

      const data = await response.json();
      const mediaSources = data.MediaSources || [];

      const subtitleTracks: SubtitleTrack[] = [];
      mediaSources.forEach((source: any) => {
        if (source.MediaStreams) {
          source.MediaStreams.filter((stream: any) => stream.Type === 'Subtitle').forEach(
            (stream: any) => {
              let url: string | undefined;
              if (stream.IsExternal && stream.Path) {
                url = `${this.getCleanUrl()}/Videos/${itemId}/${stream.Index}/Stream?api_key=${this.config.token}`;
              } else if (stream.Codec === 'srt' || stream.Codec === 'vtt') {
                url = `${this.getCleanUrl()}/Videos/${itemId}/${stream.Index}/Stream?api_key=${this.config.token}`;
              }

              subtitleTracks.push({
                id: `${itemId}_${stream.Index}`,
                label:
                  stream.DisplayTitle || stream.Language || `字幕 ${subtitleTracks.length + 1}`,
                language: stream.Language || 'und',
                isDefault: stream.IsDefault || false,
                codec: stream.Codec,
                isExternal: stream.IsExternal || false,
                url,
              });
            }
          );
        }
      });

      return subtitleTracks;
    } catch (error) {
      console.error('Failed to get subtitle tracks:', error);
      return [];
    }
  }
}

import { MediaClient } from './MediaClient';
import {
  EmbyItem,
  EmbyLibrary,
  FeedType,
  ServerConfig,
  VideoResponse,
  OrientationMode,
  EmbyItemsResponse,
  EmbyPlaylistResponse,
} from '../types';

/**
 * Emby/Jellyfin 媒体服务器客户端
 * 实现与 Emby 或 Jellyfin 服务器的交互
 */
export class EmbyClient extends MediaClient {
  /**
   * 获取请求头
   * @returns 请求头对象
   * @private
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="EmbyTok Web", Device="Web Browser", DeviceId="embytok-web-emby", Version="1.0.0", Token="${this.config.token}"`,
      'X-Emby-Token': this.config.token,
      'X-MediaBrowser-Token': this.config.token,
    };
  }

  /**
   * 获取清理后的服务器 URL（去掉结尾的斜杠）
   * @returns 清理后的 URL
   * @private
   */
  private getCleanUrl() {
    return this.config.url.replace(/\/$/, '');
  }

  /**
   * 认证用户身份
   * @param username - 用户名
   * @param password - 密码
   * @returns Promise<ServerConfig> 包含认证后的服务器配置
   */
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

  /**
   * 获取媒体库列表
   * @returns Promise<EmbyLibrary[]> 媒体库数组
   */
  async getLibraries(): Promise<EmbyLibrary[]> {
    const response = await fetch(`${this.getCleanUrl()}/Users/${this.config.userId}/Views`, {
      headers: this.getHeaders(),
    });
    const data: EmbyItemsResponse = await response.json();
    return data.Items || [];
  }

  /**
   * 获取继续观看的项目（用于 TV 首页）
   * @returns Promise<EmbyItem[]> 继续观看的项目数组
   */
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
    const data: EmbyItemsResponse = await response.json();
    return (data.Items || []).map((i: EmbyItem) => ({ ...i, Name: this.formatItemName(i) }));
  }

  /**
   * 格式化项目名称
   * @param item - Emby 项目
   * @returns 格式化后的名称
   * @private
   */
  private formatItemName(item: EmbyItem): string {
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

  /**
   * 根据方向模式过滤项目
   * @param items - 项目数组
   * @param mode - 方向模式
   * @returns 过滤后的项目数组
   * @private
   */
  private applyOrientationFilter(items: EmbyItem[], mode: OrientationMode): EmbyItem[] {
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

  /**
   * 获取视频列表
   * @param navParentId - 导航父项目 ID
   * @param library - 媒体库
   * @param feedType - 类型
   * @param skip - 跳过数量
   * @param limit - 获取数量
   * @param orientationMode - 方向模式
   * @param includeIds - 包含的项目 ID（可选）
   * @returns Promise<VideoResponse> 视频响应
   */
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
    const data: EmbyItemsResponse = await response.json();
    const rawItems = data.Items || [];
    const filteredItems = this.applyOrientationFilter(rawItems, orientationMode);

    const items = filteredItems.map((item: EmbyItem) => ({
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

  /**
   * 获取视频播放链接
   * @param item - 视频项目
   * @returns 视频 URL
   */
  getVideoUrl(item: EmbyItem): string {
    return `${this.getCleanUrl()}/Videos/${item.Id}/stream.mp4?Static=true&api_key=${this.config.token}`;
  }

  /**
   * 获取图片链接
   * @param itemId - 项目 ID
   * @param tag - 图片标签
   * @param type - 图片类型
   * @returns 图片 URL
   */
  getImageUrl(itemId: string, tag?: string, type: 'Primary' | 'Backdrop' = 'Primary'): string {
    if (!tag) return '';
    return `${this.getCleanUrl()}/Items/${itemId}/Images/${type}?maxWidth=800&tag=${tag}&quality=90&api_key=${this.config.token}`;
  }

  /**
   * 获取 Tok 播放列表 ID（如果不存在则创建）
   * @param libraryName - 媒体库名称
   * @returns Promise<string> 播放列表 ID
   * @private
   */
  private async getTokPlaylistId(libraryName: string): Promise<string> {
    const playlistName = `Tok-${libraryName}`;
    const searchRes = await fetch(
      `${this.getCleanUrl()}/Users/${this.config.userId}/Items?IncludeItemTypes=Playlist&Recursive=true`,
      { headers: this.getHeaders() }
    );
    const searchData: EmbyItemsResponse = await searchRes.json();
    const existing = searchData.Items?.find((i: EmbyItem) => i.Name === playlistName);
    if (existing) return existing.Id;
    const createRes = await fetch(
      `${this.getCleanUrl()}/Playlists?Name=${playlistName}&UserId=${this.config.userId}`,
      { method: 'POST', headers: this.getHeaders() }
    );
    const createData: EmbyPlaylistResponse = await createRes.json();
    return createData.Id;
  }

  /**
   * 获取 Tok 播放列表项目（内部使用）
   * @param libraryName - 媒体库名称
   * @returns Promise<EmbyItem[]> 播放列表项目数组
   * @private
   */
  private async getTokPlaylistItemsInternal(libraryName: string): Promise<EmbyItem[]> {
    try {
      const pid = await this.getTokPlaylistId(libraryName);
      const response = await fetch(
        `${this.getCleanUrl()}/Playlists/${pid}/Items?UserId=${this.config.userId}&Fields=MediaSources,Width,Height,Overview,UserData`,
        { headers: this.getHeaders() }
      );
      const data: EmbyItemsResponse = await response.json();
      return data.Items || [];
    } catch (e) {
      console.error('[EmbyClient] Failed to get playlist items:', e);
      return [];
    }
  }

  /**
   * 获取收藏的项目 ID 列表
   * @param libraryName - 媒体库名称
   * @returns Promise<Set<string>> 收藏的项目 ID 集合
   */
  async getFavorites(libraryName: string): Promise<Set<string>> {
    const items = await this.getTokPlaylistItemsInternal(libraryName);
    return new Set(items.map((i) => i.Id));
  }

  /**
   * 切换收藏状态
   * @param itemId - 项目 ID
   * @param isFavorite - 是否收藏
   * @param libraryName - 媒体库名称
   */
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
      const data: EmbyItemsResponse = await itemsRes.json();
      const entry = data.Items?.find((i: EmbyItem) => i.Id === itemId);
      if (entry?.PlaylistItemId) {
        await fetch(
          `${this.getCleanUrl()}/Playlists/${pid}/Items?EntryIds=${entry.PlaylistItemId}`,
          { method: 'DELETE', headers: this.getHeaders() }
        );
      }
    }
  }

  /**
   * 删除项目
   * @param itemId - 项目 ID
   */
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
}

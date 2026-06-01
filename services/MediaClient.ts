import {
  EmbyItem,
  EmbyLibrary,
  FeedType,
  ServerConfig,
  VideoResponse,
  OrientationMode,
} from '../types';

/**
 * 媒体服务器客户端抽象基类
 * 定义与媒体服务器（如 Emby、Jellyfin、Plex）交互的通用接口
 */
export abstract class MediaClient {
  config: ServerConfig;

  /**
   * 构造函数
   * @param config - 服务器配置
   */
  constructor(config: ServerConfig) {
    this.config = config;
  }

  /**
   * 认证用户身份
   * @param username - 用户名
   * @param password - 密码
   * @returns Promise<ServerConfig> 包含认证后的服务器配置
   */
  abstract authenticate(username: string, password: string): Promise<ServerConfig>;

  /**
   * 获取媒体库列表
   * @returns Promise<EmbyLibrary[]> 媒体库数组
   */
  abstract getLibraries(): Promise<EmbyLibrary[]>;

  /**
   * 获取继续观看的项目（用于 TV 首页）
   * @returns Promise<EmbyItem[]> 继续观看的项目数组
   */
  abstract getResumeItems(): Promise<EmbyItem[]>;

  /**
   * 获取视频列表
   * @param parentId - 父项目 ID
   * @param library - 媒体库
   * @param feedType - 类型
   * @param skip - 跳过数量
   * @param limit - 获取数量
   * @param orientationMode - 方向模式
   * @param includeIds - 包含的项目 ID（可选）
   * @returns Promise<VideoResponse> 视频响应
   */
  abstract getVideos(
    parentId: string | undefined,
    library: EmbyLibrary | null,
    feedType: FeedType,
    skip: number,
    limit: number,
    orientationMode: OrientationMode,
    includeIds?: string
  ): Promise<VideoResponse>;

  /**
   * 获取视频播放链接
   * @param item - 视频项目
   * @returns 视频 URL
   */
  abstract getVideoUrl(item: EmbyItem): string;

  /**
   * 获取图片链接
   * @param itemId - 项目 ID
   * @param tag - 图片标签
   * @param type - 图片类型
   * @returns 图片 URL
   */
  abstract getImageUrl(itemId: string, tag?: string, type?: 'Primary' | 'Backdrop'): string;

  /**
   * 获取收藏的项目 ID 列表
   * @param libraryName - 媒体库名称
   * @returns Promise<Set<string>> 收藏的项目 ID 集合
   */
  abstract getFavorites(libraryName: string): Promise<Set<string>>;

  /**
   * 切换收藏状态
   * @param itemId - 项目 ID
   * @param isFavorite - 是否收藏
   * @param libraryName - 媒体库名称
   */
  abstract toggleFavorite(itemId: string, isFavorite: boolean, libraryName: string): Promise<void>;

  /**
   * 删除项目
   * @param itemId - 项目 ID
   */
  abstract deleteItem(itemId: string): Promise<void>;
}

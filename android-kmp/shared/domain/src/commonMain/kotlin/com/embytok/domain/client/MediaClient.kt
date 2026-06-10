package com.embytok.domain.client

import com.embytok.domain.model.*

/**
 * 媒体客户端接口（抽象基类）
 * 定义所有媒体服务器客户端必须实现的方法
 */
interface MediaClient {
    val config: ServerConfig

    /**
     * 认证登录
     * @param username 用户名（Emby 使用，Plex 可为空）
     * @param password 密码（Emby 使用，Plex 可为空）
     * @return 包含 token 的 ServerConfig
     */
    suspend fun authenticate(username: String, password: String): ServerConfig

    /**
     * 获取媒体库列表
     */
    suspend fun getLibraries(): List<EmbyLibrary>

    /**
     * 获取继续观看项（TV 首页使用）
     */
    suspend fun getResumeItems(): List<EmbyItem>

    /**
     * 获取视频列表
     * @param parentId 父目录 ID（null 表示从根目录开始）
     * @param library 当前媒体库
     * @param feedType 排序类型
     * @param skip 跳过数量（分页）
     * @param limit 每页数量
     * @param orientationMode 方向过滤
     * @param includeIds 仅返回指定 ID 的项（用于收藏等场景）
     */
    suspend fun getVideos(
        parentId: String?,
        library: EmbyLibrary?,
        feedType: FeedType,
        skip: Int,
        limit: Int,
        orientationMode: OrientationMode,
        includeIds: List<String>? = null
    ): VideoResponse

    /**
     * 获取视频播放 URL
     * @param item 媒体项
     * @param mode 播放模式：direct（直链）/ transcode（转码）/ fallback（更低码率）
     */
    suspend fun getVideoUrl(item: EmbyItem, mode: PlayMode = PlayMode.DIRECT): String

    /**
     * 获取图片 URL
     * @param itemId 媒体项 ID
     * @param tag 图片标签
     * @param type 图片类型
     */
    suspend fun getImageUrl(itemId: String, tag: String?, type: ImageType = ImageType.PRIMARY): String

    /**
     * 获取服务端收藏列表
     * @param libraryName 媒体库名称
     */
    suspend fun getFavorites(libraryName: String): Set<String>

    /**
     * 切换收藏状态
     * @param itemId 媒体项 ID
     * @param isFavorite 是否收藏
     * @param libraryName 媒体库名称
     */
    suspend fun toggleFavorite(itemId: String, isFavorite: Boolean, libraryName: String)

    /**
     * 删除媒体项
     * @param itemId 媒体项 ID
     */
    suspend fun deleteItem(itemId: String)

    /**
     * 搜索媒体
     * @param query 搜索关键词
     */
    suspend fun searchItems(query: String): List<EmbyItem>

    /**
     * 获取字幕轨道列表
     * @param itemId 媒体项 ID
     */
    suspend fun getSubtitleTracks(itemId: String): List<SubtitleTrack>
}

/**
 * 播放模式
 */
enum class PlayMode {
    DIRECT,    // 直链播放（优先）
    TRANSCODE, // 转码播放
    FALLBACK   // 更低码率转码
}

/**
 * 图片类型
 */
enum class ImageType {
    PRIMARY,
    BACKDROP,
    LOGO,
    THUMB
}

package com.embytok.domain.client

import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.SubtitleTrack

/**
 * 媒体服务器客户端接口（KMP shared）。
 *
 * Android 层实现：Ktor + 相应 JSON 反序列化。
 */
interface MediaClient {
    /** 连通性测试 / token 验证；返回 userId。 */
    suspend fun ping(): Result<String>

    /** Emby 用户名+密码 登录；返回 userId。 */
    suspend fun authenticate(username: String, password: String): Result<String>

    /** 获取媒体库列表。 */
    suspend fun getLibraries(): List<EmbyLibrary>

    /** 获取指定媒体库中的所有视频项。 */
    suspend fun getLibraryItems(libraryId: String): List<EmbyItem>

    /** 获取指定媒体库中最新添加的 N 项。 */
    suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem>

    /** 获取指定媒体库中的收藏项。 */
    suspend fun getFavoriteItems(libraryId: String): List<EmbyItem>

    /** 切换收藏；返回新状态。 */
    suspend fun toggleFavorite(itemId: String): Boolean

    /** 标记为已观看。 */
    suspend fun markAsWatched(itemId: String)

    /** 获取字幕轨道。 */
    suspend fun getSubtitles(itemId: String): List<SubtitleTrack>

    /** 搜索视频项。 */
    suspend fun searchItems(query: String, limit: Int = 50): List<EmbyItem>

    /** 构造视频直链。 */
    fun buildVideoStreamUrl(itemId: String, mediaSourceId: String? = null): String

    /**
     * 构造封面/海报图片 URL。
     *
     * @param itemId 视频/条目的 ID
     * @param imageTag Emby 用："Primary" / "Thumb" / "Backdrop"；Plex 自动忽略，使用内部 thumb 路径
     * @param maxWidth 期望的最大宽度（用于服务器端压缩，节省带宽）
     * @param maxHeight 期望的最大高度
     * @return 完整的图片 URL（包含认证 token 参数）
     */
    fun buildImageUrl(
        itemId: String,
        imageTag: String = "Primary",
        maxWidth: Int = 400,
        maxHeight: Int = 600
    ): String
}

/**
 * 播放模式枚举（仅供 Android 播放器内部使用）。
 */
enum class PlayMode {
    DIRECT,
    TRANSCODE,
    FALLBACK
}

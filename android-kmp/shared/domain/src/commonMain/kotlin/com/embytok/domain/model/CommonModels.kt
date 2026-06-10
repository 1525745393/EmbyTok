package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 服务器配置（持久化到 DataStore）
 */
@Serializable
data class ServerConfig(
    val url: String,
    val username: String,
    val token: String,
    val userId: String,
    val serverType: ServerType,
    val serverName: String = ""
) {
    /**
     * 获取基础 API URL（去掉末尾斜杠）
     */
    fun getApiBaseUrl(): String = url.trimEnd('/')

    /**
     * 获取完整 URL（用于 Plex 等）
     */
    fun getFullUrl(): String = url.trimEnd('/')
}

/**
 * 服务器类型
 */
@Serializable
enum class ServerType {
    EMBY,
    PLEX
}

/**
 * Emby 库 / Plex 媒体容器
 */
@Serializable
data class EmbyLibrary(
    val Id: String,
    val Name: String,
    val CollectionType: String? = null
)

/**
 * Emby 媒体项 / Plex Metadata 条目
 */
@Serializable
data class EmbyItem(
    val Id: String,
    val Name: String,
    val Type: String = "Video",
    val Overview: String? = null,
    val ProductionYear: Int? = null,
    val OfficialRating: String? = null,
    val RunTimeTicks: Long? = null,
    val Width: Int? = null,
    val Height: Int? = null,
    val ParentId: String? = null,
    val ImageTags: ImageTags? = null,
    val UserData: UserData? = null,
    val MediaSources: List<MediaSource>? = null,

    // Plex 特有字段
    val _PlexKey: String? = null
) {
    /** 是否为竖屏视频 */
    fun isVertical(): Boolean {
        val w = Width ?: return false
        val h = Height ?: return false
        return h > w
    }

    /** 是否为横屏视频 */
    fun isHorizontal(): Boolean {
        val w = Width ?: return false
        val h = Height ?: return false
        return w >= h
    }
}

/**
 * 图片标签（用于拼接封面 URL）
 */
@Serializable
data class ImageTags(
    val Primary: String? = null,
    val Backdrop: String? = null,
    val Logo: String? = null,
    val Thumb: String? = null
)

/**
 * 用户数据（收藏、播放次数等）
 */
@Serializable
data class UserData(
    val IsFavorite: Boolean = false,
    val PlayCount: Int = 0,
    val Played: Boolean = false,
    val PlaybackPositionTicks: Long = 0
)

/**
 * 媒体源（Emby MediaSourceInfo 的简化版）
 */
@Serializable
data class MediaSource(
    val Id: String,
    val Path: String? = null,
    val SupportsDirectPlay: Boolean = true,
    val Container: String? = null,
    val Bitrate: Int? = null,
    val MediaStreams: List<MediaStream>? = null
)

/**
 * 媒体流（视频/音频/字幕）
 */
@Serializable
data class MediaStream(
    val Index: Int = 0,
    val Type: String? = null, // Video / Audio / Subtitle
    val Codec: String? = null,
    val DisplayTitle: String? = null,
    val Language: String? = null,
    val IsExternal: Boolean = false,
    val Path: String? = null
)

/**
 * 视频流类型
 */
@Serializable
enum class FeedType {
    LATEST,    // 最新
    RANDOM,    // 随机
    FAVORITES, // 服务端收藏
    HISTORY    // 观看历史
}

/**
 * 方向过滤模式
 */
@Serializable
enum class OrientationMode {
    VERTICAL,   // 仅竖屏
    HORIZONTAL, // 仅横屏
    BOTH        // 全部
}

/**
 * 视频响应（分页）
 */
@Serializable
data class VideoResponse(
    val items: List<EmbyItem>,
    val totalRecordCount: Int
)

/**
 * 字幕轨道
 */
@Serializable
data class SubtitleTrack(
    val id: String,
    val label: String?,
    val srclang: String?,
    val src: String,
    val type: String // "vtt" / "srt" / "embedded"
)

/**
 * 字幕时间片
 */
data class SubtitleCue(
    val startTimeMs: Long,
    val endTimeMs: Long,
    val text: String
)

/**
 * 字幕设置
 */
@Serializable
data class SubtitleSettings(
    val enabled: Boolean = false,
    val selectedTrackId: String? = null,
    val fontSize: FontSize = FontSize.MEDIUM,
    val textColor: String = "#FFFFFF",
    val backgroundColor: String = "#CC000000",
    val position: SubtitlePosition = SubtitlePosition.BOTTOM
)

@Serializable
enum class FontSize {
    SMALL,
    MEDIUM,
    LARGE
}

@Serializable
enum class SubtitlePosition {
    TOP,
    BOTTOM
}

/**
 * 观看历史项
 */
@Serializable
data class WatchHistoryItem(
    val itemId: String,
    val item: EmbyItem? = null,
    val positionTicks: Long,
    val totalTicks: Long,
    val watchedAtMillis: Long
) {
    /** 获取进度百分比 */
    fun getProgress(): Float {
        if (totalTicks <= 0) return 0f
        return (positionTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f)
    }
}

/**
 * 本地收藏合集
 */
@Serializable
data class LocalFavoriteCollection(
    val id: String,
    val name: String,
    val createdAtMillis: Long,
    val description: String? = null,
    val itemIds: List<String> = emptyList()
) {
    companion object {
        const val DEFAULT_ID = "default"
    }
}

/**
 * 本地收藏状态
 */
@Serializable
data class LocalFavoritesState(
    val collections: List<LocalFavoriteCollection>,
    val favoriteIds: Set<String>
)

/**
 * GitHub Release（用于 OTA 升级检查）
 */
@Serializable
data class GitHubRelease(
    val tagName: String,
    val name: String?,
    val body: String?,
    val htmlUrl: String,
    val publishedAt: String?
)

/**
 * 应用语言
 */
@Serializable
enum class AppLanguage {
    SYSTEM,
    ZH_CN,
    EN_US
}

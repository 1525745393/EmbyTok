package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 视频响应（分页）
 */
@Serializable
data class VideoResponse(
    val items: List<EmbyItem>,
    val totalRecordCount: Int
)

/**
 * 字幕轨道（可传递给 ExoPlayer）
 */
@Serializable
data class SubtitleTrack(
    val id: String,
    val label: String? = null,
    val srclang: String? = null,
    val src: String,
    val type: String // "vtt" / "srt" / "embedded"
)

/**
 * 字幕时间片（用于纯文本渲染）
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
 * 视频流类型
 */
@Serializable
enum class FeedType {
    LATEST,
    RANDOM,
    FAVORITES,
    HISTORY,
    ALL
}

/**
 * 排序模式
 */
@Serializable
enum class SortMode {
    DATE_ADDED_DESC,
    PLAY_COUNT_DESC,
    RATING_DESC,
    NAME_ASC
}

/**
 * 方向过滤模式
 */
@Serializable
enum class OrientationMode {
    VERTICAL,
    HORIZONTAL,
    BOTH
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
    val name: String? = null,
    val body: String? = null,
    val htmlUrl: String,
    val publishedAt: String? = null
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

package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 视频流类型（排序方式）
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
    /**
     * 获取进度百分比
     */
    fun getProgress(): Float = calculatePlaybackProgress(positionTicks, totalTicks)
}

/**
 * 本地收藏合集
 */
@Serializable
data class LocalFavoriteCollection(
    val id: String,
    val name: String,
    val createdAtMillis: Long,
    val itemIds: List<String>
)

/**
 * 本地收藏状态
 */
@Serializable
data class LocalFavoritesState(
    val collections: List<LocalFavoriteCollection>,
    val favoriteIds: Set<String> // 全局收藏的 itemId 集合
)

/**
 * GitHub Release
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
 * 更新检查结果
 */
sealed class UpdateCheckResult {
    data class NewVersionAvailable(val release: GitHubRelease) : UpdateCheckResult()
    data object AlreadyUpToDate : UpdateCheckResult()
    data class Error(val message: String) : UpdateCheckResult()
}

/**
 * 语言设置
 */
@Serializable
enum class AppLanguage {
    ZH,    // 中文
    EN,    // 英文
    SYSTEM // 跟随系统
}

/**
 * 用户偏好设置
 */
@Serializable
data class UserPreferences(
    val language: AppLanguage = AppLanguage.SYSTEM,
    val orientationMode: OrientationMode = OrientationMode.BOTH,
    val isMuted: Boolean = false,
    val isAutoPlay: Boolean = true,
    val subtitleSettings: SubtitleSettings = SubtitleSettings(),
    val hiddenLibIds: Set<String> = emptySet()
)

package com.embytok.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 媒体库条目（Emby Library + Plex Directory 通用）。
 */
@Serializable
data class EmbyLibrary(
    val Id: String,
    val Name: String,
    val CollectionType: String? = null
) {
    fun isVideoLibrary(): Boolean =
        CollectionType in setOf(
            "movies", "tvshows", "homevideos", "musicvideos", "mixed", "video",
            "movie", "show"
        )

    fun getTypeDisplayName(): String = when (CollectionType) {
        "movies", "movie" -> "电影"
        "tvshows", "show" -> "电视剧"
        "homevideos" -> "家庭视频"
        "musicvideos" -> "音乐视频"
        "mixed" -> "混合"
        "video" -> "视频"
        else -> Name
    }
}

/**
 * 媒体项（视频、剧集、季等）。
 *
 * 注意：Emby 返回的 JSON 字段使用首字母大写命名（如 "RunTimeTicks"）。
 * 对于 Plex，我们在反序列化后将 Metadata 字段映射到此处统一模型。
 */
@Serializable
data class EmbyItem(
    val Id: String,
    val Name: String,
    val Type: String = "Video",
    val MediaType: String? = null,
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

    // 集数相关
    val IndexNumber: Int? = null,
    val ParentIndexNumber: Int? = null,
    val SeriesName: String? = null,
    val SortName: String? = null,

    // Plex 特有字段
    @SerialName("_PlexKey") val _PlexKey: String? = null
) {
    fun isVideo(): Boolean = Type in setOf("Movie", "Video", "Episode")
    fun isFolder(): Boolean = Type in FOLDER_TYPES
    fun isEpisode(): Boolean = Type == "Episode"
    fun isSeason(): Boolean = Type == "Season"
    fun isSeries(): Boolean = Type == "Series"
    fun isMovie(): Boolean = Type == "Movie"

    fun isVertical(): Boolean {
        val w = Width ?: return false
        val h = Height ?: return false
        return h > w
    }

    fun isHorizontal(): Boolean {
        val w = Width ?: return false
        val h = Height ?: return false
        return w >= h
    }

    fun getDisplayName(): String = when {
        isEpisode() && ParentIndexNumber != null && IndexNumber != null ->
            "S${ParentIndexNumber.toString().padStart(2, '0')}E${IndexNumber.toString().padStart(2, '0')}. $Name"
        isEpisode() && SeriesName != null -> "$SeriesName - $Name"
        else -> Name
    }

    fun getDurationText(): String = formatTimeText(RunTimeTicks)
}

val FOLDER_TYPES = listOf(
    "Series", "Season", "Folder", "CollectionFolder", "BoxSet", "show", "season"
)

@Serializable
data class ImageTags(
    val Primary: String? = null,
    val Logo: String? = null,
    val Thumb: String? = null,
    val Backdrop: String? = null
)

@Serializable
data class UserData(
    val IsFavorite: Boolean = false,
    val PlaybackPositionTicks: Long = 0,
    val PlayCount: Int = 0,
    val Played: Boolean = false,
    val LastPlayedDate: String? = null
) {
    fun getProgressPercentage(totalTicks: Long): Float {
        if (totalTicks <= 0) return 0f
        return (PlaybackPositionTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f)
    }

    fun isWatched(totalTicks: Long): Boolean =
        Played || (totalTicks > 0 && getProgressPercentage(totalTicks) > 0.9f)
}

@Serializable
data class MediaSource(
    val Id: String,
    val Path: String? = null,
    val SupportsDirectPlay: Boolean = true,
    val Container: String? = null,
    val Bitrate: Int? = null,
    val MediaStreams: List<MediaStream>? = null,
    val Name: String? = null,
    val SupportsDirectStream: Boolean? = null,
    val SupportsTranscoding: Boolean? = null,
    val Protocol: String? = null
)

@Serializable
data class MediaStream(
    val Index: Int = 0,
    val Type: String? = null,
    val Codec: String? = null,
    val DisplayTitle: String? = null,
    val Language: String? = null,
    val IsDefault: Boolean? = null,
    val IsExternal: Boolean = false,
    val Path: String? = null
) {
    fun isSubtitle(): Boolean = Type == "Subtitle"
    fun isAudio(): Boolean = Type == "Audio"
    fun isVideo(): Boolean = Type == "Video"
}

/**
 * 100ns tick -> 可读字符串（HH:mm:ss）。
 */
internal fun formatTimeText(ticks: Long?): String {
    if (ticks == null || ticks <= 0) return ""
    val totalSeconds = ticks / 10_000_000L
    val h = totalSeconds / 3600
    val m = (totalSeconds % 3600) / 60
    val s = totalSeconds % 60
    return buildString {
        if (h > 0) append("${h}h")
        if (m > 0) append("${m}m")
        if (s > 0 && h == 0L) append("${s}s")
    }
}

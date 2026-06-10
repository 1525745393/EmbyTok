package com.embytok.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 媒体库
 */
@Serializable
data class EmbyLibrary(
    val Id: String,
    val Name: String,
    @SerialName("CollectionType")
    val collectionType: String? = null
) {
    /**
     * 是否为视频库
     */
    fun isVideoLibrary(): Boolean = collectionType in listOf(
        "movies",
        "tvshows",
        "homevideos",
        "musicvideos",
        "mixed",
        "video"
    )

    /**
     * 获取库类型显示名称
     */
    fun getTypeDisplayName(): String = when (collectionType) {
        "movies" -> "电影"
        "tvshows" -> "电视剧"
        "homevideos" -> "家庭视频"
        "musicvideos" -> "音乐视频"
        "mixed" -> "混合"
        "video" -> "视频"
        else -> Name
    }
}

/**
 * 媒体项（视频、剧集、季等）
 */
@Serializable
data class EmbyItem(
    val Id: String,
    val Name: String,
    val Type: String,
    val MediaType: String? = null,
    val Overview: String? = null,
    val ProductionYear: Int? = null,
    val Width: Int? = null,
    val Height: Int? = null,
    @SerialName("RunTimeTicks")
    val runTimeTicks: Long? = null,
    val MediaSources: List<MediaSource>? = null,
    @SerialName("ImageTags")
    val ImageTags: ImageTags? = null,
    @SerialName("UserData")
    val UserData: UserData? = null,
    @SerialName("SeriesName")
    val SeriesName: String? = null,
    @SerialName("ParentId")
    val ParentId: String? = null,
    // Plex specific fields
    @SerialName("_PlexKey")
    val _PlexKey: String? = null,
    // Additional fields for search
    val IndexNumber: Int? = null,
    val ParentIndexNumber: Int? = null,
    val SortName: String? = null
) {
    /**
     * 是否为视频文件
     */
    fun isVideo(): Boolean = Type in listOf("Movie", "Video", "Episode")

    /**
     * 是否为文件夹类型（可导航）
     */
    fun isFolder(): Boolean = Type in FOLDER_TYPES

    /**
     * 是否为剧集
     */
    fun isEpisode(): Boolean = Type == "Episode"

    /**
     * 是否为季
     */
    fun isSeason(): Boolean = Type == "Season"

    /**
     * 是否为系列
     */
    fun isSeries(): Boolean = Type == "Series"

    /**
     * 是否为电影
     */
    fun isMovie(): Boolean = Type == "Movie"

    /**
     * 是否为竖屏视频
     */
    fun isVertical(): Boolean {
        val w = Width ?: 0
        val h = Height ?: 0
        return h > w && h > 0
    }

    /**
     * 是否为横屏视频
     */
    fun isHorizontal(): Boolean {
        val w = Width ?: 0
        val h = Height ?: 0
        return w > h && w > 0
    }

    /**
     * 获取显示名称（带集数信息）
     */
    fun getDisplayName(): String {
        return when {
            isEpisode() && ParentIndexNumber != null && IndexNumber != null -> {
                "S${ParentIndexNumber.toString().padStart(2, '0')}E${IndexNumber.toString().padStart(2, '0')}. $Name"
            }
            isEpisode() && SeriesName != null -> "$SeriesName - $Name"
            else -> Name
        }
    }

    /**
     * 获取可读的时长文本
     */
    fun getDurationText(): String = formatTimeText(runTimeTicks)
}

/**
 * 文件夹类型列表
 */
val FOLDER_TYPES = listOf(
    "Series",
    "Season",
    "Folder",
    "CollectionFolder",
    "BoxSet",
    "show",
    "season"
)

/**
 * 图片标签
 */
@Serializable
data class ImageTags(
    val Primary: String? = null,
    val Logo: String? = null,
    val Thumb: String? = null,
    val Backdrop: String? = null
)

/**
 * 用户数据（收藏、播放进度等）
 */
@Serializable
data class UserData(
    @SerialName("IsFavorite")
    val IsFavorite: Boolean = false,
    @SerialName("PlaybackPositionTicks")
    val PlaybackPositionTicks: Long = 0,
    @SerialName("PlayCount")
    val PlayCount: Int = 0,
    @SerialName("Played")
    val Played: Boolean = false,
    @SerialName("LastPlayedDate")
    val LastPlayedDate: String? = null
) {
    /**
     * 获取播放进度百分比
     */
    fun getProgressPercentage(totalTicks: Long): Float {
        if (totalTicks <= 0) return 0f
        return (PlaybackPositionTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f)
    }

    /**
     * 是否已经看过（进度超过 90%）
     */
    fun isWatched(totalTicks: Long): Boolean {
        return Played || (totalTicks > 0 && getProgressPercentage(totalTicks) > 0.9f)
    }
}

/**
 * 媒体源
 */
@Serializable
data class MediaSource(
    val Id: String,
    val Container: String,
    val Path: String,
    val Protocol: String,
    val Name: String? = null,
    @SerialName("SupportsDirectPlay")
    val SupportsDirectPlay: Boolean? = null,
    @SerialName("SupportsDirectStream")
    val SupportsDirectStream: Boolean? = null,
    @SerialName("SupportsTranscoding")
    val SupportsTranscoding: Boolean? = null,
    @SerialName("MediaStreams")
    val MediaStreams: List<MediaStream>? = null
)

/**
 * 媒体流（视频/音频/字幕轨道）
 */
@Serializable
data class MediaStream(
    val Type: String,
    val Codec: String? = null,
    val Language: String? = null,
    @SerialName("DisplayTitle")
    val DisplayTitle: String? = null,
    @SerialName("IsDefault")
    val IsDefault: Boolean? = null,
    @SerialName("IsExternal")
    val IsExternal: Boolean? = null,
    val Index: Int? = null,
    val Path: String? = null
) {
    /**
     * 是否为字幕流
     */
    fun isSubtitle(): Boolean = Type == "Subtitle"

    /**
     * 是否为音频流
     */
    fun isAudio(): Boolean = Type == "Audio"

    /**
     * 是否为视频流
     */
    fun isVideo(): Boolean = Type == "Video"
}

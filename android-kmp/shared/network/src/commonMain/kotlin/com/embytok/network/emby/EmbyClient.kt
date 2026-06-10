package com.embytok.network.emby

import com.embytok.common.EmbyTokLogger
import com.embytok.domain.client.ImageType
import com.embytok.domain.client.MediaClient
import com.embytok.domain.client.PlayMode
import com.embytok.domain.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Emby 服务器客户端实现
 */
class EmbyClient(
    override val config: ServerConfig,
    private val httpClient: HttpClient
) : MediaClient {

    private val logger = EmbyTokLogger
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val headers: HeadersBuilder.() -> Unit = {
        append("X-Emby-Token", config.token)
        append("X-MediaBrowser-Token", config.token)
        append(
            "X-Emby-Authorization",
            "MediaBrowser UserId=\"${config.userId}\", Client=\"EmbyTok\", Device=\"Android\", DeviceId=\"${DeviceInfo.deviceId}\", Version=\"${DeviceInfo.version}\""
        )
    }

    override suspend fun authenticate(username: String, password: String): ServerConfig {
        logger.d("开始 Emby 认证: $username", "EmbyClient")

        val authResponse = httpClient.post("${config.getApiBaseUrl()}/Users/AuthenticateByName") {
            contentType(ContentType.Application.Json)
            setBody(EmbyAuthRequest(username, password, "EmbyTok"))
        }.body<EmbyAuthResponse>()

        return config.copy(
            token = authResponse.AccessToken,
            userId = authResponse.User.Id,
            username = authResponse.User.Name,
            serverName = "Emby"
        )
    }

    override suspend fun getLibraries(): List<EmbyLibrary> {
        logger.d("获取媒体库列表", "EmbyClient")

        val response = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Views") {
            headers()
        }.body<EmbyLibraryResponse>()

        return response.Items.filter { it.CollectionType != null }
    }

    override suspend fun getResumeItems(): List<EmbyItem> {
        logger.d("获取继续观看项", "EmbyClient")

        val response = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items") {
            headers()
            parameter("SortBy", "DatePlayed")
            parameter("SortOrder", "Descending")
            parameter("Filters", "IsResumable")
            parameter("Limit", 10)
            parameter("Recursive", true)
            parameter("MediaTypes", "Video")
        }.body<EmbyItemListResponse>()

        return response.Items
    }

    override suspend fun getVideos(
        parentId: String?,
        library: EmbyLibrary?,
        feedType: FeedType,
        skip: Int,
        limit: Int,
        orientationMode: OrientationMode,
        includeIds: List<String>?
    ): VideoResponse {
        logger.d("获取视频列表: parentId=$parentId, feedType=$feedType, skip=$skip, limit=$limit", "EmbyClient")

        return httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items") {
            headers()
            parameter("SortBy", when (feedType) {
                FeedType.LATEST -> "DateCreated"
                FeedType.RANDOM -> "Random"
                FeedType.FAVORITES, FeedType.HISTORY -> "SortName"
            })
            parameter("SortOrder", "Descending")
            parameter("IncludeItemTypes", "Movie,Video,Episode,Series,Season,Folder,CollectionFolder,BoxSet")
            parameter("Recursive", true)
            parameter("Limit", limit)
            parameter("StartIndex", skip)

            parentId?.let { parameter("ParentId", it) }

            includeIds?.let { ids ->
                if (ids.isNotEmpty()) {
                    parameter("Ids", ids.joinToString(","))
                }
            }

            // 获取所有视频类型用于计算方向
            parameter("MediaTypes", "Video")
        }.let { response ->
            val raw = response.body<EmbyItemListResponse>()
            val items = applyOrientationFilter(raw.Items, orientationMode)
            VideoResponse(items, raw.TotalRecordCount)
        }
    }

    override suspend fun getVideoUrl(item: EmbyItem, mode: PlayMode): String {
        logger.d("获取视频 URL: item=${item.Name}, mode=$mode", "EmbyClient")

        return when (mode) {
            PlayMode.DIRECT -> {
                val mediaSource = item.MediaSources?.firstOrNull { it.SupportsDirectPlay == true }
                if (mediaSource != null) {
                    "${config.getApiBaseUrl()}/Videos/${item.Id}/stream" +
                            "?Static=true" +
                            "&MediaSourceId=${mediaSource.Id}" +
                            "&DeviceId=${DeviceInfo.deviceId}" +
                            "&api_key=${config.token}"
                } else {
                    throw IllegalStateException("No direct play source available")
                }
            }
            PlayMode.TRANSCODE -> {
                "${config.getApiBaseUrl()}/Videos/${item.Id}/master.m3u8" +
                        "?DeviceId=${DeviceInfo.deviceId}" +
                        "&VideoCodec=h264" +
                        "&AudioCodec=aac" +
                        "&MaxWidth=1920" +
                        "&MaxHeight=1080" +
                        "&api_key=${config.token}"
            }
            PlayMode.FALLBACK -> {
                "${config.getApiBaseUrl()}/Videos/${item.Id}/master.m3u8" +
                        "?DeviceId=${DeviceInfo.deviceId}" +
                        "&VideoCodec=h264" +
                        "&AudioCodec=aac" +
                        "&MaxWidth=1280" +
                        "&MaxHeight=720" +
                        "&MaxBitrate=2000000" +
                        "&api_key=${config.token}"
            }
        }
    }

    override suspend fun getImageUrl(itemId: String, tag: String?, type: ImageType): String {
        val imageType = when (type) {
            ImageType.PRIMARY -> "Primary"
            ImageType.BACKDROP -> "Backdrop"
            ImageType.LOGO -> "Logo"
            ImageType.THUMB -> "Thumb"
        }

        val tagParam = tag?.let { "&tag=$it" } ?: ""
        return "${config.getApiBaseUrl()}/Items/$itemId/Images/$imageType" +
                "?maxWidth=800" +
                tagParam +
                "&quality=90"
    }

    override suspend fun getFavorites(libraryName: String): Set<String> {
        logger.d("获取服务端收藏: library=$libraryName", "EmbyClient")

        // 查找 Tok-{libraryName} 播放列表
        val playlists = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items") {
            headers()
            parameter("SortBy", "Name")
            parameter("IncludeItemTypes", "Playlist")
            parameter("Recursive", true)
        }.body<EmbyItemListResponse>()

        val playlist = playlists.Items.find { it.Name == "Tok-$libraryName" }
            ?: return emptySet()

        // 获取播放列表中的项
        val playlistItems = httpClient.get("${config.getApiBaseUrl()}/Playlists/${playlist.Id}/Items") {
            headers()
            parameter("UserId", config.userId)
        }.body<PlaylistItemsResponse>()

        return playlistItems.Items.map { it.Id }.toSet()
    }

    override suspend fun toggleFavorite(itemId: String, isFavorite: Boolean, libraryName: String) {
        logger.d("切换收藏: itemId=$itemId, isFavorite=$isFavorite, library=$libraryName", "EmbyClient")

        // 查找或创建播放列表
        val playlists = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items") {
            headers()
            parameter("IncludeItemTypes", "Playlist")
        }.body<EmbyItemListResponse>()

        val playlist = playlists.Items.find { it.Name == "Tok-$libraryName" }
            ?: createPlaylist("Tok-$libraryName")

        if (isFavorite) {
            // 添加到收藏
            httpClient.post("${config.getApiBaseUrl()}/Playlists/${playlist.Id}/Items") {
                headers()
                parameter("Ids", itemId)
            }
        } else {
            // 从收藏移除
            // 先获取 playlist items 找到对应的 entry
            val playlistItems = httpClient.get("${config.getApiBaseUrl()}/Playlists/${playlist.Id}/Items") {
                headers()
                parameter("UserId", config.userId)
            }.body<PlaylistItemsResponse>()

            val entry = playlistItems.Items.find { it.Id == itemId }
            if (entry != null) {
                httpClient.delete("${config.getApiBaseUrl()}/Playlists/${playlist.Id}/Items") {
                    headers()
                    parameter("EntryIds", entry.PlaylistItemId ?: itemId)
                }
            }
        }
    }

    private suspend fun createPlaylist(name: String): EmbyItem {
        return httpClient.post("${config.getApiBaseUrl()}/Playlists") {
            headers()
            setBody(CreatePlaylistRequest(name, "EmbyTok"))
        }.body<EmbyItem>()
    }

    override suspend fun deleteItem(itemId: String) {
        logger.d("删除媒体项: $itemId", "EmbyClient")

        httpClient.delete("${config.getApiBaseUrl()}/Items/$itemId") {
            headers()
        }
    }

    override suspend fun searchItems(query: String): List<EmbyItem> {
        logger.d("搜索: $query", "EmbyClient")

        val response = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items") {
            headers()
            parameter("SearchTerm", query)
            parameter("IncludeItemTypes", "Movie,Video,Episode,Series")
            parameter("Recursive", true)
            parameter("Limit", 50)
        }.body<EmbyItemListResponse>()

        return response.Items
    }

    override suspend fun getSubtitleTracks(itemId: String): List<SubtitleTrack> {
        logger.d("获取字幕轨道: $itemId", "EmbyClient")

        val mediaSource = getMediaSource(itemId)
        val streams = mediaSource?.MediaStreams?.filter { it.Type == "Subtitle" } ?: return emptyList()

        return streams.mapNotNull { stream ->
            val codec = stream.Codec ?: return@mapNotNull null
            val isExternal = stream.IsExternal ?: false

            SubtitleTrack(
                id = "${stream.Index ?: 0}",
                label = stream.DisplayTitle ?: stream.Language ?: "Subtitle ${stream.Index ?: 0}",
                srclang = stream.Language,
                src = if (isExternal && stream.Path != null) {
                    stream.Path
                } else {
                    "${config.getApiBaseUrl()}/Videos/$itemId/${stream.Index}/Stream" +
                            "?MediaSourceId=${mediaSource.Id}" +
                            "&api_key=${config.token}"
                },
                type = when (codec.lowercase()) {
                    "subrip" -> "srt"
                    "webvtt" -> "vtt"
                    else -> codec
                }
            )
        }
    }

    private suspend fun getMediaSource(itemId: String): MediaSource? {
        val item = httpClient.get("${config.getApiBaseUrl()}/Users/${config.userId}/Items/$itemId") {
            headers()
            parameter("Fields", "MediaSources")
        }.body<EmbyItem>()

        return item.MediaSources?.firstOrNull()
    }

    /**
     * 应用方向过滤
     */
    private fun applyOrientationFilter(items: List<EmbyItem>, mode: OrientationMode): List<EmbyItem> {
        if (mode == OrientationMode.BOTH) return items

        return items.filter { item ->
            when (mode) {
                OrientationMode.VERTICAL -> item.isVertical()
                OrientationMode.HORIZONTAL -> item.isHorizontal()
                else -> true
            }
        }
    }

    // ============ 内部请求/响应模型 ============

    @Serializable
    private data class EmbyAuthRequest(
        val Username: String,
        val Pw: String,
        val Password: String? = null
    )

    @Serializable
    private data class EmbyLibraryResponse(
        val Items: List<EmbyLibrary>
    )

    @Serializable
    private data class EmbyItemListResponse(
        val Items: List<EmbyItem>,
        @SerialName("TotalRecordCount")
        val TotalRecordCount: Int
    )

    @Serializable
    private data class PlaylistItemsResponse(
        val Items: List<PlaylistItem>
    )

    @Serializable
    private data class PlaylistItem(
        val Id: String,
        @SerialName("PlaylistItemId")
        val PlaylistItemId: String?
    )

    @Serializable
    private data class CreatePlaylistRequest(
        val Name: String,
        val MediaType: String = "Video"
    )

    private object DeviceInfo {
        const val deviceId = "embytok-android"
        const val version = "1.0.0"
    }
}

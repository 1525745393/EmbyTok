package com.embytok.network.plex

import com.embytok.common.EmbyTokLogger
import com.embytok.domain.client.ImageType
import com.embytok.domain.client.MediaClient
import com.embytok.domain.client.PlayMode
import com.embytok.domain.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Plex 服务器客户端实现
 */
class PlexClient(
    override val config: ServerConfig,
    private val httpClient: HttpClient
) : MediaClient {

    private val logger = EmbyTokLogger
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val baseUrl: String
        get() = config.getFullUrl()

    private val authHeader: HeadersBuilder.() -> Unit = {
        append("X-Plex-Token", config.token)
    }

    override suspend fun authenticate(username: String, password: String): ServerConfig {
        logger.d("Plex 认证（Token 模式）", "PlexClient")

        // Plex 使用 X-Plex-Token 直接认证，这里验证连接
        val identity = httpClient.get("$baseUrl/identity") {
            authHeader()
        }.body<PlexIdentityResponse>()

        if (identity.MediaContainer?.machineIdentifier == null) {
            throw IllegalStateException("Invalid Plex server")
        }

        return config.copy(
            serverName = identity.MediaContainer.friendlyName ?: "Plex"
        )
    }

    override suspend fun getLibraries(): List<EmbyLibrary> {
        logger.d("获取 Plex 媒体库", "PlexClient")

        val response = httpClient.get("$baseUrl/library/sections") {
            authHeader()
        }.body<PlexDirectoryResponse>()

        return response.MediaContainer?.Directory?.map { dir ->
            EmbyLibrary(
                Id = dir.key ?: "",
                Name = dir.title ?: "",
                collectionType = when (dir.type) {
                    "movie" -> "movies"
                    "show" -> "tvshows"
                    "artist" -> "music"
                    else -> dir.type
                }
            )
        } ?: emptyList()
    }

    override suspend fun getResumeItems(): List<EmbyItem> {
        logger.d("获取 Plex 继续观看", "PlexClient")

        // Plex 的"继续观看"在 /hubs 中
        val response = httpClient.get("$baseUrl/hubs") {
            authHeader()
            parameter("continue", true)
        }.body<PlexHubsResponse>()

        return response.MediaContainer?.Hub?.flatMap { hub ->
            hub.Metadata?.mapNotNull { meta -> meta.toEmbyItem() } ?: emptyList()
        } ?: emptyList()
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
        logger.d("获取 Plex 视频: parentId=$parentId, feedType=$feedType", "PlexClient")

        val sectionKey = parentId ?: library?.Id ?: return VideoResponse(emptyList(), 0)

        val sortParam = when (feedType) {
            FeedType.LATEST -> "addedAt:desc"
            FeedType.RANDOM -> "random"
            else -> "titleSort"
        }

        val response = httpClient.get("$baseUrl/library/sections/$sectionKey/all") {
            authHeader()
            parameter("sort", sortParam)
            parameter("limit", limit)
            parameter("offset", skip)
        }.body<PlexMetadataResponse>()

        val items = response.MediaContainer?.Metadata?.mapNotNull { it.toEmbyItem() } ?: emptyList()
        val total = response.MediaContainer?.totalSize?.toIntOrNull() ?: items.size

        val filtered = applyOrientationFilter(items, orientationMode)

        return VideoResponse(filtered, total)
    }

    override suspend fun getVideoUrl(item: EmbyItem, mode: PlayMode): String {
        logger.d("获取 Plex 视频 URL: item=${item.Name}, mode=$mode", "PlexClient")

        return when (mode) {
            PlayMode.DIRECT -> {
                // Plex 直链使用 _PlexKey
                item._PlexKey ?: throw IllegalStateException("No Plex key available")
            }
            PlayMode.TRANSCODE, PlayMode.FALLBACK -> {
                // Plex 转码
                val bitrate = if (mode == PlayMode.FALLBACK) 2000 else 0
                val params = buildString {
                    append("path=")
                    append(item._PlexKey?.encodeURLParameter() ?: "")
                    append("&mediaBitrate=")
                    append(bitrate)
                    append("&protocol=web")
                }
                "$baseUrl/video/:/transcode/universal/start?$params"
            }
        }
    }

    override suspend fun getImageUrl(itemId: String, tag: String?, type: ImageType): String {
        // Plex 图片使用特殊的 URL 格式
        val ratingKey = tag ?: itemId
        return when (type) {
            ImageType.PRIMARY -> "$baseUrl/library/metadata/$ratingKey/thumb?width=800&height=1200"
            ImageType.BACKDROP -> "$baseUrl/library/metadata/$ratingKey/art?width=1920&height=1080"
            ImageType.THUMB -> "$baseUrl/library/metadata/$ratingKey/thumb?width=400&height=300"
            ImageType.LOGO -> "$baseUrl/library/metadata/$ratingKey/art?width=800"
        } + "&X-Plex-Token=${config.token}"
    }

    override suspend fun getFavorites(libraryName: String): Set<String> {
        logger.d("获取 Plex 收藏: library=$libraryName", "PlexClient")

        // Plex 收藏使用播放列表
        val response = httpClient.get("$baseUrl/playlists") {
            authHeader()
            parameter("playlistType", "video")
        }.body<PlexPlaylistResponse>()

        val playlist = response.MediaContainer?.Playlist?.find {
            it.title == "Tok-$libraryName"
        } ?: return emptySet()

        // 获取播放列表中的项
        val items = httpClient.get("$baseUrl/playlists/${playlist.key}/items") {
            authHeader()
        }.body<PlexMetadataResponse>()

        return items.MediaContainer?.Metadata?.mapNotNull { it.ratingKey }?.toSet() ?: emptySet()
    }

    override suspend fun toggleFavorite(itemId: String, isFavorite: Boolean, libraryName: String) {
        logger.d("切换 Plex 收藏: itemId=$itemId, isFavorite=$isFavorite", "PlexClient")

        val action = if (isFavorite) "favorite" else "unfavorite"
        httpClient.get("$baseUrl/library/metadata/$itemId/$action") {
            authHeader()
        }
    }

    override suspend fun deleteItem(itemId: String) {
        logger.d("删除 Plex 媒体项: $itemId", "PlexClient")

        httpClient.delete("$baseUrl/library/metadata/$itemId") {
            authHeader()
        }
    }

    override suspend fun searchItems(query: String): List<EmbyItem> {
        logger.d("Plex 搜索: $query", "PlexClient")

        val response = httpClient.get("$baseUrl/search") {
            authHeader()
            parameter("query", query)
        }.body<PlexSearchResponse>()

        return response.MediaContainer?.Metadata?.mapNotNull { it.toEmbyItem() } ?: emptyList()
    }

    override suspend fun getSubtitleTracks(itemId: String): List<SubtitleTrack> {
        logger.d("获取 Plex 字幕轨道: $itemId", "PlexClient")

        val response = httpClient.get("$baseUrl/library/metadata/$itemId") {
            authHeader()
        }.body<PlexMetadataResponse>()

        val media = response.MediaContainer?.Metadata?.firstOrNull()?.Media?.firstOrNull()
        val streams = media?.Part?.flatMap { part ->
            part.Stream?.filter { it.streamType == 3 }?.map { stream ->
                SubtitleTrack(
                    id = stream.id?.toString() ?: "0",
                    label = stream.displayTitle ?: stream.language ?: "Subtitle",
                    srclang = stream.language,
                    src = "${baseUrl}${stream.key}?X-Plex-Token=${config.token}",
                    type = when (stream.codec?.lowercase()) {
                        "srt" -> "srt"
                        "ssa", "ass" -> "ass"
                        else -> "vtt"
                    }
                )
            } ?: emptyList()
        } ?: emptyList()

        return streams
    }

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

    // ============ Plex 响应模型 ============

    @Serializable
    private data class PlexIdentityResponse(
        val MediaContainer: PlexIdentity?
    )

    @Serializable
    private data class PlexIdentity(
        val machineIdentifier: String? = null,
        val friendlyName: String? = null
    )

    @Serializable
    private data class PlexDirectoryResponse(
        val MediaContainer: PlexDirectoryContainer?
    )

    @Serializable
    private data class PlexDirectoryContainer(
        val Directory: List<PlexDirectory> = emptyList()
    )

    @Serializable
    private data class PlexDirectory(
        val key: String? = null,
        val title: String? = null,
        val type: String? = null
    )

    @Serializable
    private data class PlexHubsResponse(
        val MediaContainer: PlexHubsContainer?
    )

    @Serializable
    private data class PlexHubsContainer(
        val Hub: List<PlexHub> = emptyList()
    )

    @Serializable
    private data class PlexHub(
        val Metadata: List<PlexMetadata>? = null
    )

    @Serializable
    private data class PlexMetadataResponse(
        val MediaContainer: PlexMetadataContainer?
    )

    @Serializable
    private data class PlexMetadataContainer(
        val Metadata: List<PlexMetadata> = emptyList(),
        val totalSize: String? = null
    )

    @Serializable
    private data class PlexMetadata(
        val ratingKey: String? = null,
        val key: String? = null,
        val title: String? = null,
        val type: String? = null,
        val summary: String? = null,
        val year: Int? = null,
        val duration: Long? = null,
        val thumb: String? = null,
        val art: String? = null,
        val Media: List<PlexMedia>? = null
    ) {
        fun toEmbyItem(): EmbyItem? {
            if (ratingKey == null || title == null) return null

            val media = Media?.firstOrNull()
            val videoStream = media?.Part?.firstOrNull()?.Stream?.find { it.streamType == 1 }
            val width = videoStream?.width?.toIntOrNull()
            val height = videoStream?.height?.toIntOrNull()
            val duration = duration ?: media?.duration?.toLongOrNull()

            return EmbyItem(
                Id = ratingKey,
                Name = title,
                Type = when (type) {
                    "movie" -> "Movie"
                    "episode" -> "Episode"
                    "show" -> "Series"
                    "season" -> "Season"
                    "track" -> "Audio"
                    else -> "Video"
                },
                Overview = summary,
                ProductionYear = year,
                Width = width,
                Height = height,
                runTimeTicks = (duration ?: 0) * 10_000, // Plex 使用毫秒
                _PlexKey = key,
                ImageTags = ImageTags(
                    Primary = thumb?.let { "thumb" },
                    Backdrop = art?.let { "art" }
                )
            )
        }
    }

    @Serializable
    private data class PlexMedia(
        val duration: String? = null,
        val Part: List<PlexPart>? = null
    )

    @Serializable
    private data class PlexPart(
        val key: String? = null,
        val duration: String? = null,
        val Stream: List<PlexStream>? = null
    )

    @Serializable
    private data class PlexStream(
        val id: Int? = null,
        val streamType: Int? = null,
        val codec: String? = null,
        val language: String? = null,
        val displayTitle: String? = null,
        val width: String? = null,
        val height: String? = null,
        val key: String? = null
    )

    @Serializable
    private data class PlexPlaylistResponse(
        val MediaContainer: PlexPlaylistContainer?
    )

    @Serializable
    private data class PlexPlaylistContainer(
        val Playlist: List<PlexPlaylist> = emptyList()
    )

    @Serializable
    private data class PlexPlaylist(
        val ratingKey: String? = null,
        val key: String? = null,
        val title: String? = null
    )

    @Serializable
    private data class PlexSearchResponse(
        val MediaContainer: PlexSearchContainer?
    )

    @Serializable
    private data class PlexSearchContainer(
        val Metadata: List<PlexMetadata> = emptyList()
    )
}

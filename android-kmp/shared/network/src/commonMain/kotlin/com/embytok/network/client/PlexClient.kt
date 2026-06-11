package com.embytok.network.client

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.MediaSource
import com.embytok.domain.model.SubtitleTrack
import com.embytok.domain.model.UserData
import com.embytok.network.defaultHttpClient
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Plex 服务器原生客户端。
 *
 * API 约定：
 *   - Header: X-Plex-Token, X-Plex-Client-Identifier, X-Plex-Product, X-Plex-Version, X-Plex-Platform
 *   - GET /  -> 返回 MediaContainer.friendlyName (用于验证 token)
 *   - GET /library/sections  -> 库列表
 *   - GET /library/sections/{id}/all?type=1&X-Plex-Token=xxx -> 电影列表
 *   - GET /library/metadata/{id} -> 条目详情 (含 MediaStreams)
 */
class PlexClient(
    private val baseUrl: String,
    private val token: String,
    private val clientIdentifier: String = "embytok-android",
    private val httpClient: HttpClient = defaultHttpClient()
) : MediaClient {

    private fun apiUrl(path: String): String =
        "${baseUrl.trimEnd('/')}/${path.trimStart('/')}"

    private fun io.ktor.client.request.HttpRequestBuilder.plexHeaders() {
        header("X-Plex-Token", token)
        header("X-Plex-Client-Identifier", clientIdentifier)
        header("X-Plex-Product", "EmbyTok")
        header("X-Plex-Version", "1.0.0")
        header("X-Plex-Platform", "Android")
        header("Accept", "application/json")
    }

    // ===== 认证 / ping =====

    override suspend fun ping(): Result<String> = runCatching {
        val resp = httpClient.get(apiUrl("/")) {
            plexHeaders()
        }.body<PlexRootResponse>()
        resp.MediaContainer.friendlyName ?: "plex-server"
    }

    override suspend fun authenticate(username: String, password: String): Result<String> = ping()

    // ===== 媒体库 =====

    override suspend fun getLibraries(): List<EmbyLibrary> {
        return runCatching {
            val resp = httpClient.get(apiUrl("library/sections")) {
                plexHeaders()
            }.body<PlexLibrariesResponse>()
            resp.MediaContainer.Directory.orEmpty().map { dir ->
                EmbyLibrary(
                    Id = dir.key ?: dir.uuid ?: dir.title,
                    Name = dir.title,
                    CollectionType = dir.type
                )
            }
        }.getOrDefault(emptyList())
    }

    // ===== 视频列表 =====

    override suspend fun getLibraryItems(libraryId: String): List<EmbyItem> {
        return runCatching {
            val resp = httpClient.get(apiUrl("library/sections/$libraryId/all")) {
                plexHeaders()
                parameter("type", "1")
                parameter("sort", "addedAt:desc")
                parameter("limit", "300")
            }.body<PlexItemsResponse>()
            resp.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    override suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem> {
        return runCatching {
            val resp = httpClient.get(apiUrl("library/sections/$libraryId/recentlyAdded")) {
                plexHeaders()
                parameter("limit", limit.toString())
            }.body<PlexItemsResponse>()
            resp.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    override suspend fun getFavoriteItems(libraryId: String): List<EmbyItem> {
        return runCatching {
            val resp = httpClient.get(apiUrl("library/sections/$libraryId/all")) {
                plexHeaders()
                parameter("type", "1")
                parameter("favorite", "1")
                parameter("limit", "300")
            }.body<PlexItemsResponse>()
            resp.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    // ===== 收藏 / 观看 =====

    override suspend fun toggleFavorite(itemId: String): Boolean {
        return runCatching {
            httpClient.get(apiUrl(":/favorite")) {
                plexHeaders()
                parameter("key", itemId)
                parameter("ratingKey", itemId)
            }
            true
        }.getOrDefault(false)
    }

    override suspend fun markAsWatched(itemId: String) {
        runCatching {
            httpClient.get(apiUrl(":/scrobble")) {
                plexHeaders()
                parameter("key", itemId)
                parameter("identifier", "com.plexapp.plugins.library")
            }
        }
    }

    // ===== 字幕 =====

    override suspend fun getSubtitles(itemId: String): List<SubtitleTrack> {
        val detail = runCatching {
            httpClient.get(apiUrl("library/metadata/$itemId")) {
                plexHeaders()
            }.body<PlexItemsResponse>()
        }.getOrNull() ?: return emptyList()

        val tracks = mutableListOf<SubtitleTrack>()
        detail.MediaContainer.Metadata?.firstOrNull()?.Media?.forEach { m ->
            m.Part?.forEach { part ->
                part.Stream?.filter { it.streamType == 3 }?.forEach { stream ->
                    val src = if (!stream.key.isNullOrBlank()) {
                        apiUrl(stream.key.trimStart('/')) + "?X-Plex-Token=$token"
                    } else {
                        apiUrl("library/parts/${part.id}/streams/${stream.id}.srt") + "?X-Plex-Token=$token"
                    }
                    tracks += SubtitleTrack(
                        id = "$itemId-${part.id}-${stream.id}",
                        label = stream.displayTitle,
                        srclang = stream.languageCode,
                        src = src,
                        type = if (stream.key?.endsWith(".vtt") == true) "vtt" else "srt"
                    )
                }
            }
        }
        return tracks
    }

    // ===== 搜索 =====

    override suspend fun searchItems(query: String, limit: Int): List<EmbyItem> {
        return runCatching {
            // 使用 Ktor 的参数编码
            val resp = httpClient.get(apiUrl("search")) {
                header("X-Plex-Token", token)
                parameter("query", query)
                parameter("limit", limit.toString())
            }.body<PlexItemsResponse>()
            resp.MediaContainer.Metadata
                ?.filter { it.type in listOf("movie", "episode") }
                ?.map { it.toEmbyItem() }
                ?: emptyList()
        }.getOrDefault(emptyList())
    }

    // ===== 播放地址 =====

    override fun buildVideoStreamUrl(itemId: String, mediaSourceId: String?): String {
        val key = mediaSourceId ?: itemId
        return apiUrl("library/parts/$key/file.mp4") + "?X-Plex-Token=$token"
    }

    // ===== 图片 URL 构建 =====

    /**
     * 构造 Plex 图片 URL。
     *
     * Plex 的 thumb 字段是一个相对路径（如 /library/metadata/1234/thumb/567890），
     * 或 Transcoded 路径（如 /photo/:/transcode?width=..&height=..&url=/library/..）。
     *
     * 这里直接返回原始 thumb 路径 + token 参数，并指定宽高让 Plex 服务器进行压缩。
     *
     * @param itemId 视频的 ratingKey
     * @param imageTag Plex 下不使用，保留占位
     * @param maxWidth 用于服务器压缩的最大宽度
     * @param maxHeight 用于服务器压缩的最大高度
     */
    override fun buildImageUrl(
        itemId: String,
        imageTag: String,
        maxWidth: Int,
        maxHeight: Int
    ): String {
        // 优先使用 Transcoded 路径：让 Plex 服务器压缩图片到指定尺寸
        return apiUrl("photo/:/transcode") +
                "?width=$maxWidth&height=$maxHeight" +
                "&url=/library/metadata/$itemId/thumb/0" +
                "&X-Plex-Token=$token"
    }

    // ============ 内部 JSON 模型 ============

    @Serializable
    private data class PlexRootResponse(val MediaContainer: MediaContainerRoot)

    @Serializable
    private data class MediaContainerRoot(val friendlyName: String? = null)

    @Serializable
    private data class PlexLibrariesResponse(val MediaContainer: LibraryContainer)

    @Serializable
    private data class LibraryContainer(val Directory: List<Directory>? = null)

    @Serializable
    private data class Directory(
        val key: String? = null,
        val title: String,
        val type: String? = null,
        val uuid: String? = null
    )

    @Serializable
    private data class PlexItemsResponse(val MediaContainer: ItemContainer)

    @Serializable
    private data class ItemContainer(val Metadata: List<Metadata>? = null)

    @Serializable
    private data class Metadata(
        val ratingKey: String,
        val title: String,
        val summary: String? = null,
        val year: Int? = null,
        val duration: Long? = null,  // 单位: ms
        val thumb: String? = null,
        val width: Int? = null,
        val height: Int? = null,
        val viewCount: Int? = null,
        val lastViewedAt: Long? = null,
        val Media: List<MediaItem>? = null
    ) {
        fun toEmbyItem(): EmbyItem = EmbyItem(
            Id = ratingKey,
            Name = title,
            Type = "Movie",
            Overview = summary,
            ProductionYear = year,
            RunTimeTicks = (duration ?: 0L) * 10_000L,  // ms -> 100ns ticks
            Width = width,
            Height = height,
            UserData = UserData(
                IsFavorite = false,
                PlayCount = viewCount ?: 0,
                Played = (viewCount ?: 0) > 0,
                PlaybackPositionTicks = 0L
            ),
            MediaSources = Media?.map { m ->
                MediaSource(
                    Id = m.id ?: ratingKey,
                    Path = m.Part?.firstOrNull()?.key,
                    Container = m.container,
                    Bitrate = m.bitrate,
                    SupportsDirectPlay = true
                )
            },
            ParentId = null,
            _PlexKey = ratingKey
        )
    }

    @Serializable
    private data class MediaItem(
        val id: String? = null,
        val duration: Long? = null,
        val bitrate: Int? = null,
        val container: String? = null,
        val Part: List<Part>? = null
    )

    @Serializable
    private data class Part(
        val id: String,
        val key: String? = null,
        val duration: Long? = null,
        val file: String? = null,
        val Stream: List<Stream>? = null
    )

    @Serializable
    private data class Stream(
        val id: Int,
        val streamType: Int,
        val codec: String? = null,
        val displayTitle: String? = null,
        val languageCode: String? = null,
        val key: String? = null
    )
}

package com.embytok.network.client

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.MediaSource
import com.embytok.domain.model.SubtitleTrack
import com.embytok.domain.model.UserData
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Plex 媒体服务器客户端（Ktor 实现）。
 *
 * Plex 使用 X-Plex-Token 认证。JSON 响应包含 MediaContainer 外层包装。
 *
 * 关键 API 端点：
 *   - GET /                               Ping，返回服务器友好名称
 *   - GET /library/sections               媒体库列表
 *   - GET /library/sections/{id}/all      指定库视频列表
 *   - GET /library/sections/{id}/recentlyAdded  最新
 *   - GET /:/favorite?key=...             切换收藏
 *   - GET /library/metadata/{id}          条目详情（MediaStreams / 字幕）
 */
class PlexClient(
    private val baseUrl: String,
    private val token: String,
    private val clientIdentifier: String = "embytok-android",
    private val httpClient: HttpClient = defaultHttpClient()
) : MediaClient {

    private val authHeaders = mapOf(
        "X-Plex-Token" to token,
        "X-Plex-Client-Identifier" to clientIdentifier,
        "X-Plex-Product" to "EmbyTok",
        "X-Plex-Version" to "1.0.0",
        "X-Plex-Platform" to "Android",
        "Accept" to "application/json"
    )

    private fun apiUrl(path: String): String =
        "${baseUrl.trimEnd('/')}/${path.trimStart('/')}"

    // ============ 认证 ============

    override suspend fun ping(): Result<String> = runCatching {
        val root = httpClient.get(apiUrl("/")) {
            authHeaders.forEach { (k, v) -> header(k, v) }
        }.body<PlexRootResponse>()
        root.MediaContainer.friendlyName ?: "plex"
    }

    override suspend fun authenticate(username: String, password: String): Result<String> {
        // Plex 使用 Plex.tv OAuth 流程；在这里降级为 token 验证
        return ping()
    }

    // ============ 媒体库 ============

    override suspend fun getLibraries(): List<EmbyLibrary> {
        val response = runCatching {
            httpClient.get(apiUrl("library/sections")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
            }.body<PlexLibrariesResponse>()
        }.getOrNull() ?: return emptyList()

        return response.MediaContainer.Directory.orEmpty()
            .filter { it.type in setOf("movie", "show", "video") }
            .map { dir ->
                EmbyLibrary(
                    Id = dir.key ?: dir.uuid ?: dir.title.hashCode().toString(),
                    Name = dir.title,
                    CollectionType = dir.type
                )
            }
    }

    // ============ 视频列表 ============

    override suspend fun getLibraryItems(libraryId: String): List<EmbyItem> {
        val response = runCatching {
            httpClient.get(apiUrl("library/sections/$libraryId/all")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
                parameter("type", "1")  // 1 = Movie
                parameter("sort", "addedAt:desc")
                parameter("limit", 200)
            }.body<PlexItemsResponse>()
        }.getOrNull() ?: return emptyList()

        return response.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
    }

    override suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem> {
        val response = runCatching {
            httpClient.get(apiUrl("library/sections/$libraryId/recentlyAdded")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
                parameter("limit", limit)
            }.body<PlexItemsResponse>()
        }.getOrNull() ?: return emptyList()

        return response.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
    }

    override suspend fun getFavoriteItems(libraryId: String): List<EmbyItem> {
        val response = runCatching {
            httpClient.get(apiUrl("library/sections/$libraryId/all")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
                parameter("type", "1")
                parameter("favorite", "1")
                parameter("limit", 200)
            }.body<PlexItemsResponse>()
        }.getOrNull() ?: return emptyList()

        return response.MediaContainer.Metadata.orEmpty().map { it.toEmbyItem() }
    }

    // ============ 收藏 / 标记 ============

    override suspend fun toggleFavorite(itemId: String): Boolean {
        return runCatching {
            httpClient.get(apiUrl(":/favorite")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
                parameter("key", itemId)
                parameter("ratingKey", itemId)
            }
            true
        }.getOrDefault(false)
    }

    override suspend fun markAsWatched(itemId: String) {
        runCatching {
            httpClient.get(apiUrl(":/scrobble")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
                parameter("key", itemId)
                parameter("identifier", "com.plexapp.plugins.library")
            }
        }
    }

    // ============ 字幕 ============

    override suspend fun getSubtitles(itemId: String): List<SubtitleTrack> {
        val detail = runCatching {
            httpClient.get(apiUrl("library/metadata/$itemId")) {
                authHeaders.forEach { (k, v) -> header(k, v) }
            }.body<PlexItemsResponse>()
        }.getOrNull() ?: return emptyList()

        val media = detail.MediaContainer.Metadata?.firstOrNull()?.Media.orEmpty()
        val tracks = mutableListOf<SubtitleTrack>()
        media.forEach { m ->
            m.Part?.forEach { part ->
                part.Stream?.forEach { stream ->
                    if (stream.streamType == 3) {
                        tracks += SubtitleTrack(
                            id = stream.id.toString(),
                            label = stream.displayTitle ?: stream.languageCode ?: "Subtitle",
                            srclang = stream.languageCode,
                            src = if (!stream.key.isNullOrBlank()) {
                                "${baseUrl.trimEnd('/')}${stream.key}?X-Plex-Token=$token"
                            } else {
                                "${baseUrl.trimEnd('/')}/library/parts/${part.id}/streams/${stream.id}.srt?X-Plex-Token=$token"
                            },
                            type = "srt"
                        )
                    }
                }
            }
        }
        return tracks
    }

    // ============ 视频 URL ============

    override fun buildVideoStreamUrl(itemId: String, mediaSourceId: String?): String {
        return "${baseUrl.trimEnd('/')}/library/parts/${mediaSourceId ?: itemId}/file.mkv?X-Plex-Token=$token"
    }

    // ============ 内部：Plex Metadata -> EmbyItem ============

    private fun Metadata.toEmbyItem(): EmbyItem {
        val runTimeTicks = duration?.times(10_000L)
        return EmbyItem(
            Id = ratingKey,
            Name = title,
            Type = "Video",
            Overview = summary,
            ProductionYear = year,
            RunTimeTicks = runTimeTicks,
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
                    Path = m.Part?.firstOrNull()?.key
                )
            },
            ParentId = null
        )
    }

    // ============ 内部响应模型 ============

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
        val duration: Long? = null,
        val thumb: String? = null,
        val width: Int? = null,
        val height: Int? = null,
        val viewCount: Int? = null,
        val lastViewedAt: Long? = null,
        val Media: List<MediaItem>? = null
    )

    @Serializable
    private data class MediaItem(
        val id: String? = null,
        val Part: List<Part>? = null
    )

    @Serializable
    private data class Part(
        val id: String,
        val key: String? = null,
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

private fun defaultHttpClient(): HttpClient = HttpClient {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
        })
    }
    install(HttpTimeout) {
        requestTimeoutMillis = 15_000
        connectTimeoutMillis = 10_000
        socketTimeoutMillis = 30_000
    }
}

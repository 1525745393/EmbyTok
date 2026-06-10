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
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Emby 服务器原生客户端（Ktor + JSON）。
 *
 * API 约定：
 *   - HTTP Header: `X-Emby-Token` / `X-Emby-Authorization`
 *   - 认证: POST /Users/AuthenticateByName
 *   - 库列表: GET /Library/VirtualFolders  或  GET /Library/MediaFolders
 *   - 条目列表: GET /Users/{userId}/Items?ParentId={libraryId}&Recursive=true
 *   - 详情: GET /Users/{userId}/Items/{id}
 */
class EmbyClient(
    private val baseUrl: String,
    private val apiKey: String,
    private val userId: String,
    private val httpClient: HttpClient = defaultHttpClient()
) : MediaClient {

    private val authHeaderValue =
        "MediaBrowser Client=\"EmbyTok\", Device=\"Android\", DeviceId=\"embytok\", Version=\"1.0.0\""

    private fun apiPath(path: String): String = "${baseUrl.trimEnd('/')}/${path.trimStart('/')}"

    private fun requireUserId(): String =
        userId.ifBlank { throw IllegalStateException("需要先登录获取 userId") }

    // ===== 认证 =====

    override suspend fun ping(): Result<String> = runCatching {
        val resp = httpClient.get(apiPath("System/Info")) {
            header("X-Emby-Token", apiKey)
            header("X-Emby-Authorization", authHeaderValue)
        }.body<EmbySystemInfo>()
        resp.Id?.ifBlank { "emby-server" } ?: "emby-server"
    }

    override suspend fun authenticate(username: String, password: String): Result<String> = runCatching {
        val body = EmbyAuthBody(username, password, "EmbyTok", "Android", "embytok", "1.0.0")
        val resp = httpClient.post(apiPath("Users/AuthenticateByName")) {
            header("X-Emby-Authorization", authHeaderValue)
            contentType(ContentType.Application.Json)
            setBody(body)
        }.body<EmbyAuthJsonResponse>()
        resp.User.Id
    }

    // ===== 媒体库 =====

    override suspend fun getLibraries(): List<EmbyLibrary> {
        return runCatching {
            val resp = httpClient.get(apiPath("Library/VirtualFolders")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
            }.body<EmbyItemsResponse<EmbyLibraryJson>>()
            resp.Items.map { json ->
                EmbyLibrary(
                    Id = json.Id,
                    Name = json.Name,
                    CollectionType = json.CollectionType
                )
            }
        }.getOrDefault(emptyList())
    }

    // ===== 视频列表 =====

    override suspend fun getLibraryItems(libraryId: String): List<EmbyItem> {
        val uid = requireUserId()
        return runCatching {
            val resp = httpClient.get(apiPath("Users/$uid/Items")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                parameter("ParentId", libraryId)
                parameter("Recursive", "true")
                parameter("IncludeItemTypes", "Movie,Episode,Video")
                parameter("Fields", "MediaSources,MediaStreams,Overview,ProductionYear,Width,Height,RuntimeTicks,UserData")
                parameter("SortBy", "DateCreated,SortName")
                parameter("SortOrder", "Descending")
                parameter("Limit", "300")
            }.body<EmbyItemsResponse<EmbyItemJson>>()
            resp.Items.map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    override suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem> {
        val uid = requireUserId()
        return runCatching {
            val resp = httpClient.get(apiPath("Users/$uid/Items/Latest")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                parameter("ParentId", libraryId)
                parameter("Limit", limit.toString())
                parameter("Fields", "MediaSources,Overview,ProductionYear,Width,Height,RuntimeTicks,UserData")
            }.body<List<EmbyItemJson>>()
            resp.map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    override suspend fun getFavoriteItems(libraryId: String): List<EmbyItem> {
        val uid = requireUserId()
        return runCatching {
            val resp = httpClient.get(apiPath("Users/$uid/Items")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                parameter("ParentId", libraryId)
                parameter("Recursive", "true")
                parameter("Filters", "IsFavorite")
                parameter("IncludeItemTypes", "Movie,Episode,Video")
                parameter("Fields", "MediaSources,Overview,ProductionYear,Width,Height,RuntimeTicks,UserData")
                parameter("Limit", "300")
            }.body<EmbyItemsResponse<EmbyItemJson>>()
            resp.Items.map { it.toEmbyItem() }
        }.getOrDefault(emptyList())
    }

    // ===== 收藏 / 观看状态 =====

    override suspend fun toggleFavorite(itemId: String): Boolean {
        val uid = requireUserId()
        return runCatching {
            httpClient.post(apiPath("Users/$uid/Favorites/$itemId")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                contentType(ContentType.Application.Json)
            }
            true
        }.getOrDefault(false)
    }

    override suspend fun markAsWatched(itemId: String) {
        val uid = requireUserId()
        runCatching {
            httpClient.post(apiPath("Users/$uid/PlayedItems/$itemId")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                contentType(ContentType.Application.Json)
            }
        }
    }

    // ===== 字幕 =====

    override suspend fun getSubtitles(itemId: String): List<SubtitleTrack> {
        val detail = runCatching {
            val uid = requireUserId()
            httpClient.get(apiPath("Users/$uid/Items/$itemId")) {
                header("X-Emby-Token", apiKey)
                header("X-Emby-Authorization", authHeaderValue)
                parameter("Fields", "MediaSources,MediaStreams")
            }.body<EmbyItemJson>()
        }.getOrNull() ?: return emptyList()

        val tracks = mutableListOf<SubtitleTrack>()
        detail.MediaSources?.forEach { source ->
            source.MediaStreams?.filter { it.Type == "Subtitle" }?.forEach { stream ->
                val idx = stream.Index
                val src = apiPath("Videos/$itemId/${source.Id}/Subtitles/$idx/0/WebVTT")
                tracks += SubtitleTrack(
                    id = "$itemId-${source.Id}-$idx",
                    label = stream.DisplayTitle,
                    srclang = stream.Language,
                    src = src,
                    type = "vtt"
                )
            }
        }
        return tracks
    }

    // ===== 播放地址 =====

    override fun buildVideoStreamUrl(itemId: String, mediaSourceId: String?): String {
        val sourceId = mediaSourceId ?: itemId
        return apiPath("Videos/$itemId/stream.mp4?Static=true&MediaSourceId=$sourceId&X-Emby-Token=$apiKey")
    }

    // ============ 内部 JSON 模型 ============

    @Serializable
    private data class EmbySystemInfo(
        val Id: String? = null,
        val ServerName: String? = null
    )

    @Serializable
    private data class EmbyAuthBody(
        val Username: String,
        val Pw: String,
        val App: String,
        val Device: String,
        val DeviceId: String,
        val Version: String
    )

    @Serializable
    private data class EmbyAuthJsonResponse(
        val User: EmbyUserJson,
        val AccessToken: String,
        val ServerId: String
    )

    @Serializable
    private data class EmbyUserJson(val Id: String, val Name: String)

    @Serializable
    private data class EmbyItemsResponse<T>(val Items: List<T>, val TotalRecordCount: Int)

    @Serializable
    private data class EmbyLibraryJson(
        val Id: String,
        val Name: String,
        val CollectionType: String? = null
    )

    @Serializable
    private data class EmbyItemJson(
        val Id: String,
        val Name: String,
        val Type: String = "Video",
        val Overview: String? = null,
        val ProductionYear: Int? = null,
        val RunTimeTicks: Long? = null,
        val Width: Int? = null,
        val Height: Int? = null,
        val ParentId: String? = null,
        val UserData: EmbyUserDataJson? = null,
        val MediaSources: List<EmbyMediaSourceJson>? = null,
        val IndexNumber: Int? = null,
        val ParentIndexNumber: Int? = null,
        val SeriesName: String? = null
    ) {
        fun toEmbyItem(): EmbyItem = EmbyItem(
            Id = Id,
            Name = Name,
            Type = Type,
            Overview = Overview,
            ProductionYear = ProductionYear,
            RunTimeTicks = RunTimeTicks,
            Width = Width,
            Height = Height,
            ParentId = ParentId,
            UserData = UserData?.let {
                UserData(
                    IsFavorite = it.IsFavorite ?: false,
                    PlaybackPositionTicks = it.PlaybackPositionTicks ?: 0,
                    PlayCount = it.PlayCount ?: 0,
                    Played = it.Played ?: false
                )
            },
            MediaSources = MediaSources?.map { ms ->
                MediaSource(
                    Id = ms.Id,
                    Path = ms.Path,
                    Container = ms.Container,
                    Bitrate = ms.Bitrate,
                    SupportsDirectPlay = ms.SupportsDirectPlay ?: true,
                    SupportsDirectStream = ms.SupportsDirectStream,
                    SupportsTranscoding = ms.SupportsTranscoding,
                    Protocol = ms.Protocol,
                    MediaStreams = ms.MediaStreams?.map { s ->
                        com.embytok.domain.model.MediaStream(
                            Index = s.Index,
                            Type = s.Type,
                            Codec = s.Codec,
                            DisplayTitle = s.DisplayTitle,
                            Language = s.Language,
                            IsDefault = s.IsDefault,
                            IsExternal = s.IsExternal ?: false,
                            Path = s.Path
                        )
                    }
                )
            },
            IndexNumber = IndexNumber,
            ParentIndexNumber = ParentIndexNumber,
            SeriesName = SeriesName
        )
    }

    @Serializable
    private data class EmbyUserDataJson(
        val IsFavorite: Boolean? = null,
        val PlaybackPositionTicks: Long? = null,
        val PlayCount: Int? = null,
        val Played: Boolean? = null
    )

    @Serializable
    private data class EmbyMediaSourceJson(
        val Id: String,
        val Path: String? = null,
        val Container: String? = null,
        val Bitrate: Int? = null,
        val Protocol: String? = null,
        val SupportsDirectPlay: Boolean? = null,
        val SupportsDirectStream: Boolean? = null,
        val SupportsTranscoding: Boolean? = null,
        val MediaStreams: List<EmbyMediaStreamJson>? = null
    )

    @Serializable
    private data class EmbyMediaStreamJson(
        val Index: Int = 0,
        val Type: String? = null,
        val Codec: String? = null,
        val DisplayTitle: String? = null,
        val Language: String? = null,
        val IsDefault: Boolean? = null,
        val IsExternal: Boolean? = null,
        val Path: String? = null
    )
}

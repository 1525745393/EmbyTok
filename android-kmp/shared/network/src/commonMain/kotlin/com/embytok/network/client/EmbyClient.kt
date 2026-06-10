package com.embytok.network.client

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.MediaSource
import com.embytok.domain.model.MediaStream
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.SubtitleTrack
import com.embytok.domain.model.UserData
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Emby 媒体服务器客户端（Ktor 实现）。
 *
 * 构造方式：
 *   - 方式 A：用户名 + 密码登录 → [authenticate] 返回新 ServerConfig（带 token + userId）
 *   - 方式 B：已有 apiKey / token → 直接调用 [ping] 验证凭据
 *
 * 关键 API 端点：
 *   - POST /Users/AuthenticateByName  登录
 *   - GET  /Users/{userId}/Views       媒体库列表
 *   - GET  /Users/{userId}/Items       视频列表 / 最新 / 搜索 / 收藏
 *   - POST /Users/{userId}/FavoriteItems/{id}  收藏 / 取消收藏
 *   - GET  /Videos/{itemId}/stream     直链播放
 *   - GET  /Videos/{itemId}/master.m3u8 转码播放 (HLS)
 */
class EmbyClient(
    private val baseUrl: String,
    private val apiKey: String? = null,
    private val userId: String? = null,
    private val httpClient: HttpClient = defaultHttpClient()
) : MediaClient {

    /** 便捷构造：从 ServerConfig 构造。 */
    constructor(config: ServerConfig) : this(
        baseUrl = config.url,
        apiKey = config.token.ifBlank { null },
        userId = config.userId.ifBlank { null }
    )

    private val authHeaderValue: String = buildString {
        append("MediaBrowser ")
        append("Client=\"EmbyTok\", ")
        append("Device=\"Android\", ")
        append("DeviceId=\"embytok-android\", ")
        append("Version=\"1.0.0\"")
        if (!userId.isNullOrBlank()) append(", UserId=\"$userId\"")
        if (!apiKey.isNullOrBlank()) append(", Token=\"$apiKey\"")
    }

    /** 公共辅助：拼接 Emby API URL。 */
    private fun apiUrl(path: String): String =
        "${baseUrl.trimEnd('/')}/emby/${path.trimStart('/')}"

    // ============ 认证 ============

    override suspend fun ping(): Result<String> = runCatching {
        httpClient.get(apiUrl("System/Info/Public")) {
            header("Authorization", authHeaderValue)
        }.body<EmbyPublicSystemInfo>()
        // ping 成功：返回当前用户 id（若未知则用空串）
        userId.orEmpty()
    }

    override suspend fun authenticate(username: String, password: String): Result<String> {
        return runCatching {
            val response = httpClient.post(apiUrl("Users/AuthenticateByName")) {
                header("Authorization", authHeaderValue)
                contentType(ContentType.Application.Json)
                setBody(EmbyAuthRequest(username, password))
            }.body<EmbyAuthResponse>()
            response.User.Id
        }
    }

    // ============ 媒体库 ============

    override suspend fun getLibraries(): List<EmbyLibrary> {
        val id = userId ?: return emptyList()
        val response = httpClient.get(apiUrl("Users/$id/Views")) {
            header("Authorization", authHeaderValue)
        }.body<EmbyLibraryResponse>()
        return response.Items.filter { !it.CollectionType.isNullOrBlank() }
    }

    // ============ 视频列表 ============

    override suspend fun getLibraryItems(libraryId: String): List<EmbyItem> {
        val id = userId ?: return emptyList()
        val response = httpClient.get(apiUrl("Users/$id/Items")) {
            header("Authorization", authHeaderValue)
            parameter("ParentId", libraryId)
            parameter("Recursive", true)
            parameter("IncludeItemTypes", "Movie,Video,Episode")
            parameter("MediaTypes", "Video")
            parameter("SortBy", "DateCreated")
            parameter("SortOrder", "Descending")
            parameter("Limit", 200)
            parameter("Fields", "MediaSources,UserData,Width,Height,RunTimeTicks,Overview,ProductionYear")
        }.body<EmbyItemListResponse>()
        return response.Items
    }

    override suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem> {
        val id = userId ?: return emptyList()
        val response = httpClient.get(apiUrl("Users/$id/Items/Latest")) {
            header("Authorization", authHeaderValue)
            parameter("ParentId", libraryId)
            parameter("IncludeItemTypes", "Movie,Video,Episode")
            parameter("Limit", limit)
            parameter("Fields", "MediaSources,UserData,Width,Height,RunTimeTicks,Overview,ProductionYear")
        }.body<List<EmbyItem>>()
        return response
    }

    override suspend fun getFavoriteItems(libraryId: String): List<EmbyItem> {
        val id = userId ?: return emptyList()
        val response = httpClient.get(apiUrl("Users/$id/Items")) {
            header("Authorization", authHeaderValue)
            parameter("ParentId", libraryId)
            parameter("Recursive", true)
            parameter("Filters", "IsFavorite")
            parameter("IncludeItemTypes", "Movie,Video,Episode")
            parameter("Limit", 200)
            parameter("Fields", "MediaSources,UserData,Width,Height,RunTimeTicks,Overview,ProductionYear")
        }.body<EmbyItemListResponse>()
        return response.Items
    }

    // ============ 收藏 / 标记 ============

    override suspend fun toggleFavorite(itemId: String): Boolean {
        val id = userId ?: return false
        return runCatching {
            // 先查当前状态
            val current = try {
                httpClient.get(apiUrl("Users/$id/Items/$itemId")) {
                    header("Authorization", authHeaderValue)
                    parameter("Fields", "UserData")
                }.body<EmbyItem>().UserData?.IsFavorite ?: false
            } catch (_: Exception) { false }

            val next = !current
            if (next) {
                httpClient.post(apiUrl("Users/$id/FavoriteItems/$itemId")) {
                    header("Authorization", authHeaderValue)
                }
            } else {
                httpClient.delete(
                    apiUrl("Users/$id/FavoriteItems/$itemId"),
                ) {
                    header("Authorization", authHeaderValue)
                }
            }
            next
        }.getOrDefault(false)
    }

    override suspend fun markAsWatched(itemId: String) {
        val id = userId ?: return
        runCatching {
            httpClient.post(apiUrl("Users/$id/PlayedItems/$itemId")) {
                header("Authorization", authHeaderValue)
            }
        }
    }

    // ============ 搜索 ============

    suspend fun searchItems(query: String, limit: Int = 50): List<EmbyItem> {
        val id = userId ?: return emptyList()
        val response = httpClient.get(apiUrl("Users/$id/Items")) {
            header("Authorization", authHeaderValue)
            parameter("SearchTerm", query)
            parameter("IncludeItemTypes", "Movie,Video,Episode,Series")
            parameter("Recursive", true)
            parameter("Limit", limit)
            parameter("Fields", "MediaSources,UserData,Width,Height,RunTimeTicks,Overview,ProductionYear")
        }.body<EmbyItemListResponse>()
        return response.Items
    }

    // ============ 字幕 ============

    override suspend fun getSubtitles(itemId: String): List<SubtitleTrack> {
        val id = userId ?: return emptyList()
        val item = runCatching {
            httpClient.get(apiUrl("Users/$id/Items/$itemId")) {
                header("Authorization", authHeaderValue)
                parameter("Fields", "MediaSources")
            }.body<EmbyItem>()
        }.getOrNull() ?: return emptyList()

        val source = item.MediaSources?.firstOrNull() ?: return emptyList()
        return source.MediaStreams.orEmpty()
            .filter { it.Type?.equals("Subtitle", ignoreCase = true) == true }
            .mapNotNull { stream ->
                val codec = stream.Codec ?: return@mapNotNull null
                SubtitleTrack(
                    id = "${stream.Index ?: 0}",
                    label = stream.DisplayTitle ?: stream.Language ?: "Subtitle ${stream.Index ?: 0}",
                    srclang = stream.Language,
                    src = if (stream.IsExternal == true && stream.Path != null) {
                        stream.Path
                    } else {
                        "${baseUrl.trimEnd('/')}/emby/Videos/$itemId/${stream.Index}/Stream" +
                                "?MediaSourceId=${source.Id}&api_key=${apiKey.orEmpty()}"
                    },
                    type = when (codec.lowercase()) {
                        "subrip" -> "srt"
                        "webvtt" -> "vtt"
                        else -> codec
                    }
                )
            }
    }

    // ============ 视频 URL ============

    override fun buildVideoStreamUrl(itemId: String, mediaSourceId: String?): String {
        val source = mediaSourceId ?: itemId
        return "${baseUrl.trimEnd('/')}/emby/Videos/$itemId/stream" +
                "?Static=true&MediaSourceId=$source&api_key=${apiKey.orEmpty()}"
    }

    /** HLS 转码 URL（直链失败时降级使用）。 */
    fun buildTranscodeUrl(itemId: String, mediaSourceId: String? = null): String {
        val source = mediaSourceId ?: itemId
        return "${baseUrl.trimEnd('/')}/emby/Videos/$itemId/master.m3u8" +
                "?MediaSourceId=$source&VideoCodec=h264&AudioCodec=aac&api_key=${apiKey.orEmpty()}"
    }

    // ============ 内部请求 / 响应模型 ============

    @Serializable
    private data class EmbyAuthRequest(val Username: String, val Pw: String)

    @Serializable
    private data class EmbyAuthResponse(
        val AccessToken: String,
        val User: EmbyUser
    ) {
        @Serializable
        data class EmbyUser(val Id: String, val Name: String)
    }

    @Serializable
    private data class EmbyPublicSystemInfo(
        val ServerName: String? = null,
        val Version: String? = null
    )

    @Serializable
    private data class EmbyLibraryResponse(val Items: List<EmbyLibrary>)

    @Serializable
    private data class EmbyItemListResponse(
        val Items: List<EmbyItem>,
        val TotalRecordCount: Int = 0
    )
}

/** 默认 HttpClient：JSON 反序列化 + 超时 + 简单日志。 */
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
    install(Logging) {
        level = LogLevel.INFO
        logger = object : Logger {
            override fun log(message: String) {
                // 简单 println；Android 可替换为 Timber
                println("EmbyClient: $message")
            }
        }
    }
}

package com.embytok.usecase

import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.SubtitleTrack

/**
 * 媒体服务器客户端接口（KMP shared）。
 *
 * Android 层和 Desktop 层分别实现它（基于 Ktor / OkHttp）。
 */
interface MediaClient {
    /** 服务端连通性测试（Plex 用于 token 验证，Emby 用于 API Key 验证）。
     *  返回 userId（String）。 */
    suspend fun ping(): Result<String>

    /** Emby 用户名+密码 登录。返回 userId。 */
    suspend fun authenticate(username: String, password: String): Result<String>

    /** 获取媒体库（电影、剧集、音乐等）列表。 */
    suspend fun getLibraries(): List<EmbyLibrary>

    /** 获取指定媒体库中的所有视频项。 */
    suspend fun getLibraryItems(libraryId: String): List<EmbyItem>

    /** 获取指定媒体库中最新添加的 N 项。 */
    suspend fun getLatestItems(libraryId: String, limit: Int): List<EmbyItem>

    /** 获取指定媒体库中的收藏项。 */
    suspend fun getFavoriteItems(libraryId: String): List<EmbyItem>

    /** 标记为已观看。 */
    suspend fun markAsWatched(itemId: String)

    /** 切换收藏；返回新状态 (true=收藏 / false=取消收藏)。 */
    suspend fun toggleFavorite(itemId: String): Boolean

    /** 获取视频的可用字幕轨道。 */
    suspend fun getSubtitles(itemId: String): List<SubtitleTrack>

    /** 构造视频直链（可丢给 ExoPlayer 播放）。 */
    fun buildVideoStreamUrl(itemId: String, mediaSourceId: String? = null): String
}

/**
 * 用于 Koin 注入的 MediaClient Provider。
 *
 * 在 Android 层实现：读取 AppPreferences.serverConfig 并构造 EmbyClient / PlexClient。
 */
fun interface MediaClientProvider {
    fun current(): MediaClient?
}

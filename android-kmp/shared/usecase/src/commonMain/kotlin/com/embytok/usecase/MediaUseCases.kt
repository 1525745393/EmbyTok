package com.embytok.usecase

import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.repository.LocalRepository

/**
 * 获取媒体库列表。
 */
class GetLibrariesUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(): List<EmbyLibrary> {
        val client = mediaClientProvider() ?: throw IllegalStateException("尚未登录")
        return client.getLibraries()
    }
}

/**
 * 获取视频列表。
 */
class GetVideosUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(libraryId: String): List<EmbyItem> {
        val client = mediaClientProvider() ?: throw IllegalStateException("尚未登录")
        return client.getLibraryItems(libraryId)
    }
}

/**
 * 获取最近添加的视频。
 */
class GetRecentVideosUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(libraryId: String, limit: Int = 30): List<EmbyItem> {
        val client = mediaClientProvider() ?: throw IllegalStateException("尚未登录")
        return client.getLatestItems(libraryId, limit)
    }
}

/**
 * 获取收藏视频。
 */
class GetFavoriteVideosUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(libraryId: String): List<EmbyItem> {
        val client = mediaClientProvider() ?: throw IllegalStateException("尚未登录")
        return client.getFavoriteItems(libraryId)
    }
}

/**
 * 观看历史。
 */
class GetWatchHistoryUseCase(
    private val repository: LocalRepository
) {
    fun execute() = repository.getAllWatchHistory()
}

/**
 * 保存播放进度。
 */
class SaveWatchProgressUseCase(
    private val repository: LocalRepository
) {
    suspend fun execute(item: EmbyItem, positionTicks: Long, totalTicks: Long) {
        repository.addToWatchHistory(item, positionTicks, totalTicks)
    }
}

/**
 * 标记为已观看（可选功能）。
 */
class MarkAsWatchedUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(itemId: String) {
        mediaClientProvider()?.markAsWatched(itemId)
    }
}

/**
 * 切换收藏（Emby/Plex 服务端收藏同步）。
 */
class ToggleFavoriteUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(itemId: String): Boolean {
        return mediaClientProvider()?.toggleFavorite(itemId) ?: false
    }
}

/**
 * 字幕轨道列表。
 */
class GetSubtitlesUseCase(
    private val mediaClientProvider: () -> com.embytok.domain.client.MediaClient?
) {
    suspend fun execute(itemId: String): List<com.embytok.domain.model.SubtitleTrack> {
        return mediaClientProvider()?.getSubtitles(itemId).orEmpty()
    }
}

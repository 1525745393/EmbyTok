package com.embytok.usecase

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.*

/**
 * 认证 UseCase
 */
class AuthenticateUseCase(
    private val clientFactory: suspend (ServerType, String, String, String, String) -> ServerConfig
) {
    suspend operator fun invoke(
        type: ServerType,
        url: String,
        username: String,
        password: String,
        token: String = ""
    ): Result<ServerConfig> {
        return try {
            val config = clientFactory(type, url, username, password, token)
            Result.success(config)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取媒体库列表 UseCase
 */
class GetLibrariesUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(): Result<List<EmbyLibrary>> {
        return try {
            val client = getClient()
            val libraries = client.getLibraries()
            Result.success(libraries)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取视频列表 UseCase
 */
class GetVideosUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(
        parentId: String?,
        library: EmbyLibrary?,
        feedType: FeedType,
        skip: Int,
        limit: Int,
        orientationMode: OrientationMode,
        includeIds: List<String>? = null
    ): Result<VideoResponse> {
        return try {
            val client = getClient()
            val response = client.getVideos(
                parentId = parentId,
                library = library,
                feedType = feedType,
                skip = skip,
                limit = limit,
                orientationMode = orientationMode,
                includeIds = includeIds
            )
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取继续观看项 UseCase
 */
class GetResumeItemsUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(): Result<List<EmbyItem>> {
        return try {
            val client = getClient()
            val items = client.getResumeItems()
            Result.success(items)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取视频 URL UseCase
 */
class GetVideoUrlUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(item: EmbyItem, mode: PlayMode = PlayMode.DIRECT): Result<String> {
        return try {
            val client = getClient()
            val url = client.getVideoUrl(item, mode)
            Result.success(url)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 切换收藏状态 UseCase
 */
class ToggleFavoriteUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(
        item: EmbyItem,
        libraryName: String
    ): Result<Boolean> {
        return try {
            val client = getClient()
            val currentFavorite = item.UserData?.IsFavorite ?: false
            val newFavorite = !currentFavorite

            client.toggleFavorite(item.Id, newFavorite, libraryName)

            Result.success(newFavorite)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 搜索 UseCase
 */
class SearchItemsUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(query: String): Result<List<EmbyItem>> {
        return try {
            if (query.length < 2) {
                return Result.success(emptyList())
            }

            val client = getClient()
            val items = client.searchItems(query)
            Result.success(items)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取字幕轨道 UseCase
 */
class GetSubtitleTracksUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(itemId: String): Result<List<SubtitleTrack>> {
        return try {
            val client = getClient()
            val tracks = client.getSubtitleTracks(itemId)
            Result.success(tracks)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 删除媒体项 UseCase
 */
class DeleteItemUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(itemId: String): Result<Unit> {
        return try {
            val client = getClient()
            client.deleteItem(itemId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * 获取服务端收藏 UseCase
 */
class GetFavoritesUseCase(
    private val getClient: suspend () -> MediaClient
) {
    suspend operator fun invoke(libraryName: String): Result<Set<String>> {
        return try {
            val client = getClient()
            val favorites = client.getFavorites(libraryName)
            Result.success(favorites)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

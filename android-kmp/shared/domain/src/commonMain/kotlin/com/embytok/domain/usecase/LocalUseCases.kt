package com.embytok.domain.usecase

import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.LocalFavoriteCollection
import com.embytok.domain.model.WatchHistoryItem
import com.embytok.repository.LocalRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

/**
 * 观看历史 UseCase
 *
 * 封装观看历史相关的业务逻辑：
 * - 添加/更新观看记录（带淘汰策略）
 * - 获取完整历史
 * - 获取单条记录（用于断点续播）
 */
class WatchHistoryUseCase(
    private val repository: LocalRepository
) {
    fun getAll(): Flow<List<WatchHistoryItem>> = repository.getAllWatchHistory()

    fun getItem(itemId: String): Flow<WatchHistoryItem?> = repository.getWatchHistoryItem(itemId)

    /**
     * 记录观看历史（每 5 秒调用一次，最多保留 100 条）
     */
    suspend fun add(item: EmbyItem, positionTicks: Long, totalTicks: Long) {
        // 简单验证：位置小于总时长，且大于 0
        if (positionTicks <= 0 || totalTicks <= 0 || positionTicks > totalTicks) return
        repository.addToWatchHistory(item, positionTicks, totalTicks)
    }

    suspend fun remove(itemId: String) = repository.removeFromWatchHistory(itemId)
    suspend fun clear() = repository.clearWatchHistory()
    suspend fun getCount(): Long = repository.getWatchHistoryCount()

    /**
     * 获取指定 item 的上次播放位置（ticks）
     */
    suspend fun getLastPositionTicks(itemId: String): Long {
        return getItem(itemId).firstOrNull()?.positionTicks ?: 0L
    }

    /**
     * 获取播放进度百分比（0f~1f）
     */
    suspend fun getProgress(itemId: String): Float {
        val history = getItem(itemId).firstOrNull() ?: return 0f
        if (history.totalTicks <= 0) return 0f
        return (history.positionTicks.toFloat() / history.totalTicks.toFloat())
            .coerceIn(0f, 1f)
    }
}

/**
 * 搜索历史 UseCase
 */
class SearchHistoryUseCase(
    private val repository: LocalRepository
) {
    fun getRecent(limit: Int = 10): Flow<List<String>> = repository.getRecentSearches(limit)

    suspend fun add(query: String) {
        if (query.isBlank()) return
        repository.addToSearchHistory(query.trim())
    }

    suspend fun clear() = repository.clearSearchHistory()
}

/**
 * 本地收藏合集 UseCase
 *
 * 封装本地收藏合集管理：
 * - 创建/重命名/删除合集
 * - 添加/删除条目
 * - 判断是否已收藏（用于 UI 状态）
 */
class CollectionUseCase(
    private val repository: LocalRepository
) {
    fun getAll(): Flow<List<LocalFavoriteCollection>> = repository.getAllCollections()

    fun getItemIds(collectionId: String): Flow<List<String>> =
        repository.getItemIdsInCollection(collectionId)

    suspend fun create(name: String, description: String? = null): String {
        if (name.isBlank()) throw IllegalArgumentException("合集名不能为空")
        return repository.createCollection(name, description)
    }

    suspend fun rename(collectionId: String, newName: String) {
        if (newName.isBlank()) return
        repository.renameCollection(collectionId, newName)
    }

    suspend fun delete(collectionId: String) = repository.deleteCollection(collectionId)

    suspend fun addItemToCollection(collectionId: String, item: EmbyItem) {
        repository.addItemToCollection(collectionId, item.Id, item.Name, null)
    }

    suspend fun removeItemFromCollection(collectionId: String, itemId: String) =
        repository.removeItemFromCollection(collectionId, itemId)

    suspend fun isInCollection(collectionId: String, itemId: String): Boolean =
        repository.isItemInCollection(collectionId, itemId)

    /**
     * 切换条目在默认合集中的收藏状态
     */
    suspend fun toggleInDefaultCollection(item: EmbyItem): Boolean {
        val defaultId = LocalFavoriteCollection.DEFAULT_ID
        val isFavorite = repository.isItemInCollection(defaultId, item.Id)
        return if (isFavorite) {
            repository.removeItemFromCollection(defaultId, item.Id)
            false
        } else {
            // 如果默认合集不存在，先创建
            val collections = getAll().firstOrNull()
            if (collections?.none { it.id == defaultId } == true) {
                repository.createCollection("默认收藏", "默认本地收藏合集")
            }
            repository.addItemToCollection(defaultId, item.Id, item.Name, null)
            true
        }
    }
}

/**
 * 隐藏库 UseCase（用于隐藏不感兴趣的媒体库）
 */
class HiddenLibrariesUseCase(
    private val repository: LocalRepository
) {
    fun getHiddenIds(): Flow<Set<String>> = repository.getHiddenLibraryIds()

    suspend fun toggle(libId: String, name: String? = null) =
        repository.toggleLibraryHidden(libId, name)

    suspend fun isHidden(libId: String): Boolean = repository.isLibraryHidden(libId)
}

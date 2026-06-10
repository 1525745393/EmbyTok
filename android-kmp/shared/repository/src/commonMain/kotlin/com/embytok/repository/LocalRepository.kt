package com.embytok.repository

import com.embytok.db.EmbyTokDatabase
import com.embytok.db.WatchHistory
import com.embytok.db.SearchHistory
import com.embytok.db.FavoriteCollections
import com.embytok.db.FavoriteCollectionItems
import com.embytok.db.HiddenLibraries
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.LocalFavoriteCollection
import com.embytok.domain.model.WatchHistoryItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.datetime.Clock

/**
 * 本地存储仓库接口
 */
interface LocalRepository {
    // 观看历史
    fun getAllWatchHistory(): Flow<List<WatchHistoryItem>>
    fun getWatchHistoryItem(itemId: String): Flow<WatchHistoryItem?>
    suspend fun addToWatchHistory(item: EmbyItem, positionTicks: Long, totalTicks: Long)
    suspend fun removeFromWatchHistory(itemId: String)
    suspend fun clearWatchHistory()
    suspend fun getWatchHistoryCount(): Long

    // 搜索历史
    fun getRecentSearches(limit: Int = 10): Flow<List<String>>
    suspend fun addToSearchHistory(query: String)
    suspend fun clearSearchHistory()

    // 本地收藏合集
    fun getAllCollections(): Flow<List<LocalFavoriteCollection>>
    fun getCollectionById(collectionId: String): Flow<LocalFavoriteCollection?>
    fun getItemIdsInCollection(collectionId: String): Flow<List<String>>
    suspend fun createCollection(name: String, description: String? = null): String
    suspend fun renameCollection(collectionId: String, newName: String)
    suspend fun deleteCollection(collectionId: String)
    suspend fun addItemToCollection(collectionId: String, itemId: String, title: String? = null, imageUrl: String? = null)
    suspend fun removeItemFromCollection(collectionId: String, itemId: String)
    suspend fun isItemInCollection(collectionId: String, itemId: String): Boolean

    // 隐藏库
    fun getHiddenLibraryIds(): Flow<Set<String>>
    suspend fun toggleLibraryHidden(libId: String, name: String? = null)
    suspend fun isLibraryHidden(libId: String): Boolean
}

/**
 * 本地存储实现（基于 SQLDelight）
 */
class SqlDelightRepository(
    private val database: EmbyTokDatabase
) : LocalRepository {

    private val logger = com.embytok.common.EmbyTokLogger
    private val watchHistoryQueries = database.watchHistoryQueries
    private val searchHistoryQueries = database.searchHistoryQueries
    private val favoriteCollectionsQueries = database.favoriteCollectionsQueries
    private val favoriteCollectionItemsQueries = database.favoriteCollectionItemsQueries
    private val hiddenLibrariesQueries = database.hiddenLibrariesQueries

    // ============ 观看历史 ============

    override fun getAllWatchHistory(): Flow<List<WatchHistoryItem>> {
        return watchHistoryQueries.selectAllOrdered().asFlow()
            .map { queryResult ->
                queryResult.executeAsList().map { row ->
                    WatchHistoryItem(
                        itemId = row.itemId,
                        item = null, // 懒加载
                        positionTicks = row.positionTicks,
                        totalTicks = row.totalTicks,
                        watchedAtMillis = row.watchedAtMillis
                    )
                }
            }
    }

    override fun getWatchHistoryItem(itemId: String): Flow<WatchHistoryItem?> {
        return watchHistoryQueries.selectById(itemId).asFlow()
            .map { it.executeAsOneOrNull()?.let { row ->
                WatchHistoryItem(
                    itemId = row.itemId,
                    item = null,
                    positionTicks = row.positionTicks,
                    totalTicks = row.totalTicks,
                    watchedAtMillis = row.watchedAtMillis
                )
            }}
    }

    override suspend fun addToWatchHistory(item: EmbyItem, positionTicks: Long, totalTicks: Long) {
        val now = Clock.System.now().toEpochMilliseconds()

        watchHistoryQueries.transaction {
            // 先更新或插入
            val existing = watchHistoryQueries.selectById(item.Id).executeAsOneOrNull()
            if (existing == null) {
                watchHistoryQueries.insert(
                    itemId = item.Id,
                    positionTicks = positionTicks,
                    totalTicks = totalTicks,
                    watchedAtMillis = now,
                    title = item.Name,
                    imageUrl = null,
                    runTimeTicks = item.runTimeTicks,
                    type = item.Type,
                    parentId = item.ParentId
                )
            } else {
                watchHistoryQueries.update(
                    positionTicks = positionTicks,
                    totalTicks = totalTicks,
                    watchedAtMillis = now,
                    title = item.Name,
                    itemId = item.Id
                )
            }

            // 淘汰：超过 100 条时删除最早的
            val count = watchHistoryQueries.selectCount().executeAsOne()
            if (count > 100) {
                watchHistoryQueries.deleteOldestByLimit(1)
            }
        }

        logger.d("已记录观看历史: ${item.Name} (pos=$positionTicks)", "SqlDelightRepository")
    }

    override suspend fun removeFromWatchHistory(itemId: String) {
        watchHistoryQueries.deleteById(itemId)
        logger.d("已删除观看历史: $itemId", "SqlDelightRepository")
    }

    override suspend fun clearWatchHistory() {
        watchHistoryQueries.deleteAll()
        logger.d("已清空观看历史", "SqlDelightRepository")
    }

    override suspend fun getWatchHistoryCount(): Long {
        return watchHistoryQueries.selectCount().executeAsOne()
    }

    // ============ 搜索历史 ============

    override fun getRecentSearches(limit: Int): Flow<List<String>> {
        return searchHistoryQueries.selectRecent(limit.toLong()).asFlow()
            .map { queryResult ->
                queryResult.executeAsList().map { it.query }
            }
    }

    override suspend fun addToSearchHistory(query: String) {
        val now = Clock.System.now().toEpochMilliseconds()
        searchHistoryQueries.transaction {
            searchHistoryQueries.insert(query, now)
            // 保留最近 10 条
            val count = searchHistoryQueries.selectCount().executeAsOne()
            if (count > 10) {
                searchHistoryQueries.deleteOldestByLimit(count - 10)
            }
        }
    }

    override suspend fun clearSearchHistory() {
        searchHistoryQueries.deleteAll()
    }

    // ============ 本地收藏合集 ============

    override fun getAllCollections(): Flow<List<LocalFavoriteCollection>> {
        return favoriteCollectionsQueries.selectAll().asFlow()
            .map { queryResult ->
                queryResult.executeAsList().map { row ->
                    LocalFavoriteCollection(
                        id = row.id,
                        name = row.name,
                        createdAtMillis = row.createdAtMillis,
                        itemIds = emptyList() // 单独查询
                    )
                }
            }
    }

    override fun getCollectionById(collectionId: String): Flow<LocalFavoriteCollection?> {
        return favoriteCollectionsQueries.selectById(collectionId).asFlow()
            .map { it.executeAsOneOrNull()?.let { row ->
                LocalFavoriteCollection(
                    id = row.id,
                    name = row.name,
                    createdAtMillis = row.createdAtMillis,
                    itemIds = emptyList()
                )
            }}
    }

    override fun getItemIdsInCollection(collectionId: String): Flow<List<String>> {
        return favoriteCollectionItemsQueries.selectByCollectionId(collectionId).asFlow()
            .map { queryResult ->
                queryResult.executeAsList().map { it.itemId }
            }
    }

    override suspend fun createCollection(name: String, description: String?): String {
        val id = "collection_${System.currentTimeMillis()}_${(0..9999).random()}"
        val now = Clock.System.now().toEpochMilliseconds()
        favoriteCollectionsQueries.insert(id, name, now, description)
        logger.d("创建收藏合集: $name", "SqlDelightRepository")
        return id
    }

    override suspend fun renameCollection(collectionId: String, newName: String) {
        favoriteCollectionsQueries.updateName(newName, collectionId)
    }

    override suspend fun deleteCollection(collectionId: String) {
        favoriteCollectionsQueries.transaction {
            // 先删除合集关联的条目（ON DELETE CASCADE 也可用）
            favoriteCollectionItemsQueries.deleteByCollectionId(collectionId)
            favoriteCollectionsQueries.deleteById(collectionId)
        }
    }

    override suspend fun addItemToCollection(
        collectionId: String,
        itemId: String,
        title: String?,
        imageUrl: String?
    ) {
        favoriteCollectionItemsQueries.insert(collectionId, itemId, title, imageUrl)
    }

    override suspend fun removeItemFromCollection(collectionId: String, itemId: String) {
        favoriteCollectionItemsQueries.deleteByCollectionAndItem(collectionId, itemId)
    }

    override suspend fun isItemInCollection(collectionId: String, itemId: String): Boolean {
        return favoriteCollectionItemsQueries.existsByCollectionAndItem(collectionId, itemId)
            .executeAsOne() > 0
    }

    // ============ 隐藏库 ============

    override fun getHiddenLibraryIds(): Flow<Set<String>> {
        return hiddenLibrariesQueries.selectAll().asFlow()
            .map { queryResult ->
                queryResult.executeAsList().map { it.libId }.toSet()
            }
    }

    override suspend fun toggleLibraryHidden(libId: String, name: String?) {
        val existing = hiddenLibrariesQueries.selectById(libId).executeAsOneOrNull()
        if (existing != null) {
            hiddenLibrariesQueries.deleteById(libId)
        } else {
            val now = Clock.System.now().toEpochMilliseconds()
            hiddenLibrariesQueries.insert(libId, name, now)
        }
    }

    override suspend fun isLibraryHidden(libId: String): Boolean {
        return hiddenLibrariesQueries.selectById(libId).executeAsOneOrNull() != null
    }
}

package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.model.EmbyItem
import com.embytok.db.WatchHistoryRow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 观看历史 ViewModel
 *
 * 功能：
 *  - 从 SQLDelight 加载所有观看历史
 *  - 将 WatchHistoryRow 转换为 EmbyItem（用于播放）
 *  - 删除单条历史记录
 *  - 清空所有历史记录
 *  - 继续播放（恢复进度）
 */
class WatchHistoryViewModel(application: Application) : AndroidViewModel(application) {

    data class HistoryItem(
        val itemId: String,
        val title: String,
        val imageUrl: String?,
        val runTimeTicks: Long?,
        val positionTicks: Long,
        val totalTicks: Long,
        val watchedAtMillis: Long,
        val type: String?
    ) {
        /** 播放进度百分比（0.0 ~ 1.0） */
        val progress: Float
            get() = if (totalTicks > 0) {
                (positionTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f)
            } else 0f

        /** 剩余时长（毫秒） */
        val remainingMs: Long
            get() = (totalTicks - positionTicks) / 10_000L
    }

    data class HistoryState(
        val items: List<HistoryItem> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null
    )

    private val _state = MutableStateFlow(HistoryState())
    val state: StateFlow<HistoryState> = _state.asStateFlow()

    init {
        loadHistory()
    }

    fun loadHistory() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            ServiceLocator.localRepository.getAllWatchHistory().collect { rows ->
                val items = rows.map { row ->
                    HistoryItem(
                        itemId = row.itemId,
                        title = row.title ?: "未知标题",
                        imageUrl = row.imageUrl,
                        runTimeTicks = row.runTimeTicks,
                        positionTicks = row.positionTicks,
                        totalTicks = row.totalTicks,
                        watchedAtMillis = row.watchedAtMillis,
                        type = row.type
                    )
                }
                _state.value = HistoryState(items = items, isLoading = false)
            }
        }
    }

    fun removeItem(itemId: String) {
        viewModelScope.launch {
            ServiceLocator.localRepository.removeFromWatchHistory(itemId)
        }
    }

    fun clearAll() {
        viewModelScope.launch {
            ServiceLocator.localRepository.clearWatchHistory()
        }
    }
}

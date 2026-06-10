package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 视频流首页视图模型。
 *
 * 负责：
 *   - 加载媒体库列表（Emby: /Libraries, Plex: /library/sections）
 *   - 根据当前选中的媒体库与筛选条件加载视频列表
 *   - 管理排序与方向过滤
 */
class FeedViewModel(
    private val authenticateUseCase: AuthenticateUseCase
) : ViewModel() {

    data class FeedState(
        val isLoading: Boolean = false,
        val libraries: List<EmbyLibrary> = emptyList(),
        val selectedLibrary: EmbyLibrary? = null,
        val items: List<EmbyItem> = emptyList(),
        val filteredItems: List<EmbyItem> = emptyList(),
        val sort: SortMode = SortMode.LATEST,
        val orientation: OrientationFilter = OrientationFilter.ALL,
        val errorMessage: String? = null
    )

    enum class SortMode(val display: String) {
        LATEST("最新添加"),
        MOST_PLAYED("最多播放"),
        RATING("评分最高"),
        NAME("按名称")
    }

    enum class OrientationFilter(val display: String) {
        PORTRAIT("竖屏视频"),
        LANDSCAPE("横屏视频"),
        ALL("全部方向")
    }

    private val _state = MutableStateFlow(FeedState())
    val state: StateFlow<FeedState> = _state.asStateFlow()

    private var mediaClient: MediaClient? = null

    init {
        // 延迟创建媒体客户端（通过登录流程保存的配置）
        viewModelScope.launch {
            ensureClient()
            loadLibraries()
        }
    }

    // ===== 公共 API：UI 事件 =====

    fun selectLibrary(library: EmbyLibrary) {
        _state.value = _state.value.copy(selectedLibrary = library)
        loadItems()
    }

    fun setSort(sort: SortMode) {
        _state.value = _state.value.copy(sort = sort)
        applyFilter()
    }

    fun setOrientation(filter: OrientationFilter) {
        _state.value = _state.value.copy(orientation = filter)
        applyFilter()
    }

    fun refresh() {
        loadLibraries()
    }

    // ===== 内部逻辑 =====

    private fun ensureClient() {
        if (mediaClient != null) return
        mediaClient = authenticateUseCase.clientOrNull()
    }

    private fun loadLibraries() {
        val client = mediaClient ?: run {
            _state.value = _state.value.copy(errorMessage = "尚未登录")
            return
        }
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            val result = runCatching { client.getLibraries() }
            if (result.isSuccess) {
                val libs = result.getOrDefault(emptyList())
                val selected = _state.value.selectedLibrary
                    ?: libs.firstOrNull()
                _state.value = _state.value.copy(
                    libraries = libs,
                    selectedLibrary = selected
                )
                if (selected != null) {
                    loadItems()
                } else {
                    _state.value = _state.value.copy(isLoading = false)
                }
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message ?: "加载媒体库失败"
                )
            }
        }
    }

    private fun loadItems() {
        val client = mediaClient ?: return
        val library = _state.value.selectedLibrary ?: return

        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val itemsResult = runCatching { client.getLibraryItems(library.Id) }
            if (itemsResult.isSuccess) {
                val items = itemsResult.getOrDefault(emptyList())
                _state.value = _state.value.copy(items = items, isLoading = false)
                applyFilter()
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = itemsResult.exceptionOrNull()?.message ?: "加载视频失败"
                )
            }
        }
    }

    private fun applyFilter() {
        val s = _state.value
        val oriented = when (s.orientation) {
            OrientationFilter.PORTRAIT -> s.items.filter {
                it.Width != null && it.Height != null && it.Height > it.Width
            }
            OrientationFilter.LANDSCAPE -> s.items.filter {
                it.Width != null && it.Height != null && it.Width > it.Height
            }
            OrientationFilter.ALL -> s.items
        }
        val sorted = when (s.sort) {
            SortMode.LATEST -> oriented // 服务端已按最新排序
            SortMode.MOST_PLAYED -> oriented.sortedByDescending { it.UserData?.PlayCount ?: 0 }
            SortMode.RATING -> oriented.sortedByDescending {
                runCatching { it.UserData?.PlayCount ?: 0 }.getOrDefault(0)
            }
            SortMode.NAME -> oriented.sortedBy { it.Name }
        }
        _state.value = s.copy(filteredItems = sorted)
    }
}

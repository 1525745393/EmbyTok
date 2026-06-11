package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

/**
 * 首页视频流 ViewModel
 *
 * 构造时通过 ServiceLocator 读取一次保存的服务器配置，
 * 构造对应的 MediaClient（EmbyClient 或 PlexClient），
 * 然后通过该 MediaClient 拉取媒体库和视频列表。
 */
class FeedViewModel(application: Application) : AndroidViewModel(application) {

    data class FeedState(
        val isLoading: Boolean = false,
        val libraries: List<EmbyLibrary> = emptyList(),
        val selectedLibrary: EmbyLibrary? = null,
        val items: List<EmbyItem> = emptyList(),
        val errorMessage: String? = null
    )

    enum class OrientationFilter(val display: String) {
        PORTRAIT("竖屏视频"),
        LANDSCAPE("横屏视频"),
        ALL("全部方向")
    }

    enum class SortMode(val display: String) {
        LATEST("最新添加"),
        MOST_PLAYED("最多播放"),
        NAME("按名称")
    }

    private val _state = MutableStateFlow(FeedState())
    val state: StateFlow<FeedState> = _state.asStateFlow()

    private val _orientation = MutableStateFlow(OrientationFilter.ALL)
    val orientation: StateFlow<OrientationFilter> = _orientation.asStateFlow()

    private val _sort = MutableStateFlow(SortMode.LATEST)
    val sort: StateFlow<SortMode> = _sort.asStateFlow()

    private var client: MediaClient? = runBlocking(Dispatchers.IO) {
        ServiceLocator.authenticateUseCase.currentClient()
    }

    /** 对外暴露 MediaClient 实例，供 UI 层构造图片/视频 URL */
    val mediaClient: MediaClient?
        get() = client

    init {
        viewModelScope.launch {
            if (client == null) {
                // 尝试再次刷新（可能初始化时 DataStore 还没读到）
                client = ServiceLocator.authenticateUseCase.currentClient()
            }
            loadLibraries()
        }
    }

    fun reload() {
        viewModelScope.launch {
            client = ServiceLocator.authenticateUseCase.currentClient()
            loadLibraries()
        }
    }

    fun selectLibrary(library: EmbyLibrary) {
        _state.value = _state.value.copy(selectedLibrary = library)
        loadItems()
    }

    fun setOrientation(filter: OrientationFilter) {
        _orientation.value = filter
    }

    fun setSort(mode: SortMode) {
        _sort.value = mode
    }

    private suspend fun loadLibraries() {
        val c = client ?: run {
            _state.value = _state.value.copy(errorMessage = "需要先登录")
            return
        }
        _state.value = _state.value.copy(isLoading = true, errorMessage = null)
        val result = runCatching { c.getLibraries() }
        if (result.isSuccess) {
            val libs = result.getOrDefault(emptyList())
            val selected = _state.value.selectedLibrary ?: libs.firstOrNull()
            _state.value = _state.value.copy(
                libraries = libs,
                selectedLibrary = selected
            )
            if (selected != null) loadItems()
            else _state.value = _state.value.copy(isLoading = false)
        } else {
            _state.value = _state.value.copy(
                isLoading = false,
                errorMessage = result.exceptionOrNull()?.message ?: "加载失败"
            )
        }
    }

    private fun loadItems() {
        val c = client ?: return
        val lib = _state.value.selectedLibrary ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            val itemsResult = runCatching { c.getLibraryItems(lib.Id) }
            if (itemsResult.isSuccess) {
                val items = itemsResult.getOrDefault(emptyList())
                _state.value = _state.value.copy(items = items, isLoading = false)
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = itemsResult.exceptionOrNull()?.message ?: "加载失败"
                )
            }
        }
    }

    /** 根据方向和排序模式过滤后的视频列表 */
    val filteredItems: StateFlow<List<EmbyItem>> =
        kotlinx.coroutines.flow.combine(
            _state,
            _orientation,
            _sort
        ) { s, orient, mode ->
            var list = s.items
            list = when (orient) {
                OrientationFilter.PORTRAIT -> list.filter {
                    it.Width != null && it.Height != null && it.Height > it.Width
                }
                OrientationFilter.LANDSCAPE -> list.filter {
                    it.Width != null && it.Height != null && it.Width > it.Height
                }
                OrientationFilter.ALL -> list
            }
            list = when (mode) {
                SortMode.LATEST -> list
                SortMode.MOST_PLAYED -> list.sortedByDescending { it.UserData?.PlayCount ?: 0 }
                SortMode.NAME -> list.sortedBy { it.Name }
            }
            list
        }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
}

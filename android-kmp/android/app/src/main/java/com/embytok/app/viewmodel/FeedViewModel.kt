package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.FeedType
import com.embytok.domain.model.OrientationMode
import com.embytok.domain.model.SortMode
import com.embytok.usecase.GetFavoriteVideosUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetRecentVideosUseCase
import com.embytok.usecase.GetVideosUseCase
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * Feed 视频流 ViewModel
 *
 * 负责：
 *  - 维护视频列表、库选择、排序、方向过滤
 *  - 调用 use case 获取视频数据
 *  - 通过 [uiState] 暴露给 UI
 */
@OptIn(ExperimentalCoroutinesApi::class)
class FeedViewModel(
    private val getLibrariesUseCase: GetLibrariesUseCase,
    private val getVideosUseCase: GetVideosUseCase,
    private val getRecentVideosUseCase: GetRecentVideosUseCase,
    private val getFavoriteVideosUseCase: GetFavoriteVideosUseCase,
    private val preferences: AppPreferences
) : ViewModel() {

    // ====== 内部可变状态 ======
    private val _libraries = MutableStateFlow<List<EmbyLibrary>>(emptyList())
    private val _currentLibrary = MutableStateFlow<EmbyLibrary?>(null)
    private val _sortMode = MutableStateFlow(SortMode.DATE_ADDED_DESC)
    private val _orientationMode = MutableStateFlow(OrientationMode.BOTH)
    private val _feedType = MutableStateFlow(FeedType.ALL)
    private val _videos = MutableStateFlow<List<EmbyItem>>(emptyList())
    private val _isLoading = MutableStateFlow(false)
    private val _statusMessage = MutableStateFlow<String?>(null)

    /**
     * UI 状态聚合（单一数据源）。
     */
    data class UiState(
        val libraries: List<EmbyLibrary>,
        val currentLibrary: EmbyLibrary?,
        val sortMode: SortMode,
        val orientationMode: OrientationMode,
        val feedType: FeedType,
        val videos: List<EmbyItem>,
        val isLoading: Boolean,
        val statusMessage: String?
    )

    val uiState: StateFlow<UiState> = combine(
        _libraries,
        _currentLibrary,
        _sortMode,
        _orientationMode,
        _feedType,
        _videos,
        _isLoading,
        _statusMessage
    ) { a1, a2, a3, a4, a5, a6, a7, a8 ->
        UiState(a1, a2, a3, a4, a5, a6, a7, a8)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = UiState(
            libraries = emptyList(),
            currentLibrary = null,
            sortMode = SortMode.DATE_ADDED_DESC,
            orientationMode = OrientationMode.BOTH,
            feedType = FeedType.ALL,
            videos = emptyList(),
            isLoading = false,
            statusMessage = null
        )
    )

    // ====== 初始化 ======
    init {
        loadLibraries()
    }

    // ====== 公开方法 ======

    /**
     * 加载媒体库列表。
     */
    fun loadLibraries() {
        viewModelScope.launch {
            _isLoading.value = true
            _statusMessage.value = "加载媒体库..."
            try {
                val result = getLibrariesUseCase.execute()
                _libraries.value = result
                _currentLibrary.value = result.firstOrNull()
                _statusMessage.value = null
                // 自动加载第一个库的视频
                _currentLibrary.value?.let { loadVideos(it) }
            } catch (e: Exception) {
                _statusMessage.value = "加载媒体库失败: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * 选择指定媒体库。
     */
    fun selectLibrary(library: EmbyLibrary) {
        _currentLibrary.value = library
        loadVideos(library)
    }

    /**
     * 设置排序方式并刷新。
     */
    fun setSortMode(mode: SortMode) {
        _sortMode.value = mode
        _currentLibrary.value?.let { loadVideos(it) }
    }

    /**
     * 设置方向过滤并刷新。
     */
    fun setOrientationMode(mode: OrientationMode) {
        _orientationMode.value = mode
        _currentLibrary.value?.let { loadVideos(it) }
    }

    /**
     * 设置 Feed 类型并刷新（全部 / 最近 / 收藏）。
     */
    fun setFeedType(type: FeedType) {
        _feedType.value = type
        _currentLibrary.value?.let { loadVideos(it) }
    }

    // ====== 内部实现 ======

    private fun loadVideos(library: EmbyLibrary) {
        viewModelScope.launch {
            _isLoading.value = true
            _statusMessage.value = "加载视频..."
            try {
                val result: List<EmbyItem> = when (_feedType.value) {
                    FeedType.ALL -> getVideosUseCase.execute(library.Id)
                    FeedType.RECENT -> getRecentVideosUseCase.execute(library.Id, limit = 30)
                    FeedType.FAVORITE -> getFavoriteVideosUseCase.execute(library.Id)
                }

                // 方向过滤
                val filtered = when (_orientationMode.value) {
                    OrientationMode.BOTH -> result
                    OrientationMode.PORTRAIT -> result.filter { it.Orientation == "portrait" || it.Width < it.Height }
                    OrientationMode.LANDSCAPE -> result.filter { it.Orientation == "landscape" || it.Width >= it.Height }
                }

                // 排序
                val sorted = when (_sortMode.value) {
                    SortMode.DATE_ADDED_DESC -> filtered.sortedByDescending { it.DateCreated }
                    SortMode.PLAY_COUNT_DESC -> filtered.sortedByDescending { it.UserData?.PlayCount ?: 0 }
                    SortMode.RATING_DESC -> filtered.sortedByDescending { it.CommunityRating ?: 0f }
                    SortMode.NAME_ASC -> filtered.sortedBy { it.Name }
                }

                _videos.value = sorted
                _statusMessage.value = null
            } catch (e: Exception) {
                _statusMessage.value = "加载视频失败: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}

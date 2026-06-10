package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.domain.model.*
import com.embytok.usecase.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Feed UI 状态
 */
data class FeedUiState(
    val isLoading: Boolean = true,
    val videos: List<EmbyItem> = emptyList(),
    val libraries: List<EmbyLibrary> = emptyList(),
    val selectedLibrary: EmbyLibrary? = null,
    val feedType: FeedType = FeedType.LATEST,
    val orientationMode: OrientationMode = OrientationMode.BOTH,
    val currentIndex: Int = 0,
    val hasMore: Boolean = true,
    val error: String? = null,
    val isRefreshing: Boolean = false,
    val favoriteIds: Set<String> = emptySet()
)

/**
 * Feed ViewModel
 */
class FeedViewModel(
    private val getLibrariesUseCase: GetLibrariesUseCase,
    private val getVideosUseCase: GetVideosUseCase,
    private val getFavoritesUseCase: GetFavoritesUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase,
    private val getResumeItemsUseCase: GetResumeItemsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeedUiState())
    val uiState: StateFlow<FeedUiState> = _uiState.asStateFlow()

    private var currentPage = 0
    private val pageSize = 20

    init {
        loadInitialData()
    }

    fun loadInitialData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            // 加载媒体库
            getLibrariesUseCase().fold(
                onSuccess = { libraries ->
                    _uiState.update { it.copy(libraries = libraries) }
                    // 加载第一个库的视频
                    loadVideos()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }

    fun loadVideos(reset: Boolean = false) {
        if (reset) {
            currentPage = 0
            _uiState.update { it.copy(videos = emptyList(), hasMore = true) }
        }

        if (!_uiState.value.hasMore) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            val state = _uiState.value

            getVideosUseCase(
                parentId = null,
                library = state.selectedLibrary,
                feedType = state.feedType,
                skip = currentPage * pageSize,
                limit = pageSize,
                orientationMode = state.orientationMode
            ).fold(
                onSuccess = { response ->
                    _uiState.update { currentState ->
                        currentState.copy(
                            isLoading = false,
                            videos = if (reset) response.items else currentState.videos + response.items,
                            hasMore = response.items.size >= pageSize,
                            error = null
                        )
                    }
                    currentPage++
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }

    fun loadMore() {
        if (!_uiState.value.isLoading && _uiState.value.hasMore) {
            loadVideos()
        }
    }

    fun refresh() {
        _uiState.update { it.copy(isRefreshing = true) }
        currentPage = 0
        loadVideos(reset = true)
        _uiState.update { it.copy(isRefreshing = false) }
    }

    fun selectLibrary(library: EmbyLibrary?) {
        _uiState.update { it.copy(selectedLibrary = library) }
        loadVideos(reset = true)
    }

    fun setFeedType(feedType: FeedType) {
        _uiState.update { it.copy(feedType = feedType) }
        loadVideos(reset = true)
    }

    fun setOrientationMode(mode: OrientationMode) {
        _uiState.update { it.copy(orientationMode = mode) }
        loadVideos(reset = true)
    }

    fun setCurrentIndex(index: Int) {
        _uiState.update { it.copy(currentIndex = index) }

        // 预加载逻辑：当接近末尾时加载更多
        val threshold = _uiState.value.videos.size - 5
        if (index >= threshold) {
            loadMore()
        }
    }

    fun toggleFavorite(item: EmbyItem) {
        viewModelScope.launch {
            val libraryName = _uiState.value.selectedLibrary?.Name ?: "default"

            toggleFavoriteUseCase(item, libraryName).fold(
                onSuccess = { isFavorite ->
                    _uiState.update { state ->
                        val newFavorites = if (isFavorite) {
                            state.favoriteIds + item.Id
                        } else {
                            state.favoriteIds - item.Id
                        }
                        state.copy(favoriteIds = newFavorites)
                    }
                },
                onFailure = { /* 忽略错误 */ }
            )
        }
    }

    fun shuffle() {
        if (_uiState.value.feedType == FeedType.RANDOM) {
            loadVideos(reset = true)
        } else {
            setFeedType(FeedType.RANDOM)
        }
    }

    fun isFavorite(itemId: String): Boolean {
        return _uiState.value.favoriteIds.contains(itemId) ||
                _uiState.value.videos.find { it.Id == itemId }?.UserData?.IsFavorite == true
    }
}

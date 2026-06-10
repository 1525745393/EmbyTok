package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.usecase.SearchItemsUseCase
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * 搜索 UI 状态
 */
data class SearchUiState(
    val query: String = "",
    val results: List<com.embytok.domain.model.EmbyItem> = emptyList(),
    val isLoading: Boolean = false,
    val hasSearched: Boolean = false,
    val error: String? = null
)

/**
 * 搜索 ViewModel
 */
@OptIn(FlowPreview::class)
class SearchViewModel(
    private val searchItemsUseCase: SearchItemsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private val _queryFlow = MutableStateFlow("")

    init {
        // 防抖 300ms
        viewModelScope.launch {
            _queryFlow
                .debounce(300)
                .distinctUntilChanged()
                .filter { it.length >= 2 }
                .collect { query ->
                    performSearch(query)
                }
        }
    }

    fun updateQuery(query: String) {
        _uiState.update { it.copy(query = query) }
        _queryFlow.value = query

        if (query.isEmpty()) {
            _uiState.update { it.copy(results = emptyList(), hasSearched = false) }
        }
    }

    private suspend fun performSearch(query: String) {
        _uiState.update { it.copy(isLoading = true, error = null) }

        searchItemsUseCase(query).fold(
            onSuccess = { items ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        results = items,
                        hasSearched = true
                    )
                }
            },
            onFailure = { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message,
                        hasSearched = true
                    )
                }
            }
        )
    }

    fun clearSearch() {
        _uiState.update { SearchUiState() }
        _queryFlow.value = ""
    }
}

/**
 * 设置 ViewModel
 */
data class SettingsUiState(
    val language: String = "中文",
    val orientationMode: com.embytok.domain.model.OrientationMode = com.embytok.domain.model.OrientationMode.BOTH,
    val isMuted: Boolean = false,
    val isAutoPlay: Boolean = true,
    val appVersion: String = "1.0.0",
    val isCheckingUpdate: Boolean = false,
    val updateAvailable: Boolean = false,
    val latestVersion: String? = null,
    val releaseNotes: String? = null
)

class SettingsViewModel(
    private val preferencesManager: Any? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    fun setLanguage(language: String) {
        _uiState.update { it.copy(language = language) }
    }

    fun setOrientationMode(mode: com.embytok.domain.model.OrientationMode) {
        _uiState.update { it.copy(orientationMode = mode) }
    }

    fun setMuted(muted: Boolean) {
        _uiState.update { it.copy(isMuted = muted) }
    }

    fun setAutoPlay(enabled: Boolean) {
        _uiState.update { it.copy(isAutoPlay = enabled) }
    }

    fun checkForUpdates() {
        viewModelScope.launch {
            _uiState.update { it.copy(isCheckingUpdate = true) }
            // TODO: 实现版本检查
            _uiState.update { it.copy(isCheckingUpdate = false) }
        }
    }
}

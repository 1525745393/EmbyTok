package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

/**
 * 搜索 ViewModel
 *
 * 支持防抖搜索，用户输入后延迟 300ms 再发起请求
 */
class SearchViewModel(application: Application) : AndroidViewModel(application) {

    data class SearchState(
        val query: String = "",
        val results: List<EmbyItem> = emptyList(),
        val isLoading: Boolean = false,
        val errorMessage: String? = null,
        val recentSearches: List<String> = emptyList()
    )

    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private var client: MediaClient? = runBlocking(Dispatchers.IO) {
        ServiceLocator.authenticateUseCase.currentClient()
    }

    init {
        // 防抖搜索：用户停止输入 300ms 后触发
        @OptIn(FlowPreview::class)
        _query
            .debounce(300)
            .onEach { q ->
                if (q.isNotBlank()) {
                    performSearch(q)
                } else {
                    _state.value = _state.value.copy(results = emptyList(), errorMessage = null)
                }
            }
            .launchIn(viewModelScope)

        // 加载最近搜索历史
        loadRecentSearches()
    }

    fun setQuery(newQuery: String) {
        _query.value = newQuery
        _state.value = _state.value.copy(query = newQuery)
    }

    fun search() {
        val q = _query.value.trim()
        if (q.isNotBlank()) {
            performSearch(q)
        }
    }

    fun clearQuery() {
        _query.value = ""
        _state.value = _state.value.copy(query = "", results = emptyList(), errorMessage = null)
    }

    fun removeRecentSearch(query: String) {
        _state.value = _state.value.copy(
            recentSearches = _state.value.recentSearches.filter { it != query }
        )
    }

    fun clearRecentSearches() {
        _state.value = _state.value.copy(recentSearches = emptyList())
    }

    private fun performSearch(q: String) {
        val c = client ?: run {
            _state.value = _state.value.copy(errorMessage = "需要先登录")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)

            val result = withContext(Dispatchers.IO) {
                runCatching { c.searchItems(q) }
            }

            if (result.isSuccess) {
                val items = result.getOrDefault(emptyList())
                _state.value = _state.value.copy(
                    results = items,
                    isLoading = false
                )
                // 保存到搜索历史
                addToRecentSearches(q)
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message ?: "搜索失败"
                )
            }
        }
    }

    private fun addToRecentSearches(query: String) {
        val current = _state.value.recentSearches.toMutableList()
        // 移除重复项
        current.remove(query)
        // 添加到开头
        current.add(0, query)
        // 最多保留 10 条
        val trimmed = current.take(10)
        _state.value = _state.value.copy(recentSearches = trimmed)
    }

    private fun loadRecentSearches() {
        // TODO: 从 SQLDelight 加载搜索历史
        // 暂时使用空列表
    }
}

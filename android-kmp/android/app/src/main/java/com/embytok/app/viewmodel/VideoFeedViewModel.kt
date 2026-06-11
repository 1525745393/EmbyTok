package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.player.VideoPlayerManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * TikTok 风格竖屏视频流 ViewModel
 *
 * 功能：
 *  - 管理视频列表
 *  - 当前播放索引
 *  - 播放/暂停/跳转控制
 *  - 与 VideoPlayerManager 集成
 */
class VideoFeedViewModel(application: Application) : AndroidViewModel(application) {

    private val _items = MutableStateFlow<List<EmbyItem>>(emptyList())
    val items: StateFlow<List<EmbyItem>> = _items.asStateFlow()

    val currentIndex = MutableStateFlow(0)

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // 当前 MediaClient
    private var mediaClient: MediaClient? = null

    // VideoPlayerManager 单例
    private val playerManager: VideoPlayerManager by lazy {
        ServiceLocator.playerManager
    }

    val currentPositionMs: StateFlow<Long>
        get() = playerManager.currentPositionMs

    init {
        viewModelScope.launch {
            mediaClient = ServiceLocator.authenticateUseCase.currentClient()
        }
    }

    /**
     * 加载视频列表（从指定媒体库）
     */
    fun loadItems(libraryId: String) {
        val client = mediaClient ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            val result = runCatching { client.getLibraryItems(libraryId) }
            result.fold(
                onSuccess = { items ->
                    _items.value = items
                    _isLoading.value = false
                    // 自动播放第一个
                    if (items.isNotEmpty()) {
                        playAt(0)
                    }
                },
                onFailure = { e ->
                    _error.value = e.message ?: "加载失败"
                    _isLoading.value = false
                }
            )
        }
    }

    /**
     * 设置视频列表（直接传入）
     */
    fun setItems(newItems: List<EmbyItem>) {
        _items.value = newItems
        if (newItems.isNotEmpty() && currentIndex.value == 0) {
            playAt(0)
        }
    }

    /**
     * 在指定索引播放视频
     */
    fun playAt(index: Int) {
        val itemList = _items.value
        if (index < 0 || index >= itemList.size) return

        currentIndex.value = index
        val item = itemList[index]
        val client = mediaClient ?: return

        viewModelScope.launch {
            _isLoading.value = true
            // 构造播放 URL
            val streamUrl = client.buildVideoStreamUrl(item.Id)
            // 从本地存储恢复播放进度
            val savedProgress = ServiceLocator.localRepository
                .getWatchHistoryItem(item.Id)
                .let { flow ->
                    var result = 0L
                    flow.collect { result = it?.positionTicks ?: 0L }
                    result
                }
            val startPos = savedProgress / 10_000 // ticks -> ms

            playerManager.prepareAndPlay(
                streamUrl = streamUrl,
                item = item,
                startPositionMs = startPos
            )
            _isLoading.value = false
            _isPlaying.value = true
        }
    }

    /** 播放/暂停切换 */
    fun togglePlayPause() {
        if (_isPlaying.value) {
            playerManager.pause()
            _isPlaying.value = false
        } else {
            playerManager.play()
            _isPlaying.value = true
        }
    }

    /** 快进/快退 */
    fun seekTo(positionMs: Long) {
        playerManager.seekTo(positionMs)
    }

    /** 播放上一个 */
    fun playPrevious() {
        val newIndex = currentIndex.value - 1
        if (newIndex >= 0) playAt(newIndex)
    }

    /** 播放下一个 */
    fun playNext() {
        val newIndex = currentIndex.value + 1
        if (newIndex < _items.value.size) playAt(newIndex)
    }

    override fun onCleared() {
        super.onCleared()
        // 不释放 playerManager，它是单例
    }
}

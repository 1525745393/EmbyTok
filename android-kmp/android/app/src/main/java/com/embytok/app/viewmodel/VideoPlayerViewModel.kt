package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.player.PlaybackState
import com.embytok.player.VideoPlayerManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

/**
 * 播放页 ViewModel（单个视频播放）
 *
 * 构建过程:
 *   1) 通过 ServiceLocator.authenticateUseCase 获取当前 MediaClient
 *   2) 基于 MediaClient 创建 VideoPlayerManager 驱动 ExoPlayer
 *
 * 为了避免在构造过程中进行挂起调用，使用 runBlocking(Dispatchers.IO)
 * 读取一次 DataStore 配置来构造 MediaClient。
 */
class VideoPlayerViewModel(application: Application) : AndroidViewModel(application) {

    private val mediaClient: MediaClient? = runBlocking(Dispatchers.IO) {
        ServiceLocator.authenticateUseCase.currentClient()
    }

    private val _manager: VideoPlayerManager by lazy {
        VideoPlayerManager(
            context = application.applicationContext,
            mediaClient = mediaClient
        )
    }

    // 暴露 manager 供 VideoCard 使用
    val playerManager: VideoPlayerManager
        get() = _manager

    val playbackState: StateFlow<PlaybackState> = _manager.playbackState
        .stateIn(viewModelScope, SharingStarted.Eagerly, PlaybackState.Idle)

    val currentPositionMs: StateFlow<Long> = _manager.currentPositionMs
    val durationMs: StateFlow<Long> = _manager.durationMs

    private val _isFavorite = MutableStateFlow(false)
    val isFavorite: StateFlow<Boolean> = _isFavorite.asStateFlow()

    private val _speed = MutableStateFlow(1.0f)
    val speed: StateFlow<Float> = _speed.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    val exoPlayer: androidx.media3.exoplayer.ExoPlayer?
        get() = _manager.getPlayer()

    fun prepare(item: EmbyItem) {
        viewModelScope.launch {
            withContext(Dispatchers.Main.immediate) {
                _manager.prepare(item)
            }
        }
    }

    fun play() = _manager.play()
    fun pause() = _manager.pause()
    fun togglePlayPause() = _manager.togglePlayPause()
    fun seekTo(positionMs: Long) = _manager.seekTo(positionMs)

    fun setSpeed(speed: Float) {
        _speed.value = speed
        _manager.setSpeed(speed)
    }

    fun toggleMute() {
        val next = !_isMuted.value
        _isMuted.value = next
        _manager.setMuted(next)
    }

    fun toggleFavorite() {
        _isFavorite.value = !_isFavorite.value
    }

    override fun onCleared() {
        super.onCleared()
        _manager.release()
    }
}

/**
 * 视频流 ViewModel（支持 TikTok 风格的垂直滑动列表）
 *
 * 管理视频列表、当前播放位置、播放状态
 */
class VideoFeedViewModel(application: Application) : AndroidViewModel(application) {

    private val mediaClient: MediaClient? = runBlocking(Dispatchers.IO) {
        ServiceLocator.authenticateUseCase.currentClient()
    }

    private val _manager: VideoPlayerManager by lazy {
        VideoPlayerManager(
            context = application.applicationContext,
            mediaClient = mediaClient
        )
    }

    val playerManager: VideoPlayerManager
        get() = _manager

    // 视频列表
    private val _items = MutableStateFlow<List<EmbyItem>>(emptyList())
    val items: StateFlow<List<EmbyItem>> = _items.asStateFlow()

    // 当前播放索引
    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    // 当前播放的视频
    private val _currentItem = MutableStateFlow<EmbyItem?>(null)
    val currentItem: StateFlow<EmbyItem?> = _currentItem.asStateFlow()

    // 播放状态
    val playbackState: StateFlow<PlaybackState> = _manager.playbackState
        .stateIn(viewModelScope, SharingStarted.Eagerly, PlaybackState.Idle)

    val currentPositionMs: StateFlow<Long> = _manager.currentPositionMs
    val durationMs: StateFlow<Long> = _manager.durationMs

    private val _isFavorite = MutableStateFlow(false)
    val isFavorite: StateFlow<Boolean> = _isFavorite.asStateFlow()

    private val _speed = MutableStateFlow(1.0f)
    val speed: StateFlow<Float> = _speed.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    val exoPlayer: androidx.media3.exoplayer.ExoPlayer?
        get() = _manager.getPlayer()

    /** 设置视频列表 */
    fun setItems(newItems: List<EmbyItem>) {
        _items.value = newItems
        if (newItems.isNotEmpty() && _currentIndex.value >= newItems.size) {
            _currentIndex.value = 0
        }
    }

    /** 播放指定位置的视频 */
    fun playAt(index: Int) {
        val item = _items.value.getOrNull(index) ?: return

        // 更新索引和当前项
        _currentIndex.value = index
        _currentItem.value = item

        // 准备并播放
        viewModelScope.launch {
            withContext(Dispatchers.Main.immediate) {
                _manager.prepare(item)
                _manager.play()
            }
        }
    }

    /** 播放下一个视频 */
    fun playNext() {
        val nextIndex = (_currentIndex.value + 1) % _items.value.size
        playAt(nextIndex)
    }

    /** 播放上一个视频 */
    fun playPrevious() {
        val prevIndex = if (_currentIndex.value == 0) _items.value.size - 1 else _currentIndex.value - 1
        playAt(prevIndex)
    }

    fun togglePlayPause() = _manager.togglePlayPause()
    fun pause() = _manager.pause()
    fun play() = _manager.play()
    fun seekTo(positionMs: Long) = _manager.seekTo(positionMs)

    fun setSpeed(speed: Float) {
        _speed.value = speed
        _manager.setSpeed(speed)
    }

    fun toggleMute() {
        val next = !_isMuted.value
        _isMuted.value = next
        _manager.setMuted(next)
    }

    fun toggleFavorite() {
        _isFavorite.value = !_isFavorite.value
        // TODO: 同步到服务器
    }

    override fun onCleared() {
        super.onCleared()
        _manager.release()
    }
}

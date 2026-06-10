package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.FeedType
import com.embytok.domain.model.OrientationMode
import com.embytok.domain.model.SubtitleSettings
import com.embytok.domain.client.MediaClient
import com.embytok.repository.LocalRepository
import com.embytok.player.PlayerMode
import com.embytok.player.PlaybackState
import com.embytok.player.VideoPlayerManager
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * 视频播放 ViewModel
 *
 * 负责：
 * - 管理当前播放的 EmbyItem 列表
 * - 管理播放器状态
 * - 与 DataStore 偏好设置同步
 * - 与 SQLDelight 本地存储（观看历史/收藏）同步
 */
class VideoPlayerViewModel(
    private val mediaClient: MediaClient?,
    private val preferences: AppPreferences,
    private val localRepository: LocalRepository,
    private val playerManager: VideoPlayerManager
) : ViewModel() {

    // 视频列表
    private val _items = MutableStateFlow<List<EmbyItem>>(emptyList())
    val items: StateFlow<List<EmbyItem>> = _items.asStateFlow()

    // 当前索引
    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    // 当前播放项
    val currentItem: StateFlow<EmbyItem?> = combine(_items, _currentIndex) { items, idx ->
        items.getOrNull(idx)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // UI 偏好
    val orientationMode: StateFlow<OrientationMode> = preferences.orientationMode
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), OrientationMode.BOTH)
    val isMuted: StateFlow<Boolean> = preferences.isMuted
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)
    val isAutoPlay: StateFlow<Boolean> = preferences.isAutoPlay
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)
    val subtitleSettings: StateFlow<SubtitleSettings> = preferences.subtitleSettings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SubtitleSettings())

    // 收藏合集列表
    val collections = localRepository.getAllCollections()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // 播放状态（来自 PlayerManager）
    val playbackState: StateFlow<PlaybackState> = playerManager.playbackState
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), PlaybackState.Idle)

    // 当前播放进度（用于显示进度条）
    val currentPositionMs: StateFlow<Long> = playerManager.currentPositionMs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)
    val durationMs: StateFlow<Long> = playerManager.durationMs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    // 播放模式（用于 UI 显示直链/转码状态）
    val currentMode: StateFlow<PlayerMode> = playerManager.currentModeState
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), PlayerMode.DIRECT)

    init {
        // 初始化播放器
        playerManager.initializePlayer()

        // 设置进度保存回调（每5秒保存一次到 SQLDelight）
        playerManager.setOnProgressChangedListener { positionTicks, totalTicks ->
            val item = currentItem.value ?: return@setOnProgressChangedListener
            viewModelScope.launch {
                localRepository.addToWatchHistory(item, positionTicks, totalTicks)
            }
        }
    }

    /**
     * 加载视频列表
     */
    fun loadItems(newItems: List<EmbyItem>) {
        _items.value = newItems
        _currentIndex.value = 0
    }

    /**
     * 播放指定位置的视频
     */
    fun playAt(index: Int) {
        if (index < 0 || index >= _items.value.size) return
        _currentIndex.value = index

        val item = _items.value[index] ?: return
        viewModelScope.launch {
            // 从历史中获取上次播放位置
            val historyItem = localRepository.getWatchHistoryItem(item.Id).firstOrNull()
            val startPosMs = historyItem?.let { (it.positionTicks / 10_000L).toLong() } ?: 0L
            playerManager.play(item, startPosMs)
        }
    }

    /**
     * 播放下一条（用于手势/滑动）
     */
    fun playNext() {
        val nextIdx = _currentIndex.value + 1
        if (nextIdx < _items.value.size) {
            playAt(nextIdx)
        }
    }

    /**
     * 播放上一条
     */
    fun playPrevious() {
        val prevIdx = _currentIndex.value - 1
        if (prevIdx >= 0) {
            playAt(prevIdx)
        }
    }

    // ============ 播放控制 ============
    fun togglePlayPause() = playerManager.togglePlayPause()
    fun seekForward(seconds: Int = 10) = playerManager.seekForward(seconds)
    fun seekBackward(seconds: Int = 10) = playerManager.seekBackward(seconds)
    fun seekTo(positionMs: Long) = playerManager.seekTo(positionMs)
    fun setPlaybackSpeed(speed: Float) = playerManager.setPlaybackSpeed(speed)

    // ============ UI 偏好控制 ============
    fun toggleMuted() {
        val newValue = !isMuted.value
        viewModelScope.launch {
            preferences.setMuted(newValue)
            playerManager.setMuted(newValue)
        }
    }

    fun setOrientationMode(mode: OrientationMode) {
        viewModelScope.launch { preferences.setOrientationMode(mode) }
    }

    fun saveSubtitleSettings(settings: SubtitleSettings) {
        viewModelScope.launch { preferences.saveSubtitleSettings(settings) }
    }

    // ============ 收藏合集 ============
    fun createCollection(name: String) {
        viewModelScope.launch { localRepository.createCollection(name) }
    }

    fun addCurrentItemToCollection(collectionId: String) {
        val item = currentItem.value ?: return
        viewModelScope.launch {
            localRepository.addItemToCollection(collectionId, item.Id, item.Name, null)
        }
    }

    // ============ 生命周期 ============
    override fun onCleared() {
        super.onCleared()
        playerManager.release()
    }
}

package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.FeedType
import com.embytok.domain.model.OrientationMode
import com.embytok.domain.model.SubtitleSettings
import com.embytok.repository.LocalRepository
import com.embytok.player.PlayerMode
import com.embytok.player.PlaybackState
import com.embytok.player.VideoPlayerManager
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * 视频播放 ViewModel
 *
 * 负责：
 *  - 管理当前播放视频列表
 *  - 与 [VideoPlayerManager] 交互（播放/暂停/快进）
 *  - 与 [LocalRepository] 交互（观看历史/收藏）
 *  - 与 [AppPreferences] 同步 UI 偏好（方向/静音/字幕）
 *
 * 公开的 Flow 均以 [StateFlow] 形式暴露，Composable 用 `collectAsState()` 订阅。
 */
@OptIn(ExperimentalCoroutinesApi::class)
class VideoPlayerViewModel(
    val playerManager: VideoPlayerManager,
    private val preferences: AppPreferences,
    private val localRepository: LocalRepository
) : ViewModel() {

    // ===== 视频列表 & 当前索引 =====
    private val _items = MutableStateFlow<List<EmbyItem>>(emptyList())
    val items: StateFlow<List<EmbyItem>> = _items.asStateFlow()

    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    /** 当前正在播放的 EmbyItem（由 items + currentIndex 派生） */
    val currentItem: StateFlow<EmbyItem?> = combine(_items, _currentIndex) { items, idx ->
        items.getOrNull(idx)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // ===== UI 偏好（来自 DataStore） =====
    val orientationMode: StateFlow<OrientationMode> = preferences.orientationMode
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), OrientationMode.BOTH)
    val isMuted: StateFlow<Boolean> = preferences.isMuted
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)
    val isAutoPlay: StateFlow<Boolean> = preferences.isAutoPlay
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)
    val subtitleSettings: StateFlow<SubtitleSettings> = preferences.subtitleSettings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SubtitleSettings())

    // ===== 收藏合集（本地） =====
    val collections: StateFlow<List<com.embytok.domain.model.LocalFavoriteCollection>> =
        localRepository.getAllCollections()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // ===== 播放状态（来自 PlayerManager） =====
    val playbackState: StateFlow<PlaybackState> = playerManager.playbackState
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), PlaybackState.Idle)

    val currentPositionMs: StateFlow<Long> = playerManager.currentPositionMs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val durationMs: StateFlow<Long> = playerManager.durationMs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val currentMode: StateFlow<PlayerMode> = playerManager.currentModeState
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), PlayerMode.DIRECT)

    // ===== 初始化 =====
    init {
        // 将进度保存回调挂到 PlayerManager（每 5 秒保存一次）
        playerManager.setOnProgressChangedListener { positionTicks, totalTicks ->
            val item = currentItem.value ?: return@setOnProgressChangedListener
            viewModelScope.launch {
                localRepository.addToWatchHistory(item, positionTicks, totalTicks)
            }
        }
    }

    // ===== 视频列表控制 =====
    fun loadItems(newItems: List<EmbyItem>) {
        _items.value = newItems
        if (_currentIndex.value >= newItems.size) {
            _currentIndex.value = 0
        }
    }

    fun playAt(index: Int) {
        if (index < 0 || index >= _items.value.size) return
        _currentIndex.value = index
        val item = _items.value[index] ?: return

        viewModelScope.launch {
            // 读取历史播放位置（断点续播）
            val history = localRepository.getAllWatchHistory().firstOrNull()
                ?.firstOrNull { it.item.Id == item.Id }
            val startPosMs = history?.let { (it.positionTicks / 10_000L).toLong() } ?: 0L
            playerManager.play(item, startPosMs)
        }
    }

    fun playNext() {
        val next = _currentIndex.value + 1
        if (next < _items.value.size) playAt(next)
    }

    fun playPrevious() {
        val prev = _currentIndex.value - 1
        if (prev >= 0) playAt(prev)
    }

    // ===== 播放控制 =====
    fun togglePlayPause() = playerManager.togglePlayPause()
    fun seekForward(seconds: Int = 10) = playerManager.seekForward(seconds)
    fun seekBackward(seconds: Int = 10) = playerManager.seekBackward(seconds)
    fun seekTo(positionMs: Long) = playerManager.seekTo(positionMs)
    fun setPlaybackSpeed(speed: Float) = playerManager.setPlaybackSpeed(speed)

    // ===== UI 偏好 =====
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

    // ===== 收藏合集 =====
    fun createCollection(name: String) {
        viewModelScope.launch { localRepository.createCollection(name) }
    }

    fun addCurrentItemToCollection(collectionId: String) {
        val item = currentItem.value ?: return
        viewModelScope.launch {
            localRepository.addItemToCollection(collectionId, item.Id, item.Name, null)
        }
    }

    override fun onCleared() {
        super.onCleared()
        playerManager.release()
    }
}

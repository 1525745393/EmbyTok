package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.pip.PictureInPictureManager
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.SubtitleTrack
import com.embytok.player.PlaybackState
import com.embytok.player.VideoPlayerManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
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
 *   3) 集成 LocalRepository 保存播放进度
 *
 * 为了避免在构造过程中进行挂起调用，使用 runBlocking(Dispatchers.IO)
 * 读取一次 DataStore 配置来构造 MediaClient。
 */
class VideoPlayerViewModel(application: Application) : AndroidViewModel(application) {

    private val mediaClient: MediaClient? = runBlocking(Dispatchers.IO) {
        ServiceLocator.authenticateUseCase.currentClient()
    }

    /** 对外暴露 MediaClient 实例，供 UI 层构造图片/视频 URL */
    val client: MediaClient?
        get() = mediaClient

    private var currentItem: EmbyItem? = null

    private val _manager: VideoPlayerManager by lazy {
        VideoPlayerManager(
            context = application.applicationContext,
            mediaClient = mediaClient
        ).also { manager ->
            // 设置进度回调，每 5 秒保存一次播放进度
            manager.setOnProgressChanged { positionTicks, totalTicks ->
                currentItem?.let { item ->
                    viewModelScope.launch {
                        ServiceLocator.localRepository.addToWatchHistory(
                            item = item,
                            positionTicks = positionTicks,
                            totalTicks = totalTicks
                        )
                    }
                }
            }
        }
    }

    // 暴露 manager 供 VideoCard 使用
    val playerManager: VideoPlayerManager
        get() = _manager

    // PiP 管理器（初始为 null，首次需要时创建，并绑定当前 Activity）
    private var _pipManager: PictureInPictureManager? = null

    val pipManager: PictureInPictureManager?
        get() = _pipManager

    // PiP 支持状态
    val isPipSupported: Boolean
        get() = _pipManager?.isSupported() == true

    /**
     * 初始化/更新 PiP 管理器与当前 Activity 的绑定
     * 必须在 Activity 创建后调用（如 PlayerScreen 的 LaunchedEffect 中）
     */
    fun initPipManager(activity: android.app.Activity) {
        val existing = _pipManager
        if (existing == null) {
            _pipManager = PictureInPictureManager(activity, _manager)
        } else {
            existing.updateActivity(activity)
        }
    }

    /** 进入画中画模式 */
    fun enterPictureInPicture(): Boolean {
        val pip = _pipManager ?: return false
        return try {
            val ratio = pip.calculateVideoAspectRatio()
            pip.enterPictureInPicture(
                aspectRatio = ratio,
                title = currentItem?.Name
            )
        } catch (e: Exception) {
            android.util.Log.e("VideoPlayerViewModel", "进入 PiP 失败", e)
            false
        }
    }

    // ===== 播放状态
    val playbackState: StateFlow<PlaybackState> = _manager.playbackState
        .stateIn(viewModelScope, SharingStarted.Eagerly, PlaybackState.Idle)

    val currentPositionMs: StateFlow<Long> = _manager.currentPositionMs
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0L)

    val durationMs: StateFlow<Long> = _manager.durationMs
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0L)

    private val _isFavorite = MutableStateFlow(false)
    val isFavorite: StateFlow<Boolean> = _isFavorite.asStateFlow()

    private val _speed = MutableStateFlow(1.0f)
    val speed: StateFlow<Float> = _speed.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    // 字幕状态
    val subtitleTracks: StateFlow<List<SubtitleTrack>> = _manager.subtitleTracksState
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    private val _currentSubtitleIndex = MutableStateFlow(-1)
    val currentSubtitleIndex: StateFlow<Int> = _currentSubtitleIndex.asStateFlow()

    val exoPlayer: androidx.media3.exoplayer.ExoPlayer?
        get() = _manager.getPlayer()

    /** 切换到指定字幕轨道，-1 表示关闭 */
    fun selectSubtitle(index: Int) {
        _currentSubtitleIndex.value = index
        if (index >= 0) {
            _manager.setSubtitleTrack(index)
        } else {
            _manager.disableSubtitles()
        }
    }

    fun prepare(item: EmbyItem) {
        currentItem = item
        // 从 UserData 获取初始收藏状态
        _isFavorite.value = item.UserData?.IsFavorite ?: false

        viewModelScope.launch {
            // 尝试从观看历史恢复播放进度
            val savedProgress = ServiceLocator.localRepository
                .getWatchHistoryItem(item.Id)
                .first()
            val startPositionTicks = savedProgress?.positionTicks ?: 0L

            withContext(Dispatchers.Main.immediate) {
                _manager.prepare(item, startPositionTicks)
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

    /**
     * 切换收藏状态
     * 同时同步到服务器
     */
    /** 切换收藏状态 */
    fun toggleFavorite() {
        val item = currentItem ?: return
        val newFavoriteState = !_isFavorite.value

        viewModelScope.launch {
            val success = runCatching {
                mediaClient?.toggleFavorite(item.Id) ?: false
            }.getOrDefault(false)

            if (success) {
                _isFavorite.value = newFavoriteState
            }
        }
    }

    /** 进入画中画模式 */
    fun enterPictureInPicture(activityContext: android.content.Context): Boolean {
        if (!_pipManager.isSupported()) return false
        return try {
            val ratio = _pipManager.calculateVideoAspectRatio()
            // 复用已有 _pipManager，但传入当前 activity context
            _pipManager.enterPictureInPicture(
                aspectRatio = ratio,
                title = currentItem?.Name
            )
        } catch (e: Exception) {
            android.util.Log.e("VideoPlayerViewModel", "进入 PiP 失败", e)
            false
        }
    }

    /** 标记为已观看 */
    fun markAsWatched() {
        val item = currentItem ?: return
        viewModelScope.launch {
            mediaClient?.markAsWatched(item.Id)
        }
    }

    override fun onCleared() {
        super.onCleared()
        // 保存最终播放进度
        currentItem?.let { item ->
            val pos = _manager.currentPositionMs.value
            val dur = _manager.durationMs.value
            if (pos > 0) {
                runCatching {
                    ServiceLocator.localRepository.addToWatchHistory(
                        item = item,
                        positionTicks = pos * 10_000L,
                        totalTicks = dur * 10_000L
                    )
                }
            }
        }
        _manager.release()
    }
}

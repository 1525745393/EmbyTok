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
 * 播放页 ViewModel
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

    private val manager: VideoPlayerManager by lazy {
        VideoPlayerManager(
            context = application.applicationContext,
            mediaClient = mediaClient
        )
    }

    val playbackState: StateFlow<PlaybackState> = manager.playbackState
        .stateIn(viewModelScope, SharingStarted.Eagerly, PlaybackState.Idle)

    val currentPositionMs: StateFlow<Long> = manager.currentPositionMs
    val durationMs: StateFlow<Long> = manager.durationMs

    private val _isFavorite = MutableStateFlow(false)
    val isFavorite: StateFlow<Boolean> = _isFavorite.asStateFlow()

    private val _speed = MutableStateFlow(1.0f)
    val speed: StateFlow<Float> = _speed.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    val exoPlayer: androidx.media3.exoplayer.ExoPlayer?
        get() = manager.getPlayer()

    fun prepare(item: EmbyItem) {
        viewModelScope.launch {
            withContext(Dispatchers.Main.immediate) {
                manager.prepare(item)
            }
        }
    }

    fun play() = manager.play()
    fun pause() = manager.pause()
    fun togglePlayPause() = manager.togglePlayPause()
    fun seekTo(positionMs: Long) = manager.seekTo(positionMs)

    fun setSpeed(speed: Float) {
        _speed.value = speed
        manager.setSpeed(speed)
    }

    fun toggleMute() {
        val next = !_isMuted.value
        _isMuted.value = next
        manager.setMuted(next)
    }

    fun toggleFavorite() {
        _isFavorite.value = !_isFavorite.value
    }

    override fun onCleared() {
        super.onCleared()
        manager.release()
    }
}

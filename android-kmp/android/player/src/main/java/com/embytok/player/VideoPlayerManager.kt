package com.embytok.player

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.datasource.HttpDataSource
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.SubtitleTrack
import com.embytok.domain.client.MediaClient
import com.embytok.domain.client.PlayMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect
import java.util.concurrent.TimeUnit

/**
 * 播放模式
 */
enum class PlayerMode {
    DIRECT,     // 直链播放
    TRANSCODE,  // 转码播放
    FALLBACK    // 降级播放
}

/**
 * 播放状态
 */
sealed class PlaybackState {
    object Idle : PlaybackState()
    object Buffering : PlaybackState()
    object Ready : PlaybackState()
    object Playing : PlaybackState()
    object Paused : PlaybackState()
    data class Error(val message: String) : PlaybackState()
    object Ended : PlaybackState()
}

/**
 * 视频播放器管理器
 *
 * 负责：
 * - 创建/管理 ExoPlayer 实例
 * - 处理视频播放逻辑（直链/转码/降级）
 * - 监听播放状态并上报
 * - 处理字幕轨道选择
 * - 提供进度和倍速控制
 *
 * 注意：此管理器与 ViewModel 不同，不依赖 ViewModel，作为纯播放器服务使用。
 */
class VideoPlayerManager(
    private val context: Context,
    private val mediaClient: MediaClient?,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main + Job())
) {

    private var exoPlayer: ExoPlayer? = null
    private var currentItem: EmbyItem? = null
    private var currentMode: PlayerMode = PlayerMode.DIRECT
    private var playbackPositionMs: Long = 0L
    private var playbackSpeed: Float = 1.0f
    private var isMuted: Boolean = false

    // 进度保存周期（秒）
    private val PROGRESS_SAVE_INTERVAL_SECONDS = 5

    private val _playbackState = MutableStateFlow<PlaybackState>(PlaybackState.Idle)
    val playbackState: StateFlow<PlaybackState> = _playbackState.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs.asStateFlow()

    private val _currentModeState = MutableStateFlow(currentMode)
    val currentModeState: StateFlow<PlayerMode> = _currentModeState.asStateFlow()

    private var progressTrackerJob: Job? = null
    private var onProgressChanged: ((positionTicks: Long, totalTicks: Long) -> Unit)? = null

    /**
     * 初始化播放器
     */
    fun initializePlayer(): ExoPlayer {
        if (exoPlayer != null) {
            return exoPlayer!!
        }

        val dataSourceFactory = DefaultHttpDataSource.Factory()
            .setUserAgent("EmbyTokApp/1.0 (Android)")
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(30_000)

        exoPlayer = ExoPlayer.Builder(context)
            .setMediaSourceFactory(
                DefaultMediaSourceFactory(context)
                    .setDataSourceFactory(dataSourceFactory)
            )
            .build()
            .also { player ->
                player.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        handlePlaybackStateChanged(playbackState)
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        _playbackState.value = PlaybackState.Error(error.message ?: "Unknown error")
                        handlePlayerError()
                    }

                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        _playbackState.value = if (isPlaying) PlaybackState.Playing else PlaybackState.Paused
                    }
                })
            }

        return exoPlayer!!
    }

    /**
     * 播放指定视频
     */
    suspend fun play(item: EmbyItem, startPositionMs: Long = 0L) {
        currentItem = item
        playbackPositionMs = startPositionMs

        // 准备播放（默认直链模式）
        preparePlayback(item, PlayerMode.DIRECT, startPositionMs)
    }

    /**
     * 准备播放：根据模式选择 URL 并准备 ExoPlayer
     */
    private suspend fun preparePlayback(
        item: EmbyItem,
        mode: PlayerMode,
        positionMs: Long = 0L
    ) {
        val player = exoPlayer ?: initializePlayer()

        currentMode = mode
        _currentModeState.value = mode
        _playbackState.value = PlaybackState.Buffering

        // 获取视频 URL
        val videoUrl = try {
            mediaClient?.getVideoUrl(item, when (mode) {
                PlayerMode.DIRECT -> PlayMode.DIRECT
                PlayerMode.TRANSCODE -> PlayMode.TRANSCODE
                PlayerMode.FALLBACK -> PlayMode.FALLBACK
            }) ?: buildFallbackUrl(item)
        } catch (e: Exception) {
            // 降级策略：直链失败 -> 尝试转码
            if (mode == PlayerMode.DIRECT) {
                android.util.Log.w("VideoPlayerManager", "直链播放失败，降级至转码模式")
                preparePlayback(item, PlayerMode.TRANSCODE, positionMs)
                return
            } else if (mode == PlayerMode.TRANSCODE) {
                android.util.Log.w("VideoPlayerManager", "转码播放失败，降级至 fallback 模式")
                preparePlayback(item, PlayerMode.FALLBACK, positionMs)
                return
            } else {
                _playbackState.value = PlaybackState.Error("视频加载失败：${e.message}")
                return
            }
        }

        try {
            val mediaItem = MediaItem.Builder()
                .setUri(videoUrl)
                .setMimeType(guessMimeType(item, mode))
                .build()

            player.setMediaItem(mediaItem)
            player.prepare()
            if (positionMs > 0) {
                player.seekTo(positionMs)
            }
            player.playWhenReady = true

            // 启动进度跟踪
            startProgressTracking()

            _playbackState.value = PlaybackState.Playing
        } catch (e: Exception) {
            _playbackState.value = PlaybackState.Error("播放器准备失败：${e.message}")
            handlePlayerError()
        }
    }

    /**
     * 处理播放状态变化
     */
    private fun handlePlaybackStateChanged(playbackState: Int) {
        when (playbackState) {
            Player.STATE_IDLE -> _playbackState.value = PlaybackState.Idle
            Player.STATE_BUFFERING -> _playbackState.value = PlaybackState.Buffering
            Player.STATE_READY -> _playbackState.value = PlaybackState.Ready
            Player.STATE_ENDED -> {
                _playbackState.value = PlaybackState.Ended
                // 视频播放结束：保存最终进度
                currentItem?.let { item ->
                    val durationTicks = (exoPlayer?.duration ?: 0L) * 10000L
                    onProgressChanged?.invoke(durationTicks, durationTicks)
                }
            }
        }

        exoPlayer?.let { player ->
            _durationMs.value = player.duration.coerceAtLeast(0L)
        }
    }

    /**
     * 处理播放错误：自动降级策略
     */
    private fun handlePlayerError() {
        val currentItem = this.currentItem ?: return

        // 降级：DIRECT -> TRANSCODE -> FALLBACK
        val nextMode = when (currentMode) {
            PlayerMode.DIRECT -> PlayerMode.TRANSCODE
            PlayerMode.TRANSCODE -> PlayerMode.FALLBACK
            PlayerMode.FALLBACK -> null // 已降级到底，停止
        }

        if (nextMode != null) {
            coroutineScope.launch {
                android.util.Log.w("VideoPlayerManager", "降级到 $nextMode 模式")
                preparePlayback(currentItem, nextMode, playbackPositionMs)
            }
        }
    }

    /**
     * 启动进度跟踪（每5秒更新一次）
     */
    private fun startProgressTracking() {
        progressTrackerJob?.cancel()
        progressTrackerJob = coroutineScope.launch {
            while (true) {
                delay(500L)
                val player = exoPlayer ?: break
                if (player.playbackState == Player.STATE_READY) {
                    val pos = player.currentPosition
                    _currentPositionMs.value = pos

                    // 每 PROGRESS_SAVE_INTERVAL_SECONDS 秒保存一次进度
                    if (pos / 1000L % PROGRESS_SAVE_INTERVAL_SECONDS == 0L && pos > 0) {
                        val positionTicks = pos * 10_000L
                        val totalTicks = (player.duration.coerceAtLeast(0L)) * 10_000L
                        onProgressChanged?.invoke(positionTicks, totalTicks)
                    }
                }
            }
        }
    }

    /**
     * 设置进度变化回调（用于保存到数据库）
     */
    fun setOnProgressChangedListener(listener: (positionTicks: Long, totalTicks: Long) -> Unit) {
        this.onProgressChanged = listener
    }

    /**
     * 播放控制
     */
    fun play() { exoPlayer?.play() }
    fun pause() { exoPlayer?.pause() }
    fun togglePlayPause() {
        exoPlayer?.let { if (it.isPlaying) it.pause() else it.play() }
    }

    /**
     * 进度控制
     */
    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs.coerceAtLeast(0L))
        _currentPositionMs.value = positionMs
    }

    fun seekForward(seconds: Int = 10) {
        seekTo(_currentPositionMs.value + (seconds * 1000L))
    }

    fun seekBackward(seconds: Int = 10) {
        seekTo(_currentPositionMs.value - (seconds * 1000L))
    }

    /**
     * 倍速控制
     */
    fun setPlaybackSpeed(speed: Float) {
        playbackSpeed = speed
        exoPlayer?.setPlaybackSpeed(speed)
    }

    fun getPlaybackSpeed(): Float = playbackSpeed

    /**
     * 静音控制
     */
    fun setMuted(muted: Boolean) {
        isMuted = muted
        exoPlayer?.volume = if (muted) 0f else 1f
    }

    fun isMuted(): Boolean = isMuted

    /**
     * 字幕选择
     */
    fun selectSubtitleTrack(trackIndex: Int) {
        // 简单实现：ExoPlayer 有内置字幕选择 API
        // 实际项目中可通过 TrackSelector 或 CaptioningManager 实现
        exoPlayer?.let { player ->
            val tracks = player.currentTracks
            // 这里可根据字幕轨道列表选择
        }
    }

    /**
     * 切换到下一条视频（用于自动连播）
     */
    fun setNextItem(item: EmbyItem?) {
        // 预留：可实现播放列表管理
    }

    /**
     * 释放资源
     */
    fun release() {
        progressTrackerJob?.cancel()
        exoPlayer?.let { player ->
            // 保存最后的播放位置
            playbackPositionMs = player.currentPosition
            player.release()
        }
        exoPlayer = null
    }

    /**
     * 获取当前播放器（如果需要在 UI 中绑定 PlayerView）
     */
    fun getExoPlayer(): ExoPlayer? = exoPlayer

    fun getCurrentItem(): EmbyItem? = currentItem

    fun isPlaying(): Boolean = exoPlayer?.isPlaying == true

    fun getPlaybackPositionMs(): Long = exoPlayer?.currentPosition ?: playbackPositionMs

    fun getDurationMs(): Long = exoPlayer?.duration?.coerceAtLeast(0L) ?: 0L

    /**
     * 猜测 MIME 类型
     */
    private fun guessMimeType(item: EmbyItem, mode: PlayerMode): String? {
        return when (mode) {
            PlayerMode.DIRECT -> {
                val name = item.Name.lowercase()
                when {
                    name.endsWith(".mp4") -> MimeTypes.VIDEO_MP4
                    name.endsWith(".mkv") -> MimeTypes.VIDEO_MATROSKA
                    name.endsWith(".webm") -> MimeTypes.VIDEO_WEBM
                    name.endsWith(".m3u8") -> MimeTypes.APPLICATION_M3U8
                    else -> null // 让 ExoPlayer 自动检测
                }
            }
            PlayerMode.TRANSCODE, PlayerMode.FALLBACK -> MimeTypes.APPLICATION_M3U8 // HLS 转码
        }
    }

    /**
     * 当 mediaClient 不可用时的 fallback URL 构造
     */
    private fun buildFallbackUrl(item: EmbyItem): String {
        val mediaSource = item.MediaSources?.firstOrNull()
        val path = mediaSource?.Path ?: ""
        return path.ifEmpty {
            // 最后降级：从 item.Id 和 mediaSource.Id 构造 Emby 直链
            // 格式：/Videos/{item.Id}/stream?static=true&mediaSourceId={ms.Id}
            val mediaSourceId = item.MediaSources?.firstOrNull()?.Id ?: item.Id
            "/Videos/${item.Id}/stream?static=true&mediaSourceId=$mediaSourceId"
        }
    }
}

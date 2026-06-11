package com.embytok.player

import android.content.Context
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MergingMediaSource
import androidx.media3.exoplayer.source.SingleSampleMediaSource
import androidx.media3.common.MimeTypes
import androidx.media3.common.Format
import androidx.media3.common.C
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.SubtitleTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * 播放模式
 */
enum class PlayerMode {
    DIRECT,
    TRANSCODE,
    FALLBACK
}

/**
 * 播放状态机
 */
sealed class PlaybackState {
    data object Idle : PlaybackState()
    data object Buffering : PlaybackState()
    data object Ready : PlaybackState()
    data object Playing : PlaybackState()
    data object Paused : PlaybackState()
    data class Error(val message: String) : PlaybackState()
    data object Ended : PlaybackState()
}

/**
 * ExoPlayer 包装器
 *
 * - 从 MediaClient 获取播放 URL（直链/转码/降级）
 * - 支持字幕轨道加载与切换
 * - 定期上报播放进度（可用于 SQLDelight 持久化观看记录）
 */
class VideoPlayerManager(
    private val context: Context,
    private val mediaClient: MediaClient?,
    private val coroutineScope: CoroutineScope =
        CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
) {

    private var exoPlayer: ExoPlayer? = null
    private var currentItem: EmbyItem? = null
    private var currentMode: PlayerMode = PlayerMode.DIRECT
    private var playbackSpeed: Float = 1.0f
    private var isMuted: Boolean = false
    private var subtitleTracks: List<SubtitleTrack> = emptyList()
    private var currentSubtitleIndex: Int = -1

    private val _playbackState = MutableStateFlow<PlaybackState>(PlaybackState.Idle)
    val playbackState: StateFlow<PlaybackState> = _playbackState.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs.asStateFlow()

    private val _currentModeState = MutableStateFlow(currentMode)
    val currentModeState: StateFlow<PlayerMode> = _currentModeState.asStateFlow()

    private val _subtitleTracksState = MutableStateFlow(subtitleTracks)
    val subtitleTracksState: StateFlow<List<SubtitleTrack>> = _subtitleTracksState.asStateFlow()

    private var progressTrackerJob: Job? = null
    private var onProgressChanged: ((positionTicks: Long, totalTicks: Long) -> Unit)? = null

    /** 取得 ExoPlayer 实例（Compose 用于绑定 Media3 PlayerView） */
    fun getPlayer(): ExoPlayer? = exoPlayer

    fun initializePlayer(): ExoPlayer {
        return exoPlayer ?: createNewPlayer().also { exoPlayer = it }
    }

    private fun createNewPlayer(): ExoPlayer {
        val dataSourceFactory: HttpDataSource.Factory = DefaultHttpDataSource.Factory()
            .setUserAgent("EmbyTokApp/1.0 (Android)")
            .setAllowCrossProtocolRedirects(true)

        return ExoPlayer.Builder(context)
            .setMediaSourceFactory(DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory))
            .build()
            .also { player ->
                player.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        _playbackState.value = when (playbackState) {
                            Player.STATE_IDLE -> PlaybackState.Idle
                            Player.STATE_BUFFERING -> PlaybackState.Buffering
                            Player.STATE_READY -> if (player.playWhenReady) PlaybackState.Playing else PlaybackState.Paused
                            Player.STATE_ENDED -> PlaybackState.Ended
                            else -> PlaybackState.Ready
                        }
                    }

                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        if (isPlaying) {
                            _playbackState.value = PlaybackState.Playing
                            startProgressTracking()
                        } else {
                            if (_playbackState.value is PlaybackState.Playing) {
                                _playbackState.value = PlaybackState.Paused
                            }
                            stopProgressTracking()
                        }
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        _playbackState.value = PlaybackState.Error(error.message ?: "播放器错误")
                    }
                })
                player.playWhenReady = true
            }
    }

    // ===== 准备播放 =====

    fun prepare(item: EmbyItem, startPositionTicks: Long = 0L) {
        val player = initializePlayer()
        currentItem = item
        val positionMs = (startPositionTicks / 10_000L).coerceAtLeast(0L)

        val url = mediaClient?.buildVideoStreamUrl(
            itemId = item.Id,
            mediaSourceId = item.MediaSources?.firstOrNull()?.Id
        )

        if (url.isNullOrBlank()) {
            _playbackState.value = PlaybackState.Error("无法获取播放地址")
            return
        }

        val baseItem = ExoMediaItem.fromUri(url)

        // 异步拉取字幕轨道，拿到后与视频一起合并成 MergingMediaSource
        coroutineScope.launch {
            val tracks = runCatching { mediaClient?.getSubtitles(item.Id).orEmpty() }.getOrDefault(emptyList())
            subtitleTracks = tracks
            _subtitleTracksState.value = tracks

            val dataSourceFactory: HttpDataSource.Factory = DefaultHttpDataSource.Factory()
                .setUserAgent("EmbyTokApp/1.0 (Android)")
                .setAllowCrossProtocolRedirects(true)

            val videoSource = DefaultMediaSourceFactory(context)
                .setDataSourceFactory(dataSourceFactory)
                .createMediaSource(baseItem)

            if (tracks.isEmpty()) {
                player.setMediaSource(videoSource, positionMs > 0)
                player.seekTo(positionMs)
                player.prepare()
                return@launch
            }

            val subSources = tracks.mapIndexed { idx, track ->
                val mimeType = when (track.type.lowercase()) {
                    "vtt" -> MimeTypes.TEXT_VTT
                    else -> MimeTypes.APPLICATION_SUBRIP
                }
                val format = Format.Builder()
                    .setSampleMimeType(mimeType)
                    .setLanguage(track.srclang)
                    .setLabel(track.label)
                    .setSelectionFlags(C.SELECTION_FLAG_AUTOSELECT)
                    .setRoleFlags(C.ROLE_FLAG_CAPTION)
                    .setId(track.id)
                    .build()
                SingleSampleMediaSource.Factory(dataSourceFactory)
                    .createMediaSource(
                        ExoMediaItem.SubtitleConfiguration.Builder(android.net.Uri.parse(track.src))
                            .setMimeType(mimeType)
                            .setLanguage(track.srclang)
                            .setSelectionFlags(C.SELECTION_FLAG_AUTOSELECT)
                            .build(),
                        C.TIME_UNSET
                    )
            }

            val merged = MergingMediaSource(listOf(videoSource) + subSources)
            player.setMediaSource(merged, positionMs > 0)
            player.seekTo(positionMs)
            player.prepare()
        }
    }

    fun play() {
        val p = exoPlayer ?: return
        p.playWhenReady = true
        p.play()
        startProgressTracking()
    }

    fun pause() {
        val p = exoPlayer ?: return
        p.pause()
        stopProgressTracking()
    }

    fun togglePlayPause() {
        val p = exoPlayer ?: return
        if (p.isPlaying) pause() else play()
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs.coerceAtLeast(0L))
    }

    fun setSpeed(speed: Float) {
        playbackSpeed = speed.coerceIn(0.25f, 3.0f)
        exoPlayer?.setPlaybackSpeed(playbackSpeed)
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
        exoPlayer?.volume = if (muted) 0f else 1f
    }

    fun setSubtitleTrack(index: Int) {
        currentSubtitleIndex = index
        val player = exoPlayer ?: return
        // 从所有轨道组中找出 TEXT 类型的轨道
        val trackSelector = (player.trackSelectionParameters
            .buildUpon()
            .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
            .build())
        player.trackSelectionParameters = trackSelector

        // 更细粒度的轨道选择
        val trackGroups = player.currentTracks.groups
        var textGroupIndex = -1
        var currentTextIndex = 0
        for (i in trackGroups.indices) {
            val group = trackGroups[i]
            if (group.type == C.TRACK_TYPE_TEXT) {
                if (currentTextIndex == index) {
                    textGroupIndex = i
                    break
                }
                currentTextIndex++
            }
        }
        if (textGroupIndex >= 0) {
            val group = trackGroups[textGroupIndex]
            player.trackSelectionParameters = player.trackSelectionParameters
                .buildUpon()
                .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                .setOverrideForType(
                    androidx.media3.common.TrackSelectionOverride(
                        group.mediaTrackGroup,
                        listOf(0)
                    )
                )
                .build()
        }
    }

    fun disableSubtitles() {
        currentSubtitleIndex = -1
        val player = exoPlayer ?: return
        player.trackSelectionParameters = player.trackSelectionParameters
            .buildUpon()
            .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
            .build()
    }

    fun release() {
        stopProgressTracking()
        runCatching { exoPlayer?.release() }
        exoPlayer = null
        _playbackState.value = PlaybackState.Idle
    }

    // ===== 进度上报 =====

    fun setOnProgressChanged(listener: ((positionTicks: Long, totalTicks: Long) -> Unit)?) {
        onProgressChanged = listener
    }

    private fun startProgressTracking() {
        if (progressTrackerJob?.isActive == true) return
        progressTrackerJob = coroutineScope.launch {
            while (true) {
                val p = exoPlayer
                if (p != null) {
                    val pos = p.currentPosition
                    val dur = p.duration.takeIf { it != C.TIME_UNSET } ?: 0L
                    _currentPositionMs.value = pos
                    _durationMs.value = dur
                    onProgressChanged?.invoke(pos * 10_000L, dur * 10_000L)
                }
                delay(TimeUnit.SECONDS.toMillis(5))
            }
        }
    }

    private fun stopProgressTracking() {
        progressTrackerJob?.cancel()
        progressTrackerJob = null
    }
}

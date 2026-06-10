package com.embytok.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.PauseCircle
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.PlayerView
import com.embytok.domain.model.EmbyItem
import com.embytok.player.PlaybackState
import com.embytok.player.VideoPlayerManager
import com.embytok.app.viewmodel.VideoPlayerViewModel
import kotlinx.coroutines.delay

/**
 * 视频卡片（带原生播放器）
 *
 * 功能：
 * - ExoPlayer 原生播放（Android 媒体框架）
 * - 点击暂停/播放
 * - 双击快进/快退
 * - 双击侧边快进/快退
 * - 底部信息叠加层
 */
@Composable
fun VideoCard(
    item: EmbyItem,
    viewModel: VideoPlayerViewModel,
    modifier: Modifier = Modifier,
    onInfoClick: () -> Unit = {},
    onHeartToggle: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current

    // 播放状态
    val playbackState by viewModel.playbackState.collectAsState()
    val positionMs by viewModel.currentPositionMs.collectAsState()
    val durationMs by viewModel.durationMs.collectAsState()
    val playerMode by viewModel.currentMode.collectAsState()

    // 显示播放/暂停按钮的标志（双击时显示，3秒后自动隐藏）
    var showPlayOverlay by remember { mutableStateOf(false) }
    var showRewindIndicator by remember { mutableStateOf(false) }
    var showForwardIndicator by remember { mutableStateOf(false) }
    var indicatorText by remember { mutableStateOf("") }

    // 自动隐藏播放覆盖层
    LaunchedEffect(showPlayOverlay) {
        if (showPlayOverlay) {
            delay(2000)
            showPlayOverlay = false
        }
    }

    LaunchedEffect(showRewindIndicator, showForwardIndicator) {
        if (showRewindIndicator || showForwardIndicator) {
            delay(1200)
            showRewindIndicator = false
            showForwardIndicator = false
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { offset ->
                        // 点击：切换播放/暂停
                        viewModel.togglePlayPause()
                        showPlayOverlay = true
                    },
                    onDoubleTap = { offset ->
                        // 双击：根据位置判断是快进还是快退
                        val screenWidth = size.width
                        if (offset.x < screenWidth / 2) {
                            // 左半边：快退 10s
                            viewModel.seekBackward(10)
                            showRewindIndicator = true
                            indicatorText = "-10s"
                        } else {
                            // 右半边：快进 10s
                            viewModel.seekForward(10)
                            showForwardIndicator = true
                            indicatorText = "+10s"
                        }
                    }
                )
            }
    ) {
        // ============ 原生 PlayerView ============
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    useController = false // 禁用原生控件，使用 Compose UI
                    player = viewModel.playerManager.getExoPlayer()
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { playerView ->
                // 更新 Player 引用
                playerView.player = viewModel.playerManager.getExoPlayer()
            }
        )

        // ============ 底部信息叠加层 ============
        VideoInfoOverlay(
            item = item,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(bottom = 60.dp),
            positionMs = positionMs,
            durationMs = durationMs,
            playerMode = playerMode.name
        )

        // ============ 右侧操作按钮 ============
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 16.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // 播放进度（简单显示）
            if (playbackState !is PlaybackState.Idle && playbackState !is PlaybackState.Buffering) {
                IconButton(onClick = { onHeartToggle(true) }) {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = "收藏",
                        tint = Color(0xFFE91E63),
                        modifier = Modifier.size(36.dp)
                    )
                }

                IconButton(onClick = { onInfoClick() }) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "信息",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }
        }

        // ============ 播放/暂停按钮覆盖层（点击时显示） ============
        if (showPlayOverlay) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                val icon = if (playbackState == PlaybackState.Playing) {
                    Icons.Default.PauseCircle
                } else {
                    Icons.Default.PlayCircle
                }
                Icon(
                    imageVector = icon,
                    contentDescription = if (playbackState == PlaybackState.Playing) "暂停" else "播放",
                    tint = Color.White.copy(alpha = 0.85f),
                    modifier = Modifier.size(100.dp)
                )
            }
        }

        // ============ 快退/快进指示器 ============
        if (showRewindIndicator) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = 100.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .background(
                            Color.Black.copy(alpha = 0.55f),
                            RoundedCornerShape(16.dp)
                        )
                        .padding(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.SkipPrevious,
                        contentDescription = "快退",
                        tint = Color.White,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = indicatorText,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        if (showForwardIndicator) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 100.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .background(
                            Color.Black.copy(alpha = 0.55f),
                            RoundedCornerShape(16.dp)
                        )
                        .padding(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = "快进",
                        tint = Color.White,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = indicatorText,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // ============ 缓冲状态 ============
        if (playbackState is PlaybackState.Buffering) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.material3.CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary,
                    strokeWidth = 4.dp,
                    modifier = Modifier.size(56.dp)
                )
            }
        }

        // ============ 错误状态 ============
        if (playbackState is PlaybackState.Error) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = (playbackState as PlaybackState.Error).message,
                    color = Color(0xFFFF5252),
                    fontSize = 16.sp,
                    modifier = Modifier.padding(24.dp)
                )
            }
        }
    }
}

/**
 * 视频信息叠加层（标题、描述、进度条、播放模式）
 */
@Composable
private fun VideoInfoOverlay(
    item: EmbyItem,
    positionMs: Long,
    durationMs: Long,
    playerMode: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        // 标题
        Text(
            text = item.Name,
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 2
        )

        // 描述/年份信息
        val subInfo = buildString {
            if (item.ProductionYear != null) append("${item.ProductionYear}")
            item.OfficialRating?.let { if (isNotEmpty()) append(" · ") ; append(it) }
            item.RunTimeTicks?.let { ticks ->
                val minutes = ticks / 10_000_000L / 60L
                if (minutes > 0) {
                    if (isNotEmpty()) append(" · ")
                    append("${minutes}min")
                }
            }
        }

        if (subInfo.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = subInfo,
                color = Color.White.copy(alpha = 0.75f),
                fontSize = 14.sp
            )
        }

        // 播放模式指示
        Spacer(Modifier.height(8.dp))
        Text(
            text = "播放模式: $playerMode",
            color = Color(0xFF4FC3F7),
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )

        // 简要概述
        item.Overview?.let {
            Spacer(Modifier.height(8.dp))
            Text(
                text = it,
                color = Color.White.copy(alpha = 0.65f),
                fontSize = 13.sp,
                maxLines = 2
            )
        }

        // 进度条
        if (durationMs > 0) {
            Spacer(Modifier.height(16.dp))
            val progress = if (durationMs > 0) positionMs.toFloat() / durationMs.toFloat() else 0f
            androidx.compose.material3.LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp),
                color = MaterialTheme.colorScheme.primary,
                trackColor = Color.White.copy(alpha = 0.2f)
            )
        }
    }
}

// ===== 辅助属性：ViewModel 中的 playerManager 需要对外暴露
// （此文件为 ViewModel 增加扩展属性访问权限）
private val VideoPlayerViewModel.playerManager: VideoPlayerManager
    get() = this.playerManager

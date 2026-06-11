package com.embytok.app.ui.screens.player

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ClosedCaption
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PictureInPicture
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VolumeDown
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.PlayerView
import com.embytok.app.ui.components.SubtitleSelector
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.EmbyItem
import com.embytok.player.PlaybackState
/**
 * 视频播放页。
 *
 * 包含：
 *  - 全屏 Media3 PlayerView
 *  - 字幕选择器
 *  - 播放控制（播放/暂停、倍速、静音）
 *  - 信息栏（标题 + 简介）
 */
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    item: EmbyItem,
    viewModel: VideoPlayerViewModel,
    onBack: () -> Unit
) {
    val playbackState by viewModel.playbackState.collectAsState()
    val isFavorite by viewModel.isFavorite.collectAsState()
    val speed by viewModel.speed.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()
    val subtitleTracks by viewModel.subtitleTracks.collectAsState()
    val currentSubtitleIndex by viewModel.currentSubtitleIndex.collectAsState()
    val currentPosition by viewModel.currentPositionMs.collectAsState()
    val duration by viewModel.durationMs.collectAsState()

    var showSubtitleSelector by remember { mutableStateOf(false) }
    var showSpeedMenu by remember { mutableStateOf(false) }

    LaunchedEffect(item.Id) {
        viewModel.prepare(item)
        // 初始化 PiP 管理器，绑定当前 Activity
        val ctx = androidx.compose.ui.platform.LocalContext.current
        (ctx as? android.app.Activity)?.let { viewModel.initPipManager(it) }
    }

    Scaffold(
        containerColor = Color.Black,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = item.Name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "返回",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    // 画中画按钮（仅在支持的设备上显示）
                    if (viewModel.isPipSupported) {
                        IconButton(onClick = {
                            viewModel.enterPictureInPicture()
                        }) {
                            Icon(
                                imageVector = Icons.Default.PictureInPicture,
                                contentDescription = "画中画",
                                tint = Color.White
                            )
                        }
                    }
                    // 字幕按钮（有字幕轨道时才显示）
                    if (subtitleTracks.isNotEmpty()) {
                        IconButton(onClick = { showSubtitleSelector = true }) {
                            Icon(
                                imageVector = Icons.Default.ClosedCaption,
                                contentDescription = "字幕",
                                tint = if (currentSubtitleIndex >= 0) Color(0xFFE91E63) else Color.White
                            )
                        }
                    }
                    // 倍速按钮
                    IconButton(onClick = { showSpeedMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.Speed,
                            contentDescription = "倍速",
                            tint = Color.White
                        )
                        // 倍速菜单
                        DropdownMenu(
                            expanded = showSpeedMenu,
                            onDismissRequest = { showSpeedMenu = false }
                        ) {
                            listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f).forEach { s ->
                                DropdownMenuItem(
                                    text = { Text("${s}x") },
                                    onClick = {
                                        viewModel.setSpeed(s)
                                        showSpeedMenu = false
                                    }
                                )
                            }
                        }
                    }
                    // 静音按钮
                    IconButton(onClick = { viewModel.toggleMute() }) {
                        Icon(
                            imageVector = if (isMuted) Icons.Default.VolumeDown else Icons.Default.VolumeUp,
                            contentDescription = "静音",
                            tint = Color.White
                        )
                    }
                    // 收藏按钮
                    IconButton(onClick = { viewModel.toggleFavorite() }) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "收藏",
                            tint = if (isFavorite) Color(0xFFE91E63) else Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0A0A),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.Black),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 播放器区域
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                when (val state = playbackState) {
                    // 加载中 / 初始态
                    is PlaybackState.Idle,
                    is PlaybackState.Buffering -> {
                        CircularProgressIndicator(color = Color(0xFFE91E63))
                    }
                    // 错误态
                    is PlaybackState.Error -> {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = state.message,
                                color = Color(0xFFCF6679)
                            )
                            Spacer(Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.prepare(item) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63)),
                                shape = RoundedCornerShape(8.dp)
                            ) { Text("重试", color = Color.White) }
                        }
                    }
                    // 其他态：Ready / Playing / Paused / Ended → 显示 ExoPlayer PlayerView
                    else -> {
                        Column(
                            modifier = Modifier.fillMaxSize()
                        ) {
                            // ExoPlayer PlayerView
                            AndroidView(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                factory = { ctx ->
                                    PlayerView(ctx).apply {
                                        useController = true
                                        controllerAutoShow = true
                                        setBackgroundColor(android.graphics.Color.BLACK)
                                    }
                                },
                                update = { view ->
                                    view.player = viewModel.exoPlayer
                                }
                            )

                            // 字幕选择器（悬浮）
                            AnimatedVisibility(
                                visible = showSubtitleSelector,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF0A0A0A))
                            ) {
                                SubtitleSelector(
                                    tracks = subtitleTracks,
                                    currentIndex = currentSubtitleIndex,
                                    onDismiss = { showSubtitleSelector = false },
                                    onSelect = { index ->
                                        viewModel.selectSubtitle(index)
                                        showSubtitleSelector = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // 底部信息条和播放控制
            val showInfo = playbackState is PlaybackState.Ready ||
                    playbackState is PlaybackState.Playing ||
                    playbackState is PlaybackState.Paused ||
                    playbackState is PlaybackState.Ended
            if (showInfo) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    // 标题
                    Text(
                        text = item.Name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    // 简介
                    if (!item.Overview.isNullOrEmpty()) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = item.Overview,
                            color = Color(0xFFB3B3B3),
                            fontSize = 14.sp,
                            maxLines = 2
                        )
                    }
                    // 控制信息（当前倍速、时长）
                    Spacer(Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "倍速: ${speed}x",
                            color = Color(0xFF888888),
                            fontSize = 12.sp
                        )
                        if (currentSubtitleIndex >= 0) {
                            Text(
                                text = "字幕: ${subtitleTracks.getOrNull(currentSubtitleIndex)?.label ?: ""}",
                                color = Color(0xFF888888),
                                fontSize = 12.sp
                            )
                        }
                        Text(
                            text = "时长: ${formatDuration(duration)}",
                            color = Color(0xFF888888),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

/** 格式化时长：将毫秒转换为 mm:ss 或 h:mm:ss */
private fun formatDuration(ms: Long): String {
    if (ms <= 0) return "0:00"
    val totalSeconds = ms / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%d:%02d", minutes, seconds)
    }
}

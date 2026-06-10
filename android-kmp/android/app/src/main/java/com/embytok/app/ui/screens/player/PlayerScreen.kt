package com.embytok.app.ui.screens.player

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.viewmodel.VideoPlayerViewModel

/**
 * 播放器详情页
 *
 * 功能：
 *  - 完整播放器（使用 VideoPlayerManager）
 *  - 显示当前视频信息、播放进度
 *  - 收藏/取消收藏
 *  - 倍速/字幕切换
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    playerViewModel: VideoPlayerViewModel,
    itemId: String,
    onBack: () -> Unit
) {
    // 从 ViewModel 获取当前播放项
    val currentItem by playerViewModel.currentItem.collectAsState()
    val positionMs by playerViewModel.currentPositionMs.collectAsState()
    val durationMs by playerViewModel.durationMs.collectAsState()
    val playbackState by playerViewModel.playbackState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(currentItem?.Name ?: "播放中") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.Black)
        ) {
            // 顶部：视频区域（使用原生 PlayerView）
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(Color.Black)
            ) {
                // 这里使用 AndroidView 嵌入原生 PlayerView
                androidx.compose.ui.viewinterop.AndroidView(
                    factory = { ctx ->
                        androidx.media3.ui.PlayerView(ctx).apply {
                            player = playerViewModel.playerManager.getExoPlayer()
                            useController = true
                            setShowPreviousButton(false)
                            setShowNextButton(false)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }

            // 中部：视频信息 & 控制按钮
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // 标题
                Text(
                    text = currentItem?.Name ?: "",
                    color = Color.White,
                    fontSize = 20.sp
                )

                // 副标题（年份 / 时长）
                val subInfo = buildString {
                    currentItem?.ProductionYear?.let { append(it) }
                    currentItem?.RunTimeTicks?.let { ticks ->
                        val minutes = ticks / 10_000_000L / 60L
                        if (isNotEmpty()) append(" · ")
                        append("${minutes}min")
                    }
                }

                if (subInfo.isNotEmpty()) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = subInfo,
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                }

                // 简介
                currentItem?.Overview?.let { overview ->
                    if (overview.isNotBlank()) {
                        Spacer(Modifier.height(16.dp))
                        Text(
                            text = overview,
                            color = Color.White,
                            fontSize = 14.sp,
                            lineHeight = 20.sp
                        )
                    }
                }

                // 控制按钮行
                Spacer(Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // 播放/暂停
                    Button(
                        onClick = { playerViewModel.togglePlayPause() },
                        modifier = Modifier.size(width = 140.dp, height = 44.dp),
                        shape = RoundedCornerShape(22.dp)
                    ) {
                        Icon(
                            imageVector = if (playbackState == com.embytok.player.PlaybackState.Playing)
                                Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = "播放/暂停"
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (playbackState == com.embytok.player.PlaybackState.Playing)
                                "暂停" else "播放"
                        )
                    }

                    // 收藏
                    val isFav = currentItem?.UserData?.IsFavorite ?: false
                    OutlinedButton(
                        onClick = { /* TODO: toggle favorite */ },
                        modifier = Modifier.size(width = 140.dp, height = 44.dp),
                        shape = RoundedCornerShape(22.dp)
                    ) {
                        Icon(
                            imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "收藏",
                            tint = if (isFav) Color(0xFFFF5252) else Color.White
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(if (isFav) "已收藏" else "收藏", color = Color.White)
                    }
                }

                // 进度显示
                Spacer(Modifier.height(24.dp))
                val progress = if (durationMs > 0)
                    positionMs.toFloat() / durationMs.toFloat() else 0f

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = formatDuration(positionMs),
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.width(60.dp)
                    )
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .weight(1f)
                            .height(4.dp),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = Color.White.copy(alpha = 0.2f)
                    )
                    Text(
                        text = formatDuration(durationMs),
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.width(60.dp)
                    )
                }
            }
        }
    }
}

/**
 * 格式化毫秒为 mm:ss
 */
private fun formatDuration(ms: Long): String {
    if (ms <= 0) return "0:00"
    val totalSeconds = ms / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%d:%02d", minutes, seconds)
}

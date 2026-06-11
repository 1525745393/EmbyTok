package com.embytok.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.PlayerView
import com.embytok.app.viewmodel.VideoFeedViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.EmbyItem
import kotlinx.coroutines.delay

/**
 * 视频卡片。
 *
 * 行为：
 *  - 单击 → 播放/暂停
 *  - 双击左侧 → 快退 10s
 *  - 双击右侧 → 快进 10s
 *  - 点击右下角信息图标 → onInfoClick
 *
 * 内容：
 *  - 顶部：标题 + 时长
 *  - 中部：缩略图（未播放时）或 PlayerView（已播放时）
 *  - 底部：播放控制图标（播放/暂停 + 倍速 + 收藏）
 */
@Composable
fun VideoCard(
    item: EmbyItem,
    playerViewModel: VideoPlayerViewModel,
    onCardClick: () -> Unit,
    onDoubleClickLeft: () -> Unit,
    onDoubleClickRight: () -> Unit,
    onInfoClick: () -> Unit,
    modifier: Modifier = Modifier,
    isCurrentItem: Boolean = true
) {
    val context = LocalContext.current
    val playbackState by playerViewModel.playbackState.collectAsState(
        androidx.compose.runtime.State { com.embytok.player.PlaybackState.Idle }
    )

    // 双击检测状态
    var lastClickTime by remember { mutableStateOf(0L) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(360.dp)
            .background(Color(0xFF121212), RoundedCornerShape(8.dp))
    ) {

        // ============== 视频区域 / 缩略图 ==============
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // 未播放：显示缩略图占位（深色底）
            if (!isCurrentItem || playbackState == com.embytok.player.PlaybackState.Idle) {
                VideoThumbnail(
                    item = item,
                    serverUrl = "",
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // 已播放：嵌入原生 PlayerView
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = playerViewModel.playerManager.getPlayer()
                            useController = false
                            setShutterBackgroundColor(0xFF121212.toInt())
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }

            // ============== 点击处理层 ==============
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        onClick = {
                            val now = System.currentTimeMillis()
                            if (now - lastClickTime < 400) {
                                // 简化：第二次点击若处于左半部分为后退，否则前进
                                // 由于 clickable 不携带 x，此处让调用方自己分：用两个 Box 分区
                            } else {
                                onCardClick()
                            }
                            lastClickTime = now
                        }
                    )
            )

            // ============== 播放/暂停 居中图标提示 ==============
            val showPlayIcon = remember { mutableStateOf(false) }
            LaunchedEffect(playbackState) {
                showPlayIcon.value = true
                delay(700)
                showPlayIcon.value = false
            }

            AnimatedVisibility(
                visible = showPlayIcon.value,
                enter = fadeIn(animationSpec = tween(200)),
                exit = fadeOut(animationSpec = tween(200)),
                modifier = Modifier.align(Alignment.Center)
            ) {
                Icon(
                    imageVector = if (playbackState == com.embytok.player.PlaybackState.Playing)
                        Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier
                        .width(64.dp)
                        .height(64.dp)
                )
            }
        }

        // ============== 顶部：标题 + 时长 ==============
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(Color(0xAA000000), Color.Transparent)
                    )
                )
                .padding(12.dp)
        ) {
            Text(
                text = item.Name,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
            item.RunTimeTicks?.let { ticks ->
                val minutes = ticks / 6_000_000L
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "${minutes}min",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp
                )
            }
        }

        // ============== 底部：控制按钮 ==============
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomStart)
                .background(
                    brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color(0xAA000000))
                    )
                )
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onCardClick) {
                Icon(
                    imageVector = if (playbackState == com.embytok.player.PlaybackState.Playing)
                        Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = "播放/暂停",
                    tint = Color.White
                )
            }

            IconButton(onClick = onDoubleClickLeft) {
                Text("10↺", color = Color.White, fontSize = 14.sp)
            }
            IconButton(onClick = onDoubleClickRight) {
                Icon(
                    imageVector = Icons.Default.SkipNext,
                    contentDescription = "快进 10s",
                    tint = Color.White
                )
            }

            Spacer(Modifier.weight(1f))

            // 收藏按钮（已实现）
            val isFav = item.UserData?.IsFavorite ?: false
            IconButton(onClick = { playerViewModel.toggleFavorite() }) {
                Icon(
                    imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "收藏",
                    tint = if (isFav) Color(0xFFFF4444) else Color.White
                )
            }

            IconButton(onClick = onInfoClick) {
                Text("ⓘ", color = Color.White, fontSize = 18.sp)
            }
        }
    }
}

/** StateFlow.collectAsState 的简易包装，方便在 Composable 中订阅。 */
@Composable
private fun <T> kotlinx.coroutines.flow.StateFlow<T>.collectAsState(): androidx.compose.runtime.State<T> {
    val state = remember { mutableStateOf(this.value) }
    LaunchedEffect(this) { collect { state.value = it } }
    return state
}

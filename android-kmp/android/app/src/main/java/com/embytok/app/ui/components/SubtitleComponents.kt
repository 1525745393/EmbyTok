package com.embytok.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ClosedCaption
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.SubtitleTrack
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 字幕选择对话框
 */
@Composable
fun SubtitleSelector(
    tracks: List<SubtitleTrack>,
    currentIndex: Int,
    onDismiss: () -> Unit,
    onSelect: (Int) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.8f))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "选择字幕",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            Divider(color = Color(0xFF333333))

            // 关闭字幕选项
            TextButton(
                onClick = { onSelect(-1) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "关闭字幕",
                    color = if (currentIndex == -1) Color(0xFFE91E63) else Color.White,
                    fontSize = 14.sp
                )
            }

            Divider(color = Color(0xFF222222))

            // 字幕轨道列表
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(tracks) { track ->
                    val index = tracks.indexOf(track)
                    TextButton(
                        onClick = { onSelect(index) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = track.label,
                            color = if (currentIndex == index) Color(0xFFE91E63) else Color.White,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF333333)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("关闭", color = Color.White)
            }
        }
    }
}

/**
 * 字幕文本渲染组件
 *
 * 在视频上方渲染字幕文本，带有黑色半透明背景。
 */
@Composable
fun SubtitleRenderer(
    text: String,
    modifier: Modifier = Modifier
) {
    if (text.isNotEmpty()) {
        AnimatedVisibility(
            visible = true,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp, vertical = 16.dp)
                    .background(
                        Color.Black.copy(alpha = 0.6f),
                        RoundedCornerShape(8.dp)
                    )
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = text,
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

/**
 * 字幕控制栏
 *
 * 集成在播放控制中，提供字幕切换按钮。
 */
@Composable
fun SubtitleControls(
    viewModel: VideoPlayerViewModel,
    onOpenSelector: () -> Unit,
    modifier: Modifier = Modifier
) {
    val subtitleTracks by viewModel.subtitleTracks.collectAsState()
    val currentIndex by viewModel.currentSubtitleIndex.collectAsState()

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (subtitleTracks.isNotEmpty()) {
            IconButton(
                onClick = onOpenSelector,
                modifier = Modifier.height(32.dp).width(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ClosedCaption,
                    contentDescription = "字幕",
                    tint = if (currentIndex >= 0) Color(0xFFE91E63) else Color.White
                )
            }
        }
    }
}

/**
 * 简化的字幕预览卡片（用于设置界面）
 */
@Composable
fun SubtitlePreviewCard(
    text: String = "这是一个字幕预览示例",
    fontSize: Int = 18,
    fontColor: Color = Color.White,
    backgroundColor: Color = Color.Black.copy(alpha = 0.6f)
) {
    Card(
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = text,
                color = fontColor,
                fontSize = fontSize.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

/**
 * 字幕显示区域，结合字幕选择器
 */
@Composable
fun SubtitleOverlay(
    viewModel: VideoPlayerViewModel,
    subtitleText: String,
    showSelector: Boolean,
    onToggleSelector: () -> Unit,
    onDismissSelector: () -> Unit,
    onSelect: (Int) -> Unit
) {
    val subtitleTracks by viewModel.subtitleTracks.collectAsState()
    val currentIndex by viewModel.currentSubtitleIndex.collectAsState()

    // 底部区域：字幕文本 + 控制
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 字幕选择器（展开状态）
        AnimatedVisibility(visible = showSelector) {
            SubtitleSelector(
                tracks = subtitleTracks,
                currentIndex = currentIndex,
                onDismiss = onDismissSelector,
                onSelect = onSelect
            )
        }

        // 字幕文本
        SubtitleRenderer(
            text = subtitleText,
            modifier = Modifier.padding(top = 8.dp)
        )

        // 切换字幕按钮
        if (subtitleTracks.isNotEmpty()) {
            IconButton(
                onClick = onToggleSelector,
                modifier = Modifier.padding(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ClosedCaption,
                    contentDescription = "切换字幕",
                    tint = if (currentIndex >= 0) Color(0xFFE91E63) else Color(0xFF666666)
                )
            }
        }
    }
}

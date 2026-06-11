package com.embytok.app.ui.screens.history

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.embytok.app.viewmodel.WatchHistoryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 观看历史页面
 *
 * 功能：
 *  - 显示所有已观看的视频（按时间倒序）
 *  - 每条记录显示：封面图、标题、观看进度、观看时间
 *  - 支持点击继续播放
 *  - 支持删除单条记录
 *  - 支持清空全部历史
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WatchHistoryScreen(
    viewModel: WatchHistoryViewModel = viewModel(),
    onItemClicked: (itemId: String, startPositionMs: Long) -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var showClearConfirm by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = { Text("观看历史", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回", tint = Color.White)
                    }
                },
                actions = {
                    if (state.items.isNotEmpty()) {
                        IconButton(onClick = { showClearConfirm = true }) {
                            Icon(
                                Icons.Default.DeleteSweep,
                                contentDescription = "清空全部",
                                tint = Color(0xFFCF6679)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0A0A),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFFE91E63))
                }
            }

            state.items.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📺", fontSize = 48.sp)
                        Spacer(Modifier.height(16.dp))
                        Text("暂无观看记录", color = Color(0xFF888888), fontSize = 16.sp)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "开始观看视频，自动记录历史",
                            color = Color(0xFF555555),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.items, key = { it.itemId }) { item ->
                        HistoryItemCard(
                            item = item,
                            onClick = {
                                val startPosMs = item.positionTicks / 10_000L
                                onItemClicked(item.itemId, startPosMs)
                            },
                            onRemove = { viewModel.removeItem(item.itemId) }
                        )
                    }
                }
            }
        }

        // 清空确认对话框
        if (showClearConfirm) {
            AlertDialog(
                onDismissRequest = { showClearConfirm = false },
                containerColor = Color(0xFF1A1A1A),
                title = { Text("清空历史", color = Color.White) },
                text = { Text("确定清空所有观看历史？此操作无法撤销。", color = Color(0xFFB3B3B3)) },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.clearAll()
                            showClearConfirm = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFCF6679))
                    ) {
                        Text("清空", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearConfirm = false }) {
                        Text("取消", color = Color(0xFF888888))
                    }
                }
            )
        }
    }
}

@Composable
private fun HistoryItemCard(
    item: WatchHistoryViewModel.HistoryItem,
    onClick: () -> Unit,
    onRemove: () -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    Card(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 封面图
                Box(
                    modifier = Modifier
                        .size(width = 100.dp, height = 56.dp)
                        .background(Color(0xFF2A2A2A), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    if (!item.imageUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = ImageRequest.Builder(androidx.compose.ui.platform.LocalContext.current)
                                .data(item.imageUrl)
                                .crossfade(true)
                                .build(),
                            contentDescription = item.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Text("▶", color = Color(0xFFE91E63), fontSize = 20.sp)
                    }
                }

                Spacer(Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.title,
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = formatWatchTime(item.watchedAtMillis),
                            color = Color(0xFF666666),
                            fontSize = 11.sp
                        )
                        if (item.runTimeTicks != null && item.runTimeTicks > 0) {
                            Text(
                                text = " · ",
                                color = Color(0xFF555555),
                                fontSize = 11.sp
                            )
                            val totalMin = item.runTimeTicks / 600_000_000L
                            Text(
                                text = "${totalMin}分钟",
                                color = Color(0xFF666666),
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                IconButton(onClick = { showDeleteConfirm = true }) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "删除",
                        tint = Color(0xFF555555),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // 进度条
            if (item.progress > 0.02f && item.progress < 0.98f) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(Color(0xFF2A2A2A), RoundedCornerShape(2.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(item.progress)
                            .fillMaxSize()
                            .background(Color(0xFFE91E63), RoundedCornerShape(2.dp))
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "已看 ${(item.progress * 100).toInt()}% · 剩余 ${formatDuration(item.remainingMs)}",
                    color = Color(0xFF666666),
                    fontSize = 11.sp
                )
            } else if (item.progress >= 0.98f) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "已看完",
                    color = Color(0xFF4CAF50),
                    fontSize = 11.sp
                )
            }
        }

        // 删除确认
        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirm = false },
                containerColor = Color(0xFF1A1A1A),
                title = { Text("删除记录", color = Color.White) },
                text = { Text("确定删除「${item.title}」的观看记录？", color = Color(0xFFB3B3B3)) },
                confirmButton = {
                    Button(
                        onClick = {
                            onRemove()
                            showDeleteConfirm = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFCF6679))
                    ) {
                        Text("删除", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirm = false }) {
                        Text("取消", color = Color(0xFF888888))
                    }
                }
            )
        }
    }
}

/** 格式化观看时间（相对时间） */
private fun formatWatchTime(millis: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - millis
    return when {
        diff < 60_000 -> "刚刚"
        diff < 3600_000 -> "${diff / 60_000}分钟前"
        diff < 86400_000 -> "${diff / 3600_000}小时前"
        diff < 604800_000 -> "${diff / 86400_000}天前"
        else -> SimpleDateFormat("MM/dd", Locale.getDefault()).format(Date(millis))
    }
}

/** 格式化时长（毫秒） */
private fun formatDuration(ms: Long): String {
    val totalSeconds = ms / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "${hours}h${minutes}m"
    } else if (minutes > 0) {
        "${minutes}m${seconds}s"
    } else {
        "${seconds}s"
    }
}

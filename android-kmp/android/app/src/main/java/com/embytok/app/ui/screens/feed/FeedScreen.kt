package com.embytok.app.ui.screens.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.embytok.app.ui.components.VideoCard
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.EmbyLibrary
import com.embytok.domain.model.FeedType
import com.embytok.domain.model.OrientationMode
import com.embytok.domain.model.SortMode

/**
 * 视频流首页
 *
 * 功能：
 *  - 顶栏：媒体库选择 / 排序方式 / 方向过滤 / 设置入口
 *  - 主体：垂直滑动视频流（LazyColumn + VideoCard）
 *  - 每个 VideoCard 内嵌 ExoPlayer，用户点击播放、双击 10s 快进
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    feedViewModel: FeedViewModel,
    playerViewModel: VideoPlayerViewModel,
    onNavigateToPlayer: (itemId: String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by feedViewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    var showLibraryMenu by remember { mutableStateOf(false) }
    var showSortMenu by remember { mutableStateOf(false) }
    var showOrientationMenu by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("EmbyTok") },
                actions = {
                    // 排序按钮
                    IconButton(onClick = { showSortMenu = true }) {
                        Icon(Icons.Default.Sort, contentDescription = "排序")
                        DropdownMenu(
                            expanded = showSortMenu,
                            onDismissRequest = { showSortMenu = false }
                        ) {
                            SortMode.values().forEach { mode ->
                                DropdownMenuItem(
                                    text = { Text(mode.displayName()) },
                                    onClick = {
                                        feedViewModel.setSortMode(mode)
                                        showSortMenu = false
                                    }
                                )
                            }
                        }
                    }

                    // 设置按钮
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "设置")
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
            // 媒体库选择 & 方向过滤
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 媒体库选择器
                Box {
                    TextButton(
                        onClick = { showLibraryMenu = true },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color.White)
                    ) {
                        Text(
                            text = uiState.currentLibrary?.Name ?: "选择媒体库",
                            color = Color.White
                        )
                    }
                    DropdownMenu(
                        expanded = showLibraryMenu && uiState.libraries.isNotEmpty(),
                        onDismissRequest = { showLibraryMenu = false }
                    ) {
                        uiState.libraries.forEach { lib ->
                            DropdownMenuItem(
                                text = { Text(lib.Name) },
                                onClick = {
                                    feedViewModel.selectLibrary(lib)
                                    showLibraryMenu = false
                                }
                            )
                        }
                    }
                }

                // 方向过滤
                Box {
                    TextButton(
                        onClick = { showOrientationMenu = true },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color.White)
                    ) {
                        Text(uiState.orientationMode.displayName(), color = Color.White)
                    }
                    DropdownMenu(
                        expanded = showOrientationMenu,
                        onDismissRequest = { showOrientationMenu = false }
                    ) {
                        OrientationMode.values().forEach { mode ->
                            DropdownMenuItem(
                                text = { Text(mode.displayName()) },
                                onClick = {
                                    feedViewModel.setOrientationMode(mode)
                                    showOrientationMenu = false
                                }
                            )
                        }
                    }
                }
            }

            // 视频流
            if (uiState.isLoading && uiState.videos.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(12.dp))
                        Text(uiState.statusMessage ?: "加载中...", color = Color.White)
                    }
                }
            } else if (uiState.videos.isEmpty() && !uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "没有可播放的视频",
                            color = Color.White.copy(alpha = 0.7f)
                        )
                        uiState.statusMessage?.let {
                            Spacer(Modifier.height(8.dp))
                            Text(text = it, color = Color.White.copy(alpha = 0.4f))
                        }
                    }
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(
                        items = uiState.videos,
                        key = { it.Id }
                    ) { video ->
                        // 每张卡片占满屏幕宽度（类似 TikTok 垂直流）
                        val height = when (uiState.orientationMode) {
                            OrientationMode.PORTRAIT -> 640
                            OrientationMode.LANDSCAPE -> 360
                            OrientationMode.BOTH -> 480
                        }.dp

                        VideoCard(
                            item = video,
                            playerViewModel = playerViewModel,
                            onCardClick = { playerViewModel.togglePlayPause() },
                            onDoubleClickLeft = { playerViewModel.seekBackward(10) },
                            onDoubleClickRight = { playerViewModel.seekForward(10) },
                            onInfoClick = { onNavigateToPlayer(video.Id) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(height)
                        )
                    }

                    // 底部：加载更多 indicator
                    if (uiState.isLoading && uiState.videos.isNotEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 过滤模式显示名称（中文）
 */
private fun OrientationMode.displayName(): String = when (this) {
    OrientationMode.BOTH -> "全部方向"
    OrientationMode.PORTRAIT -> "竖屏视频"
    OrientationMode.LANDSCAPE -> "横屏视频"
}

private fun SortMode.displayName(): String = when (this) {
    SortMode.DATE_ADDED_DESC -> "最新添加"
    SortMode.PLAY_COUNT_DESC -> "最多播放"
    SortMode.RATING_DESC -> "评分最高"
    SortMode.NAME_ASC -> "按名称"
}

private fun FeedType.displayName(): String = when (this) {
    FeedType.ALL -> "全部"
    FeedType.RECENT -> "最近"
    FeedType.FAVORITE -> "收藏"
}

private fun EmbyLibrary.displayName(): String = this.Name

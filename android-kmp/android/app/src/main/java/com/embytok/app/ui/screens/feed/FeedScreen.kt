package com.embytok.app.ui.screens.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.ui.components.VideoCard
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.FeedType
import com.embytok.domain.model.OrientationMode

/**
 * 视频流页面（TikTok 风格）
 *
 * 功能：
 * - 浏览服务器视频列表
 * - 切换媒体库 / 排序方式
 * - 点击切换播放
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    feedViewModel: FeedViewModel,
    playerViewModel: VideoPlayerViewModel,
    onNavigateToPlayer: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by feedViewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("EmbyTok") },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "设置")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.Black)
        ) {
            when {
                uiState.isLoading && uiState.videos.isEmpty() -> {
                    // 初次加载
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.height(12.dp))
                            Text("加载视频中…", color = Color.White)
                        }
                    }
                }

                uiState.error != null -> {
                    // 错误状态
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = uiState.error!!,
                                color = MaterialTheme.colorScheme.error,
                                modifier = Modifier.padding(16.dp)
                            )
                            Spacer(Modifier.height(8.dp))
                            Button(
                                onClick = { feedViewModel.loadInitialData() },
                                shape = RoundedCornerShape(8.dp)
                            ) { Text("重试") }
                        }
                    }
                }

                uiState.videos.isEmpty() -> {
                    // 空状态
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("暂无视频", color = Color.White.copy(alpha = 0.6f))
                    }
                }

                else -> {
                    // 视频列表
                    VideoPager(
                        items = uiState.videos,
                        playerViewModel = playerViewModel,
                        feedViewModel = feedViewModel,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // 底部筛选栏
            if (uiState.libraries.isNotEmpty()) {
                FilterBar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(8.dp),
                    libraries = uiState.libraries.map { it.Name },
                    selectedLibrary = uiState.selectedLibrary?.Name,
                    feedType = uiState.feedType,
                    orientationMode = uiState.orientationMode,
                    onLibrarySelected = { name ->
                        feedViewModel.selectLibrary(uiState.libraries.firstOrNull { it.Name == name })
                    },
                    onFeedTypeSelected = feedViewModel::setFeedType,
                    onOrientationSelected = feedViewModel::setOrientationMode
                )
            }
        }
    }
}

/**
 * 视频分页滑动列表
 */
@Composable
private fun VideoPager(
    items: List<EmbyItem>,
    playerViewModel: VideoPlayerViewModel,
    feedViewModel: FeedViewModel,
    modifier: Modifier = Modifier
) {
    val state by playerViewModel.items.collectAsState()
    val currentIndex by playerViewModel.currentIndex.collectAsState()

    // 将视频列表传给 playerViewModel
    LaunchedEffect(items) {
        if (items.isNotEmpty() && state.isEmpty()) {
            playerViewModel.loadItems(items)
            playerViewModel.playAt(0)
        } else if (items.isNotEmpty()) {
            playerViewModel.loadItems(items)
        }
    }

    // 使用 LazyColumn 作为垂直滑动（简易版）
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(0.dp)
    ) {
        items(items, key = { it.Id }) { item ->
            val itemIndex = items.indexOf(item)
            val isActive = itemIndex == currentIndex

            if (isActive) {
                VideoCard(
                    item = item,
                    viewModel = playerViewModel,
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(9f / 16f),
                    onHeartToggle = { favorite ->
                        if (favorite) feedViewModel.toggleFavorite(item)
                    }
                )
            } else {
                // 非当前播放：占位卡（显示封面和标题）
                PlaceholderCard(item = item)
            }
        }

        // 预加载更多
        item {
            if (items.size >= 20) {
                LaunchedEffect(Unit) {
                    feedViewModel.loadMore()
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color.White)
                }
            }
        }
    }
}

/**
 * 占位卡（非播放项，显示封面和标题）
 */
@Composable
private fun PlaceholderCard(item: EmbyItem) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(9f / 16f)
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = item.Name,
                color = Color.White,
                fontSize = 18.sp
            )
            item.Overview?.let {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = it.take(100) + if (it.length > 100) "…" else "",
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

/**
 * 底部筛选栏
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterBar(
    modifier: Modifier = Modifier,
    libraries: List<String>,
    selectedLibrary: String?,
    feedType: FeedType,
    orientationMode: OrientationMode,
    onLibrarySelected: (String) -> Unit,
    onFeedTypeSelected: (FeedType) -> Unit,
    onOrientationSelected: (OrientationMode) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = modifier
            .fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.Black.copy(alpha = 0.7f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // 第一行：库选择
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "媒体库",
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.width(60.dp)
                )
                AssistChip(
                    onClick = { expanded = !expanded },
                    label = {
                        Text(
                            text = selectedLibrary ?: "全部",
                            color = Color.White,
                            fontSize = 12.sp
                        )
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
                    )
                )

                DropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("全部") },
                        onClick = {
                            onLibrarySelected("")
                            expanded = false
                        }
                    )
                    libraries.forEach { name ->
                        DropdownMenuItem(
                            text = { Text(name) },
                            onClick = {
                                onLibrarySelected(name)
                                expanded = false
                            }
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // 第二行：排序 + 方向
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 排序方式
                FilterChipGroup(
                    options = FeedType.values().toList(),
                    selected = feedType,
                    label = { it.name }
                ) { onFeedTypeSelected(it) }

                Spacer(Modifier.weight(1f))

                // 方向过滤
                FilterChipGroup(
                    options = OrientationMode.values().toList(),
                    selected = orientationMode,
                    label = { it.name }
                ) { onOrientationSelected(it) }
            }
        }
    }
}

/**
 * 通用 FilterChip 组
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun <T> FilterChipGroup(
    options: List<T>,
    selected: T,
    label: (T) -> String,
    onSelected: (T) -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        options.forEach { option ->
            val isSelected = option == selected
            FilterChip(
                selected = isSelected,
                onClick = { onSelected(option) },
                label = {
                    Text(
                        text = label(option),
                        color = if (isSelected) Color.White
                        else Color.White.copy(alpha = 0.7f),
                        fontSize = 11.sp
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    }
}

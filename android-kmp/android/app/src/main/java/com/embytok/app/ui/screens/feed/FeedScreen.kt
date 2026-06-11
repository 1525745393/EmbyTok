package com.embytok.app.ui.screens.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.VideoFeedViewModel
import com.embytok.domain.model.EmbyItem

/**
 * 视频流首页
 *
 * 支持两种浏览模式：
 *  - 网格模式：两列瀑布流，适合快速浏览
 *  - 竖屏模式：TikTok 风格全屏视频流
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    viewModel: FeedViewModel = viewModel(),
    onOpenPlayer: (EmbyItem) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenVerticalFeed: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val items by viewModel.filteredItems.collectAsState()
    val sort by viewModel.sort.collectAsState()
    val orientation by viewModel.orientation.collectAsState()

    // 竖屏/网格模式切换
    var isVerticalFeed by remember { mutableStateOf(false) }

    // 竖屏 Feed ViewModel（仅在竖屏模式下使用）
    val verticalFeedViewModel: VideoFeedViewModel = viewModel()

    // 切换到竖屏模式时，加载视频列表
    androidx.compose.runtime.LaunchedEffect(isVerticalFeed, items) {
        if (isVerticalFeed && items.isNotEmpty()) {
            verticalFeedViewModel.setItems(items)
        }
    }

    // 根据模式选择渲染网格或竖屏流
    if (isVerticalFeed) {
        VerticalFeedScreen(
            viewModel = verticalFeedViewModel,
            mediaClient = viewModel.mediaClient,
            onExitVerticalMode = { isVerticalFeed = false },
            onOpenPlayer = onOpenPlayer
        )
    } else {
        GridFeedScreen(
            state = state,
            items = items,
            sort = sort,
            orientation = orientation,
            viewModel = viewModel,
            onOpenPlayer = onOpenPlayer,
            onOpenSettings = onOpenSettings,
            onOpenSearch = onOpenSearch,
            onToggleVerticalMode = { isVerticalFeed = true }
        )
    }
}

/** 网格模式（默认视图） */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GridFeedScreen(
    state: FeedViewModel.FeedState,
    items: List<EmbyItem>,
    sort: FeedViewModel.SortMode,
    orientation: FeedViewModel.OrientationFilter,
    viewModel: FeedViewModel,
    onOpenPlayer: (EmbyItem) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenSearch: () -> Unit,
    onToggleVerticalMode: () -> Unit
) {

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = { Text("EmbyTok", color = Color(0xFFE91E63)) },
                actions = {
                    // 竖屏 TikTok 模式切换按钮
                    IconButton(onClick = onToggleVerticalMode) {
                        Icon(
                            Icons.Default.SwapVert,
                            contentDescription = "竖屏模式",
                            tint = Color(0xFFE91E63)
                        )
                    }
                    var libraryExpanded by remember { mutableStateOf(false) }
                    IconButton(onClick = { libraryExpanded = true }) {
                        Text(
                            text = state.selectedLibrary?.Name ?: "选择媒体库",
                            color = Color.White,
                            fontSize = 14.sp
                        )
                    }
                    DropdownMenu(
                        expanded = libraryExpanded,
                        onDismissRequest = { libraryExpanded = false }
                    ) {
                        state.libraries.forEach { lib ->
                            DropdownMenuItem(
                                text = { Text(lib.Name) },
                                onClick = {
                                    viewModel.selectLibrary(lib)
                                    libraryExpanded = false
                                }
                            )
                        }
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "设置", tint = Color.White)
                    }
                    IconButton(onClick = onOpenSearch) {
                        Icon(Icons.Default.Search, contentDescription = "搜索", tint = Color.White)
                    }
                    IconButton(onClick = onOpenVerticalFeed) {
                        Text(
                            text = "竖屏",
                            color = Color.White,
                            fontSize = 12.sp,
                            modifier = Modifier
                                .background(Color(0xFF2A2A2A), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0A0A)
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            if (state.libraries.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    var sortExpanded by remember { mutableStateOf(false) }
                    Box {
                        FilterChip(
                            selected = false,
                            onClick = { sortExpanded = true },
                            label = { Text("排序: ${sort.display}", color = Color.White) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = Color(0xFF1A1A1A)
                            )
                        )
                        DropdownMenu(
                            expanded = sortExpanded,
                            onDismissRequest = { sortExpanded = false }
                        ) {
                            FeedViewModel.SortMode.values().forEach { mode ->
                                DropdownMenuItem(
                                    text = { Text(mode.display) },
                                    onClick = {
                                        viewModel.setSort(mode)
                                        sortExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    var orientExpanded by remember { mutableStateOf(false) }
                    Box {
                        FilterChip(
                            selected = false,
                            onClick = { orientExpanded = true },
                            label = { Text(orientation.display, color = Color.White) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = Color(0xFF1A1A1A)
                            )
                        )
                        DropdownMenu(
                            expanded = orientExpanded,
                            onDismissRequest = { orientExpanded = false }
                        ) {
                            FeedViewModel.OrientationFilter.values().forEach { mode ->
                                DropdownMenuItem(
                                    text = { Text(mode.display) },
                                    onClick = {
                                        viewModel.setOrientation(mode)
                                        orientExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Box(modifier = Modifier.fillMaxSize()) {
                when {
                    state.isLoading && items.isEmpty() -> {
                        CircularProgressIndicator(
                            color = Color(0xFFE91E63),
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    !state.errorMessage.isNullOrEmpty() && items.isEmpty() -> {
                        Text(
                            text = state.errorMessage!!,
                            color = Color(0xFFCF6679),
                            modifier = Modifier.align(Alignment.Center).padding(24.dp)
                        )
                    }
                    items.isEmpty() -> {
                        Text(
                            text = "没有可播放的视频",
                            color = Color(0xFFB3B3B3),
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    else -> {
                        val isPortrait = orientation == FeedViewModel.OrientationFilter.PORTRAIT
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(if (isPortrait) 1 else 2),
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp)
                        ) {
                            items(items, key = { it.Id }) { item ->
                                VideoCard(
                                    item = item,
                                    mediaClient = viewModel.mediaClient,
                                    onClick = { onOpenPlayer(item) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * TikTok 风格竖屏视频流全屏界面
 *
 * 使用 VerticalPager 实现上下滑动切换视频
 * 每个页面：全屏封面图 + 底部视频信息 + 侧边操作按钮
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VerticalFeedScreen(
    viewModel: VideoFeedViewModel,
    mediaClient: com.embytok.domain.client.MediaClient?,
    onExitVerticalMode: () -> Unit,
    onOpenPlayer: (EmbyItem) -> Unit
) {
    val items by viewModel.items.collectAsState()
    val currentIndex by viewModel.currentIndex.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        if (items.isEmpty()) {
            // 空列表
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("暂无视频", color = Color(0xFF888888), fontSize = 16.sp)
                Spacer(Modifier.height(16.dp))
                androidx.compose.material3.Button(
                    onClick = onExitVerticalMode,
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFE91E63)
                    )
                ) {
                    Text("返回网格视图", color = Color.White)
                }
            }
        } else {
            // VerticalPager 实现竖屏滑动
            androidx.compose.foundation.pager.VerticalPager(
                state = rememberPagerState(initialPage = currentIndex) { items.size },
                modifier = Modifier.fillMaxSize()
            ) { page ->
                val item = items[page]
                val isCurrentPage = page == currentIndex

                VerticalFeedPage(
                    item = item,
                    mediaClient = mediaClient,
                    isPlaying = isCurrentPage && viewModel.isPlaying.value,
                    onPlayPause = { viewModel.togglePlayPause() },
                    onSeekBack = { viewModel.seekTo((viewModel.currentPositionMs.value - 10000).coerceAtLeast(0)) },
                    onSeekForward = { viewModel.seekTo(viewModel.currentPositionMs.value + 10000) },
                    onOpenFullPlayer = { onOpenPlayer(item) },
                    onPrevious = { viewModel.playPrevious() },
                    onNext = { viewModel.playNext() },
                    canGoPrevious = page > 0,
                    canGoNext = page < items.size - 1
                )
            }

            // 顶部返回按钮
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                androidx.compose.material3.IconButton(
                    onClick = onExitVerticalMode,
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(50))
                ) {
                    Icon(
                        Icons.Default.Apps,
                        contentDescription = "返回网格",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun VerticalFeedPage(
    item: EmbyItem,
    mediaClient: com.embytok.domain.client.MediaClient?,
    isPlaying: Boolean,
    onPlayPause: () -> Unit,
    onSeekBack: () -> Unit,
    onSeekForward: () -> Unit,
    onOpenFullPlayer: () -> Unit,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    canGoPrevious: Boolean,
    canGoNext: Boolean
) {
    val imageUrl = mediaClient?.buildImageUrl(
        itemId = item.Id,
        imageTag = "Primary",
        maxWidth = 1080,
        maxHeight = 1920
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF121212))
    ) {
        // 封面图（竖屏海报比例）
        coil.compose.AsyncImage(
            model = coil.request.ImageRequest.Builder(
                androidx.compose.ui.platform.LocalContext.current
            )
                .data(imageUrl)
                .crossfade(true)
                .build(),
            contentDescription = item.Name,
            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
            error = {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("▶", color = Color(0xFFE91E63), fontSize = 48.sp)
                }
            }
        )

        // 半透明渐变遮罩
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.7f)
                        )
                    )
                )
        )

        // ===== 右侧操作按钮列 =====
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 12.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 头像/封面按钮
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(Color(0xFFE91E63), RoundedCornerShape(50)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("▶", color = Color.White, fontSize = 20.sp)
                }
            }

            // 收藏
            val isFav = item.UserData?.IsFavorite ?: false
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = { /* TODO: 切换收藏 */ }) {
                    Icon(
                        if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "收藏",
                        tint = if (isFav) Color(0xFFFF4444) else Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Text(
                    text = "${item.UserData?.PlayCount ?: 0}",
                    color = Color.White,
                    fontSize = 11.sp
                )
            }

            // 评论（暂无）
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Default.Settings,
                    contentDescription = "评论",
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(32.dp)
                )
                Text("评论", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
            }

            // 分享（暂无）
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Default.Settings,
                    contentDescription = "分享",
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(32.dp)
                )
                Text("分享", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
            }
        }

        // ===== 底部视频信息 =====
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 16.dp, bottom = 32.dp, end = 72.dp)
        ) {
            // 作者/标题
            Text(
                text = item.Name,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = item.Overview?.take(80) ?: "",
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 13.sp,
                maxLines = 2
            )

            Spacer(Modifier.height(8.dp))

            // 标签行
            Row(verticalAlignment = Alignment.CenterVertically) {
                item.ProductionYear?.let {
                    Text(
                        text = "$it",
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 12.sp
                    )
                }
                item.RunTimeTicks?.let { ticks ->
                    val minutes = ticks / 600_000_000L
                    if (minutes > 0) {
                        Text(
                            text = " · ${minutes}m",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // 播放控制按钮
            Row(verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.material3.IconButton(onClick = onSeekBack) {
                    Text("⏪", fontSize = 20.sp)
                }
                Spacer(Modifier.width(8.dp))
                androidx.compose.material3.IconButton(onClick = onPlayPause) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "暂停" else "播放",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                androidx.compose.material3.IconButton(onClick = onSeekForward) {
                    Text("⏩", fontSize = 20.sp)
                }
                Spacer(Modifier.width(16.dp))
                androidx.compose.material3.Button(
                    onClick = onOpenFullPlayer,
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFE91E63)
                    )
                ) {
                    Text("全屏播放", color = Color.White, fontSize = 12.sp)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VideoCard(
    item: EmbyItem,
    mediaClient: com.embytok.domain.client.MediaClient?,
    onClick: () -> Unit
) {
    val isPortrait = item.Width != null && item.Height != null && item.Height > item.Width

    androidx.compose.material3.Card(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1A)
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 封面图区域：根据方向使用不同的宽高比
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(if (isPortrait) 2f / 3f else 16f / 9f)
                    .background(Color(0xFF2A2A2A)),
                contentAlignment = Alignment.Center
            ) {
                val imageUrl = mediaClient?.buildImageUrl(
                    itemId = item.Id,
                    imageTag = "Primary",
                    maxWidth = if (isPortrait) 400 else 800,
                    maxHeight = if (isPortrait) 600 else 450
                )

                if (imageUrl != null) {
                    coil.compose.AsyncImage(
                        model = coil.request.ImageRequest.Builder(
                            androidx.compose.ui.platform.LocalContext.current
                        )
                            .data(imageUrl)
                            .diskCacheKey("embytok_${item.Id}_primary")
                            .memoryCacheKey("embytok_${item.Id}_primary")
                            .diskCachePolicy(coil.request.CachePolicy.ENABLED)
                            .memoryCachePolicy(coil.request.CachePolicy.ENABLED)
                            .crossfade(true)
                            .build(),
                        contentDescription = item.Name,
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                        placeholder = {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                androidx.compose.material3.CircularProgressIndicator(
                                    modifier = Modifier.size(28.dp),
                                    color = Color(0xFFE91E63)
                                )
                            }
                        },
                        error = {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "▶",
                                    color = Color(0xFFE91E63),
                                    fontSize = 36.sp
                                )
                            }
                        }
                    )
                } else {
                    Text(
                        text = "▶",
                        color = Color(0xFFE91E63),
                        fontSize = 36.sp
                    )
                }

                // 左下角播放进度条（如果有观看进度）
                val progress = item.UserData?.PlaybackPositionTicks
                val total = item.RunTimeTicks
                if (progress != null && total != null && total > 0 && progress > 0) {
                    val ratio = (progress.toFloat() / total.toFloat()).coerceIn(0f, 1f)
                    if (ratio > 0.02f && ratio < 0.98f) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .fillMaxWidth()
                                .height(4.dp)
                                .background(Color.Black.copy(alpha = 0.4f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(ratio)
                                    .background(Color(0xFFE91E63))
                            )
                        }
                    }
                }

                // 右上角：时长 badge
                item.RunTimeTicks?.let { ticks ->
                    if (ticks > 0) {
                        val minutes = ticks / 600_000_000L
                        if (minutes > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp)
                                    .background(
                                        Color.Black.copy(alpha = 0.65f),
                                        RoundedCornerShape(6.dp)
                                    )
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = if (minutes >= 60) {
                                        "${minutes / 60}h${minutes % 60}m"
                                    } else "${minutes}m",
                                    color = Color.White,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }

                // 左上角：收藏标记
                if (item.UserData?.IsFavorite == true) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                            .background(
                                Color(0xFFE91E63).copy(alpha = 0.85f),
                                RoundedCornerShape(6.dp)
                            )
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "★",
                            color = Color.White,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            // 标题 + 年份
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = item.Name,
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 3.dp)
                ) {
                    item.ProductionYear?.let {
                        Text(
                            text = "$it",
                            color = Color(0xFF888888),
                            fontSize = 11.sp
                        )
                    }
                    if (item.ProductionYear != null) {
                        Text(
                            text = " · ",
                            color = Color(0xFF555555),
                            fontSize = 11.sp
                        )
                    }
                    Text(
                        text = item.Type,
                        color = Color(0xFF888888),
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

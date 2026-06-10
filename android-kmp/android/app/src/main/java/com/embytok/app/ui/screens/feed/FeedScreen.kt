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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
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
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.FeedViewModel.OrientationFilter
import com.embytok.app.viewmodel.FeedViewModel.SortMode
import com.embytok.domain.model.EmbyItem

/**
 * 视频流首页。包含：
 *   - 顶部栏：标题、媒体库选择、设置
 *   - 过滤器行：排序、方向
 *   - 主体：视频网格（若为竖屏则单列，若横屏则 2+ 列）
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    viewModel: FeedViewModel,
    onOpenPlayer: (EmbyItem) -> Unit,
    onOpenSettings: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "EmbyTok",
                            color = Color(0xFFE91E63),
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                },
                actions = {
                    // 媒体库选择下拉
                    var libraryExpanded by remember { mutableStateOf(false) }
                    IconButton(onClick = { libraryExpanded = true }) {
                        Text(
                            text = state.selectedLibrary?.Name ?: "选择媒体库",
                            color = Color.White,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(end = 8.dp)
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
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "设置",
                            tint = Color.White
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
        ) {
            // ===== 过滤器行 =====
            if (state.libraries.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 排序
                    var sortExpanded by remember { mutableStateOf(false) }
                    Box {
                        FilterChip(
                            selected = false,
                            onClick = { sortExpanded = true },
                            label = { Text("排序：${state.sort.display}") },
                            colors = FilterChipDefaults.filterChipColors(
                                labelColor = Color.White,
                                containerColor = Color(0xFF1A1A1A)
                            )
                        )
                        DropdownMenu(
                            expanded = sortExpanded,
                            onDismissRequest = { sortExpanded = false }
                        ) {
                            SortMode.values().forEach { mode ->
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

                    // 方向过滤
                    var orientExpanded by remember { mutableStateOf(false) }
                    Box {
                        FilterChip(
                            selected = false,
                            onClick = { orientExpanded = true },
                            label = { Text(state.orientation.display) },
                            colors = FilterChipDefaults.filterChipColors(
                                labelColor = Color.White,
                                containerColor = Color(0xFF1A1A1A)
                            )
                        )
                        DropdownMenu(
                            expanded = orientExpanded,
                            onDismissRequest = { orientExpanded = false }
                        ) {
                            OrientationFilter.values().forEach { mode ->
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

            // ===== 主体：加载中 / 网格 / 空状态 =====
            Box(modifier = Modifier.fillMaxSize()) {
                when {
                    state.isLoading && state.filteredItems.isEmpty() -> {
                        CircularProgressIndicator(
                            color = Color(0xFFE91E63),
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    !state.errorMessage.isNullOrEmpty() && state.filteredItems.isEmpty() -> {
                        Text(
                            text = state.errorMessage!!,
                            color = Color(0xFFCF6679),
                            modifier = Modifier
                                .align(Alignment.Center)
                                .padding(24.dp)
                        )
                    }
                    state.filteredItems.isEmpty() -> {
                        Text(
                            text = "没有可播放的视频",
                            color = Color(0xFFB3B3B3),
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    else -> {
                        val isPortrait = state.orientation == OrientationFilter.PORTRAIT
                        VideoGrid(
                            items = state.filteredItems,
                            columns = if (isPortrait) 1 else 2,
                            onOpen = onOpenPlayer
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun VideoGrid(
    items: List<EmbyItem>,
    columns: Int,
    onOpen: (EmbyItem) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp)
    ) {
        items(items) { item ->
            VideoCard(item = item, onClick = { onOpen(item) })
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VideoCard(item: EmbyItem, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1A)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(if (item.Width != null && item.Height != null) {
                item.Width.toFloat() / item.Height.toFloat()
            } else 9f / 16f)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(Color(0xFF2A2A2A)),
                contentAlignment = Alignment.Center
            ) {
                Text("▶", color = Color(0xFFE91E63), fontSize = 32.sp)
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = item.Name,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 1
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = buildString {
                        if (item.ProductionYear != null) append("${item.ProductionYear}")
                        val duration = item.RunTimeTicks
                        if (duration != null && duration > 0) {
                            val minutes = duration / 600_000_000L
                            if (minutes > 0) {
                                if (item.ProductionYear != null) append(" · ")
                                append("${minutes}分")
                            }
                        }
                    },
                    color = Color(0xFFB3B3B3),
                    fontSize = 12.sp,
                    maxLines = 1
                )
            }
        }
    }
}

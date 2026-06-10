package com.embytok.app.ui.screens.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.embytok.app.R
import com.embytok.app.ui.components.VideoCard
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.domain.model.EmbyItem
import com.embytok.domain.model.FeedType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    viewModel: FeedViewModel,
    onNavigateToPlayer: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    // 监听滚动，检测当前可见项
    LaunchedEffect(listState) {
        snapshotFlow {
            val layoutInfo = listState.layoutInfo
            val visibleItems = layoutInfo.visibleItemsInfo
            if (visibleItems.isEmpty()) 0
            else visibleItems.minOf { it.index }
        }.collect { firstVisibleIndex ->
            viewModel.setCurrentIndex(firstVisibleIndex)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(stringResource(R.string.nav_home))
                },
                actions = {
                    FeedTypeSelector(
                        selectedType = uiState.feedType,
                        onTypeSelected = { viewModel.setFeedType(it) }
                    )

                    if (uiState.feedType == FeedType.RANDOM) {
                        IconButton(onClick = { viewModel.shuffle() }) {
                            Icon(
                                Icons.Default.Shuffle,
                                contentDescription = stringResource(R.string.feed_shuffle)
                            )
                        }
                    }

                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = stringResource(R.string.nav_settings)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading && uiState.videos.isEmpty() -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.error != null && uiState.videos.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = uiState.error ?: "",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadInitialData() }) {
                            Text(stringResource(R.string.retry))
                        }
                    }
                }

                uiState.videos.isEmpty() -> {
                    Text(
                        text = stringResource(R.string.search_no_results),
                        modifier = Modifier.align(Alignment.Center),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                else -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 16.dp)
                    ) {
                        items(
                            items = uiState.videos,
                            key = { it.Id }
                        ) { item ->
                            VideoCard(
                                item = item,
                                isActive = uiState.currentIndex == uiState.videos.indexOf(item),
                                isFavorite = viewModel.isFavorite(item.Id),
                                onToggleFavorite = { viewModel.toggleFavorite(item) },
                                onClick = { onNavigateToPlayer(item.Id) }
                            )
                        }

                        // 加载更多指示器
                        if (uiState.hasMore) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(32.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FeedTypeSelector(
    selectedType: FeedType,
    onTypeSelected: (FeedType) -> Unit
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        FeedType.entries.forEach { type ->
            FilterChip(
                selected = selectedType == type,
                onClick = { onTypeSelected(type) },
                label = {
                    Text(
                        text = when (type) {
                            FeedType.LATEST -> stringResource(R.string.feed_latest)
                            FeedType.RANDOM -> stringResource(R.string.feed_random)
                            FeedType.FAVORITES -> stringResource(R.string.feed_favorites)
                            FeedType.HISTORY -> stringResource(R.string.nav_history)
                        },
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                modifier = Modifier.height(32.dp)
            )
        }
    }
}

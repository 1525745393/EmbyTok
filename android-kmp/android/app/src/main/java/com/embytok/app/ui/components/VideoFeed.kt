package com.embytok.app.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.embytok.app.viewmodel.VideoFeedViewModel
import kotlinx.coroutines.launch

/**
 * 视频流（类似 TikTok 的垂直滑动列表）
 *
 * 使用 VerticalPager 实现，每页一个视频卡片
 *
 * @param viewModel 视频流 ViewModel
 * @param onPageChanged 页面切换回调
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun VideoFeed(
    viewModel: VideoFeedViewModel,
    modifier: Modifier = Modifier,
    onPageChanged: (Int) -> Unit = {}
) {
    val items by viewModel.items.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    // 创建 PagerState，初始从 0 开始
    val pagerState = rememberPagerState(
        initialPage = 0,
        initialPageOffsetFraction = 0f
    ) {
        items.size
    }

    // 监听页面切换
    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }
            .collect { page ->
                // 切换页面时播放对应视频
                if (page != viewModel.currentIndex.value) {
                    viewModel.playAt(page)
                }
                onPageChanged(page)
            }
    }

    // 初始播放第一页
    LaunchedEffect(items) {
        if (items.isNotEmpty() && pagerState.currentPage == 0) {
            viewModel.playAt(0)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // 垂直 Pager
        VerticalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
            userScrollEnabled = true
        ) { page ->
            val item = items.getOrNull(page)
            if (item != null) {
                VideoCard(
                    item = item,
                    playerViewModel = viewModel,
                    onCardClick = { viewModel.togglePlayPause() },
                    onDoubleClickLeft = { viewModel.seekTo(viewModel.currentPositionMs.value - 10000) },
                    onDoubleClickRight = { viewModel.seekTo(viewModel.currentPositionMs.value + 10000) },
                    onInfoClick = {},
                    modifier = Modifier.fillMaxSize(),
                    isCurrentItem = page == viewModel.currentIndex.value
                )
            }
        }
    }
}

/**
 * 水平版 VideoFeed（如需要横屏滑动模式）
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HorizontalVideoFeed(
    viewModel: VideoFeedViewModel,
    modifier: Modifier = Modifier
) {
    val items by viewModel.items.collectAsState()

    val pagerState = rememberPagerState(
        initialPage = 0,
        initialPageOffsetFraction = 0f
    ) { items.size }

    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }
            .collect { page ->
                if (page != viewModel.currentIndex.value) {
                    viewModel.playAt(page)
                }
            }
    }

    Box(modifier = modifier.fillMaxSize().background(Color.Black)) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            items.getOrNull(page)?.let { item ->
                VideoCard(
                    item = item,
                    playerViewModel = viewModel,
                    onCardClick = { viewModel.togglePlayPause() },
                    onDoubleClickLeft = { viewModel.seekTo(viewModel.currentPositionMs.value - 10000) },
                    onDoubleClickRight = { viewModel.seekTo(viewModel.currentPositionMs.value + 10000) },
                    onInfoClick = {},
                    modifier = Modifier.fillMaxSize(),
                    isCurrentItem = page == viewModel.currentIndex.value
                )
            }
        }
    }
}

package com.embytok.app.ui.screens.feed

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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.Icons as IconsDefault
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.domain.model.EmbyItem
import kotlinx.coroutines.launch

/**
 * TikTok 风格的竖屏视频流。
 *
 * 使用 VerticalPager（全屏卡片，上下滑动切换视频。
 * 每张卡片包含：
 *  - 全屏封面图（Coil 加载，contentScale = Crop
 *  - 左下角标题 / 描述 / 时长
 *  - 右侧操作按钮（收藏）
 */
@OptIn(ExperimentalMaterial3Api::class, androidx.compose.foundation.pager.ExperimentalPagerApi::class)
@Composable
fun VerticalFeedScreen(
    viewModel: FeedViewModel,
    onOpenPlayer: (EmbyItem) -> Unit,
    onBack: () -> Unit
) {
    val items by viewModel.filteredItems.collectAsState()
    val pagerState = rememberPagerState(initialPage = 0)
    val scope = rememberCoroutineScope()

    val list = items.value

    androidx.compose.material3.Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = { Text("竖屏浏览", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Medium) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "返回", tint = Color.White)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color(0xFF0A0A0A),
                titleContentColor = Color.White
            )
        )
    ) { padding ->
        if (list.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "暂无视频",
                    color = Color(0xFF888888),
                    fontSize = 14.sp
                )
            }
        } else {
            VerticalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize().padding(padding),
                pageCount = list.size
            ) { page ->
                val item = list[page]
                val mediaClient = viewModel.mediaClient
                FeedPage(
                    item = item,
                    mediaClient = mediaClient,
                    onClick = { onOpenPlayer(item) }
                )
            }
        }
    }
}

/**
 * 单个视频卡片页（全屏）。*/
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FeedPage(
    item: EmbyItem,
    mediaClient: com.embytok.domain.client.MediaClient?,
    onClick: () -> Unit
) {
    val imageUrl = mediaClient?.buildImageUrl(item.Id, "Primary", 720, 1280)

    var isFav by remember { mutableStateOf(item.UserData?.IsFavorite ?: false) }
    val scope = rememberCoroutineScope()

    androidx.compose.foundation.clickable(
        onClick = onClick,
        modifier = Modifier.fillMaxSize()
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0xFF0A0A0A)
        ) {
            // 封面图
            if (imageUrl != null) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = item.Name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            // 底部渐变遮罩
            Box(
                modifier = Modifier.fillMaxSize().background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.3f),
                            Color.Black.copy(alpha = 0.85f)
                        ),
                )
            )

            // 标题和信息
            Column(
                modifier = Modifier.fillMaxSize().padding(20.dp),
                verticalArrangement = Arrangement.Bottom,
                horizontalAlignment = Alignment.Start
            ) {
                // 标题
                Text(
                    text = item.Name,
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth().padding(end = 80.dp)
                )
                Spacer(Modifier.height(8.dp))
                // 元信息
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val typeLabel = item.Type
                    Text(typeLabel, color = Color(0xFFE91E63), fontSize = 13.sp)
                    Text(" · ", color = Color(0xFFAAAAAA), fontSize = 13.sp)
                    item.ProductionYear?.let {
                        Text("$it", color = Color(0xFFDDDDDD), fontSize = 13.sp)
                    }
                    item.RunTimeTicks?.let { ticks ->
                        val min = ticks / 600_000_000L
                        if (min > 0) {
                            Text(" · ${min}分钟", color = Color(0xFFDDDDDD), fontSize = 13.sp)
                        }
                    }
                }
                Spacer(Modifier.height(30.dp))
                // 提示
                Text(
                    "点击播放",
                    color = Color(0xFFAAAAAA), fontSize = 12.sp
                )
            }

            // 右侧操作按钮
            Column(
                modifier = Modifier.align(Alignment.BottomEnd).padding(end = 20.dp, bottom = 120.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 收藏按钮
                IconButton(
                    onClick = {
                        scope.launch {
                        ServiceLocator.mediaClient()?.let { client ->
                            client.toggleFavorite(item.Id)
                            isFav = !isFav
                        }
                    }
                },
                    modifier = Modifier.size(52.dp).background(
                        Color.Black.copy(alpha = 0.45f),
                        RoundedCornerShape(50)
                    )
                ) {
                    Icon(
                        imageVector = if (isFav) Icons.Filled.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = if (isFav) "取消收藏" else "收藏",
                        tint = if (isFav) Color(0xFFFF5370) else Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    }
}

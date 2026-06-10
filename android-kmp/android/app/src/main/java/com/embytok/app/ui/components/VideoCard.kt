package com.embytok.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.embytok.app.R
import com.embytok.domain.model.EmbyItem
import com.embytok.ui.theme.FavoriteActive
import com.embytok.ui.theme.Overlay

@Composable
fun VideoCard(
    item: EmbyItem,
    isActive: Boolean,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showControls by remember { mutableStateOf(false) }
    var showHeartAnimation by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(600.dp)
            .clickable { onClick() }
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { showControls = !showControls },
                    onDoubleTap = {
                        showHeartAnimation = true
                        onToggleFavorite()
                    }
                )
            }
    ) {
        // 海报图片
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(getImageUrl(item))
                .crossfade(true)
                .build(),
            contentDescription = item.Name,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // 底部渐变遮罩
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Overlay)
                    )
                )
        )

        // 右上角收藏按钮
        IconButton(
            onClick = onToggleFavorite,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Icon(
                imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                contentDescription = stringResource(R.string.cd_favorite),
                tint = if (isFavorite) FavoriteActive else Color.White,
                modifier = Modifier.size(32.dp)
            )
        }

        // 底部信息
        if (showControls) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp)
            ) {
                Text(
                    text = item.getDisplayName(),
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                item.Overview?.let { overview ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = overview,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.8f),
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item.getDurationText().takeIf { it.isNotEmpty() }?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }

                    item.ProductionYear?.let { year ->
                        Text(
                            text = year.toString(),
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }

                // 播放进度
                item.UserData?.let { userData ->
                    val progress = userData.getProgressPercentage(item.runTimeTicks ?: 0)
                    if (progress > 0 && progress < 0.95f) {
                        Spacer(modifier = Modifier.height(12.dp))
                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp)),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = Color.White.copy(alpha = 0.3f)
                        )
                    }
                }
            }
        }

        // 爱心动画
        if (showHeartAnimation) {
            HeartAnimation(
                onAnimationEnd = { showHeartAnimation = false }
            )
        }

        // 提示标签
        if (isActive) {
            Text(
                text = when {
                    item.UserData?.PlaybackPositionTicks ?: 0 > 0 -> stringResource(R.string.history_continue)
                    item.UserData?.IsFavorite == true -> stringResource(R.string.favorites_title)
                    else -> ""
                },
                style = MaterialTheme.typography.labelSmall,
                color = Color.White,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(16.dp)
                    .background(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.8f),
                        shape = RoundedCornerShape(4.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
private fun HeartAnimation(
    onAnimationEnd: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = 1.5f,
        animationSpec = tween(300),
        finishedListener = {
            onAnimationEnd()
        },
        label = "heart_scale"
    )

    val alpha by animateFloatAsState(
        targetValue = 0f,
        animationSpec = tween(500, delayMillis = 300),
        label = "heart_alpha"
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Favorite,
            contentDescription = null,
            tint = FavoriteActive,
            modifier = Modifier
                .size(100.dp)
                .scale(scale)
                .background(Color.Transparent)
        )
    }
}

@Composable
private fun getImageUrl(item: EmbyItem): String {
    // TODO: 从 EmbyClient 获取实际图片 URL
    val tag = item.ImageTags?.Primary ?: ""
    return "/api/Items/${item.Id}/Images/Primary?maxWidth=800&tag=$tag"
}

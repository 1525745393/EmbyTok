package com.embytok.app.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import coil.request.CachePolicy
import com.embytok.domain.model.EmbyItem

/**
 * 视频封面图（Coil AsyncImage 封装）。
 *
 * 基于 EmbyItem 构造缩略图 URL。当 serverUrl 为空时显示占位灰色底。
 * Emby 的缩略图 API 格式：
 *   {baseUrl}/Items/{itemId}/Images/Primary?width=400&format=jpg
 */
@Composable
fun VideoThumbnail(
    item: EmbyItem,
    serverUrl: String,
    apiKey: String? = null,
    modifier: Modifier = Modifier
) {
    val imageUrl = if (serverUrl.isNotEmpty()) {
        val key = apiKey?.let { "&api_key=$it" }.orEmpty()
        "${serverUrl.trimEnd('/')}/Items/${item.Id}/Images/Primary?width=400&format=jpg${key}"
    } else {
        null
    }

    if (imageUrl == null) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Color(0xFF1A1A1A))
        )
    } else {
        AsyncImage(
            model = ImageRequest.Builder(androidx.compose.ui.platform.LocalContext.current)
                .data(imageUrl)
                .diskCacheKey("emby_thumb_${item.Id}")
                .memoryCacheKey("emby_thumb_${item.Id}")
                .diskCachePolicy(CachePolicy.ENABLED)
                .memoryCachePolicy(CachePolicy.ENABLED)
                .crossfade(true)
                .build(),
            contentDescription = item.Name,
            modifier = modifier.fillMaxSize(),
            placeholder = {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF1A1A1A)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                }
            },
            error = {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF1A1A1A))
                )
            }
        )
    }
}

/**
 * 非 Composable 辅助方法：构造 Emby 缩略图 URL。
 */
fun EmbyItem.primaryImageUrl(
    context: Context,
    serverUrl: String,
    apiKey: String? = null
): ImageRequest {
    val key = apiKey?.let { "&api_key=$it" }.orEmpty()
    val url = "${serverUrl.trimEnd('/')}/Items/${this.Id}/Images/Primary?width=400&format=jpg${key}"
    return ImageRequest.Builder(context)
        .data(url)
        .diskCacheKey("emby_thumb_${this.Id}")
        .memoryCacheKey("emby_thumb_${this.Id}")
        .diskCachePolicy(CachePolicy.ENABLED)
        .memoryCachePolicy(CachePolicy.ENABLED)
        .crossfade(true)
        .build()
}

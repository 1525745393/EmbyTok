package com.embytok.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.embytok.app.ui.EmbyTokApp
import com.embytok.app.ui.theme.EmbyTokTheme

/**
 * EmbyTok 主 Activity
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 启用 Edge-to-Edge 布局
        enableEdgeToEdge()

        setContent {
            EmbyTokTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    EmbyTokApp(
                        onNavigateToPlayer = { itemId ->
                            // 处理深度链接导航
                            handleDeepLink(itemId)
                        }
                    )
                }
            }
        }

        // 处理传入的 Intent（深度链接）
        handleIntent(intent)
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: android.content.Intent?) {
        intent?.data?.let { uri ->
            // 处理 embytok://play/{itemId} 或 embytok://library/{libId}
            when (uri.host) {
                "play" -> {
                    val itemId = uri.lastPathSegment
                    itemId?.let { handleDeepLink(it) }
                }
                "library" -> {
                    val libId = uri.lastPathSegment
                    libId?.let { handleLibraryDeepLink(it) }
                }
            }
        }
    }

    private fun handleDeepLink(itemId: String) {
        // TODO: 通过 ViewModel 或 Navigation 传递到播放页
        // 可以使用 SavedStateHandle 或 SharedFlow
    }

    private fun handleLibraryDeepLink(libId: String) {
        // TODO: 导航到指定媒体库
    }
}

package com.embytok.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.embytok.app.ui.EmbyTokApp
import com.embytok.app.ui.theme.EmbyTokTheme
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import org.koin.androidx.compose.viewModel

/**
 * EmbyTok 主 Activity（原生 Android 壳）
 *
 * 职责：
 *  - 初始化 Edge-to-Edge 沉浸式布局
 *  - 设置 Compose 内容
 *  - 通过 Koin 注入根 ViewModel（Login/Feed/Player）
 *  - 处理深度链接（如播放某个 itemId）
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 启用 Edge-to-Edge：让内容延伸到状态栏和导航栏
        enableEdgeToEdge()

        // 沉浸式：让视频播放占满全屏
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        insetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        insetsController.hide(WindowInsetsCompat.Type.systemBars())

        setContent {
            // 通过 Koin 注入 ViewModel
            val loginViewModel: LoginViewModel by viewModel()
            val feedViewModel: FeedViewModel by viewModel()
            val playerViewModel: VideoPlayerViewModel by viewModel()

            EmbyTokTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    EmbyTokApp(
                        loginViewModel = loginViewModel,
                        feedViewModel = feedViewModel,
                        playerViewModel = playerViewModel
                    )
                }
            }
        }

        // 处理传入 Intent（深层链接）
        handleIntent(intent)
    }

    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    /**
     * 处理深度链接（例如：embytok://play/{itemId}）
     */
    private fun handleIntent(intent: android.content.Intent?) {
        val uri = intent?.data ?: return
        when (uri.host) {
            "play" -> {
                val itemId = uri.lastPathSegment ?: return
                // TODO: 若已在 FEED 页面，跳转到播放器详情页
            }
            "library" -> {
                // TODO: 切换到指定媒体库的视频列表
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // 重新进入沉浸式（系统栏可能已恢复显示）
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }
}

package com.embytok.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat
import com.embytok.app.ui.EmbyTokApp
import org.koin.androidx.viewmodel.ext.android.viewModel
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel

/**
 * EmbyTok 原生应用主入口。
 *
 * - 启用 Edge-to-Edge：沉浸式全屏
 * - 设置 Compose Content：挂载 [EmbyTokApp]
 * - 通过 Koin 的 [viewModel] 注入 ViewModel
 */
class MainActivity : ComponentActivity() {

    // Koin ViewModel 注入
    private val loginViewModel: LoginViewModel by viewModel()
    private val feedViewModel: FeedViewModel by viewModel()
    private val playerViewModel: VideoPlayerViewModel by viewModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 沉浸式 Edge-to-Edge
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Black
                ) {
                    EmbyTokApp(
                        loginViewModel = loginViewModel,
                        feedViewModel = feedViewModel,
                        playerViewModel = playerViewModel
                    )
                }
            }
        }
    }
}

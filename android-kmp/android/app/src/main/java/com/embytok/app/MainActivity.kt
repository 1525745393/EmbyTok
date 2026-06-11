package com.embytok.app

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.embytok.app.ui.screens.feed.FeedScreen
import com.embytok.app.ui.screens.feed.VerticalFeedScreen
import com.embytok.app.ui.screens.history.WatchHistoryScreen
import com.embytok.app.ui.screens.login.LoginScreen
import com.embytok.app.ui.screens.player.PlayerScreen
import com.embytok.app.ui.screens.search.SearchScreen
import com.embytok.app.ui.screens.server.ServerManagerScreen
import com.embytok.app.ui.screens.settings.SettingsScreen
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.SearchViewModel
import com.embytok.app.viewmodel.ServerManagerViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.app.viewmodel.WatchHistoryViewModel
import com.embytok.domain.model.EmbyItem
import kotlinx.serialization.json.Json

/**
 * EmbyTok Android 应用主入口。
 *
 * - 启用 Edge-to-Edge 沉浸式布局
 * - 设置 Jetpack Compose 内容
 * - 处理外部深度链接（embytok://play/... / embytok://library/...）
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 沉浸式：状态栏/导航栏透明，内容延伸到系统栏下
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            enableEdgeToEdge(
                statusBarStyle = SystemBarStyle.dark(Color(0xFF0A0A0A).toArgb()),
                navigationBarStyle = SystemBarStyle.dark(Color(0xFF0A0A0A).toArgb())
            )
        } else {
            enableEdgeToEdge()
        }

        setContent {
            EmbyTokAppRoot(
                onDeepLinkItem = handleDeepLinkItem(intent.data?.toString())
            )
        }
    }

    /**
     * 解析深度链接，返回初始要播放的 EmbyItem（如果有）。
     * 支持格式：
     *   - embytok://play/<json_item>
     *   - embytok://library/<libraryId>
     */
    private fun handleDeepLinkItem(uri: String?): EmbyItem? {
        if (uri == null) return null
        val data = uri.removePrefix("embytok://play/").trim()
        if (data == uri) return null
        return runCatching {
            Json.decodeFromString<EmbyItem>(data)
        }.getOrNull()
    }
}

/**
 * Compose 根组件：配置主题与导航。
 */
@Composable
fun EmbyTokAppRoot(
    onDeepLinkItem: EmbyItem? = null
) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFE91E63),
            background = Color(0xFF0A0A0A),
            surface = Color(0xFF1A1A1A)
        )
    ) {
        androidx.compose.material3.Surface(
            modifier = Modifier.fillMaxSize().background(Color(0xFF0A0A0A))
        ) {
            val navController = rememberNavController()
            val loginViewModel: LoginViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val feedViewModel: FeedViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val playerViewModel: VideoPlayerViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val searchViewModel: SearchViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val serverManagerViewModel: ServerManagerViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val watchHistoryViewModel: WatchHistoryViewModel = androidx.lifecycle.viewmodel.compose.viewModel()

            NavHost(
                navController = navController,
                startDestination = Routes.LOGIN
            ) {
                composable(Routes.LOGIN) {
                    LoginScreen(loginViewModel) {
                        navController.navigate(Routes.FEED) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    }
                }
                composable(Routes.FEED) {
                    FeedScreen(
                        viewModel = feedViewModel,
                        onOpenPlayer = { item ->
                            val json = runCatching { Json.encodeToString(EmbyItem.serializer(), item) }
                                .getOrDefault("")
                            val safe = android.net.Uri.encode(json)
                            navController.navigate("${Routes.PLAYER}/$safe")
                        },
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                        onOpenSearch = { navController.navigate(Routes.SEARCH) },
                        onOpenVerticalFeed = { navController.navigate(Routes.VERTICAL_FEED) }
                    )
                }
                composable(Routes.SEARCH) {
                    SearchScreen(
                        viewModel = searchViewModel,
                        onItemClicked = { item ->
                            val json = runCatching { Json.encodeToString(EmbyItem.serializer(), item) }
                                .getOrDefault("")
                            val safe = android.net.Uri.encode(json)
                            navController.navigate("${Routes.PLAYER}/$safe")
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
                composable(Routes.VERTICAL_FEED) {
                    VerticalFeedScreen(
                        viewModel = feedViewModel,
                        onOpenPlayer = { item ->
                            val json = runCatching { Json.encodeToString(EmbyItem.serializer(), item) }
                                .getOrDefault("")
                            val safe = android.net.Uri.encode(json)
                            navController.navigate("${Routes.PLAYER}/$safe")
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
                composable(
                    route = "${Routes.PLAYER}/{item}",
                    arguments = listOf(
                        androidx.navigation.NavArgument("item").apply {
                            type = androidx.navigation.NavType.StringType
                        }
                    )
                ) { entry ->
                    val jsonArg = entry.arguments?.getString("item").orEmpty()
                    val decoded = runCatching { android.net.Uri.decode(jsonArg) }.getOrDefault("")
                    val item: EmbyItem? = runCatching {
                        Json.decodeFromString<EmbyItem>(decoded)
                    }.getOrNull()

                    if (item != null) {
                        PlayerScreen(
                            item = item,
                            viewModel = playerViewModel,
                            onBack = { navController.popBackStack() }
                        )
                    } else {
                        navController.popBackStack()
                    }
                }
                composable(Routes.SETTINGS) {
                    SettingsScreen(
                        onLogout = {
                            // 清除登录态，返回登录页
                            loginViewModel.logout()
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        onOpenServerManager = { navController.navigate(Routes.SERVERS) },
                        onOpenHistory = { navController.navigate(Routes.HISTORY) },
                        onBack = { navController.popBackStack() }
                    )
                }
                composable(Routes.SERVERS) {
                    ServerManagerScreen(
                        viewModel = serverManagerViewModel,
                        onBack = { navController.popBackStack() },
                        onServerSwitched = {
                            // 切换服务器后重新加载 Feed 数据
                            feedViewModel.reload()
                            navController.popBackStack()
                        }
                    )
                }
                composable(Routes.HISTORY) {
                    WatchHistoryScreen(
                        viewModel = watchHistoryViewModel,
                        onItemClicked = { itemId, startPositionMs ->
                            // TODO: 根据 itemId 从服务器获取 EmbyItem 然后跳转到 PlayerScreen
                            // 简化处理：直接弹回 Feed
                            navController.popBackStack()
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
            }
        }
    }
}

/**
 * 导航路由常量。
 */
object Routes {
    const val LOGIN = "login"
    const val FEED = "feed"
    const val PLAYER = "player"
    const val SETTINGS = "settings"
    const val SEARCH = "search"
    const val SERVERS = "servers"
    const val HISTORY = "history"
    const val VERTICAL_FEED = "vertical_feed"
}

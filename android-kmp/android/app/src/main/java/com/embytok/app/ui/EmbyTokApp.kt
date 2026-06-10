package com.embytok.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.embytok.app.ui.screens.feed.FeedScreen
import com.embytok.app.ui.screens.login.LoginScreen
import com.embytok.app.ui.screens.player.PlayerScreen
import com.embytok.app.ui.screens.settings.SettingsScreen
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.domain.model.EmbyItem
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * EmbyTok 根组件。
 *
 * 负责：
 *   - 应用级主题（Material 3 Dark）
 *   - 路由：LOGIN -> FEED -> PLAYER / SETTINGS
 *   - 注入 ViewModel
 */
@Composable
fun EmbyTokApp() {
    MaterialTheme(colorScheme = darkColorScheme(
        primary = Color(0xFFE91E63),
        background = Color(0xFF0A0A0A),
        surface = Color(0xFF1A1A1A)
    )) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0A0A0A))
        ) {
            val navController = rememberNavController()

            // ViewModels：跨页面共享
            val loginViewModel: LoginViewModel = viewModel()
            val feedViewModel: FeedViewModel = viewModel()
            val playerViewModel: VideoPlayerViewModel = viewModel()

            NavHost(navController = navController, startDestination = Routes.LOGIN) {
                composable(Routes.LOGIN) {
                    LoginScreen(loginViewModel) {
                        navController.navigate(Routes.FEED) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
                composable(Routes.FEED) {
                    FeedScreen(
                        viewModel = feedViewModel,
                        onOpenPlayer = { item ->
                            val json = Json.encodeToString(item)
                            navController.navigate("${Routes.PLAYER}/$json")
                        },
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) }
                    )
                }
                composable(
                    route = "${Routes.PLAYER}/{item}",
                    arguments = listOf(navArgument("item") { type = NavType.StringType })
                ) { backStackEntry ->
                    val itemJson = backStackEntry.arguments?.getString("item") ?: return@composable
                    val item: EmbyItem = remember(itemJson) {
                        runCatching { Json.decodeFromString<EmbyItem>(itemJson) }.getOrNull()
                    } ?: return@composable
                    PlayerScreen(
                        item = item,
                        viewModel = playerViewModel,
                        onBack = { navController.popBackStack() }
                    )
                }
                composable(Routes.SETTINGS) {
                    SettingsScreen(
                        onLogout = {
                            loginViewModel.logout()
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
            }
        }
    }
}

object Routes {
    const val LOGIN = "login"
    const val FEED = "feed"
    const val PLAYER = "player"
    const val SETTINGS = "settings"
}

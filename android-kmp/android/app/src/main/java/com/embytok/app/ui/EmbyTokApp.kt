package com.embytok.app.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.embytok.app.ui.screens.feed.FeedScreen
import com.embytok.app.ui.screens.login.LoginScreen
import com.embytok.app.ui.screens.player.PlayerScreen
import com.embytok.app.ui.screens.settings.SettingsScreen
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel

/**
 * 导航路由常量
 */
object Routes {
    const val LOGIN = "login"
    const val FEED = "feed"
    const val PLAYER = "player/{itemId}"
    const val SETTINGS = "settings"

    fun player(itemId: String) = "player/$itemId"
}

/**
 * EmbyTok 主应用（Compose 入口）
 *
 * 由 [com.embytok.app.MainActivity] 调用 setContent 启动
 * 负责：
 *  - 管理根级导航
 *  - 提供 ViewModel 实例到各个 Screen
 */
@Composable
fun EmbyTokApp(
    loginViewModel: LoginViewModel,
    feedViewModel: FeedViewModel,
    playerViewModel: VideoPlayerViewModel,
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    val loginState by loginViewModel.uiState.collectAsState()

    // 起始路由（根据登录状态判断）
    val startDestination = if (loginState.isLoggedIn) Routes.FEED else Routes.LOGIN

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // ============ 登录页 ============
        composable(Routes.LOGIN) {
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = {
                    navController.navigate(Routes.FEED) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        // ============ 视频流首页 ============
        composable(Routes.FEED) {
            FeedScreen(
                feedViewModel = feedViewModel,
                playerViewModel = playerViewModel,
                onNavigateToPlayer = { itemId ->
                    navController.navigate(Routes.player(itemId))
                },
                onNavigateToSettings = {
                    navController.navigate(Routes.SETTINGS)
                },
                onLogout = {
                    loginViewModel.logout()
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.FEED) { inclusive = true }
                    }
                }
            )
        }

        // ============ 播放器（详情页） ============
        composable(Routes.PLAYER) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId") ?: ""
            PlayerScreen(
                playerViewModel = playerViewModel,
                itemId = itemId,
                onBack = { navController.popBackStack() }
            )
        }

        // ============ 设置页 ============
        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    loginViewModel.logout()
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.FEED) { inclusive = true }
                    }
                }
            )
        }
    }
}

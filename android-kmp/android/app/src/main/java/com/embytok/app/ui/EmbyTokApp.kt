package com.embytok.app.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.embytok.app.ui.screens.feed.FeedScreen
import com.embytok.app.ui.screens.login.LoginScreen
import com.embytok.app.ui.screens.player.PlayerScreen
import com.embytok.app.ui.screens.settings.SettingsScreen
import com.embytok.app.viewmodel.LoginViewModel
import org.koin.androidx.compose.koinViewModel

/**
 * 导航路由
 */
object Routes {
    const val LOGIN = "login"
    const val FEED = "feed"
    const val PLAYER = "player/{itemId}"
    const val SETTINGS = "settings"

    fun player(itemId: String) = "player/$itemId"
}

/**
 * EmbyTok 主应用入口
 */
@Composable
fun EmbyTokApp(
    onNavigateToPlayer: (String) -> Unit = {}
) {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = koinViewModel()
    val loginState by loginViewModel.uiState.collectAsState()

    // 根据登录状态决定起始路由
    val startDestination = if (loginState.isLoggedIn) Routes.FEED else Routes.LOGIN

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // 登录页
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

        // 视频流页
        composable(Routes.FEED) {
            FeedScreen(
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

        // 播放器页
        composable(
            route = Routes.PLAYER,
            arguments = listOf(
                navArgument("itemId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId") ?: ""
            PlayerScreen(
                itemId = itemId,
                onBack = { navController.popBackStack() }
            )
        }

        // 设置页
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

/**
 * 加载状态组件
 */
@Composable
fun LoadingScreen(
    message: String = "加载中..."
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
        Text(
            text = message,
            modifier = Modifier.align(Alignment.Center)
        )
    }
}

/**
 * 错误状态组件
 */
@Composable
fun ErrorScreen(
    message: String,
    onRetry: () -> Unit = {}
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.error
        )
    }
}

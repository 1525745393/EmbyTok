package com.embytok.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.viewmodel.compose.viewModel
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
import com.embytok.domain.model.EmbyItem
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * EmbyTok 根组件
 *
 * 页面路由：LOGIN -> FEED -> PLAYER / SETTINGS
 */
@Composable
fun EmbyTokApp() {
    MaterialTheme(colorScheme = darkColorScheme(
        primary = Color(0xFFE91E63),
        background = Color(0xFF0A0A0A),
        surface = Color(0xFF1A1A1A)
    )) {
        Surface(modifier = Modifier.fillMaxSize().background(Color(0xFF0A0A0A))) {
            val navController = rememberNavController()
            val loginViewModel: LoginViewModel = viewModel()
            val feedViewModel: FeedViewModel = viewModel()
            val playerViewModel: VideoPlayerViewModel = viewModel()
            val isLoggedIn by loginViewModel.isLoggedIn.collectAsState()

            val startRoute = remember(isLoggedIn) {
                if (isLoggedIn) Routes.FEED else Routes.LOGIN
            }

            NavHost(navController = navController, startDestination = startRoute) {
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
                            val json = runCatching { Json.encodeToString(item) }.getOrDefault("")
                            val safe = android.net.Uri.encode(json)
                            navController.navigate("${Routes.PLAYER}/$safe")
                        },
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) }
                    )
                }
                composable(
                    route = "${Routes.PLAYER}/{item}",
                    arguments = listOf(
                        androidx.navigation.NamedNavArgument("item") {
                            type = androidx.navigation.NavType.StringType
                        }
                    )
                ) { backStackEntry ->
                    val json = backStackEntry.arguments?.getString("item").orEmpty()
                    val decoded = runCatching { android.net.Uri.decode(json) }.getOrDefault("")
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

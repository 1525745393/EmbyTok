package com.embytok.app.di

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import com.embytok.player.VideoPlayerManager
import com.embytok.repository.LocalRepository
import com.embytok.usecase.GetFavoriteVideosUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetRecentVideosUseCase
import com.embytok.usecase.GetVideosUseCase
import com.embytok.usecase.GetWatchHistoryUseCase
import com.embytok.usecase.MarkAsWatchedUseCase
import com.embytok.usecase.SaveWatchProgressUseCase
import com.embytok.usecase.ToggleFavoriteUseCase
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin ViewModel 依赖注入模块
 *
 * 提供：
 *  - [LoginViewModel]：登录页
 *  - [FeedViewModel]：Feed 视频流
 *  - [VideoPlayerViewModel]：播放器
 */
val viewModelModule = module {

    // ===== LoginViewModel =====
    viewModel {
        LoginViewModel(
            preferences = get(),
            loginUseCase = get()
        )
    }

    // ===== FeedViewModel =====
    viewModel {
        FeedViewModel(
            getLibrariesUseCase = get(),
            getVideosUseCase = get(),
            getRecentVideosUseCase = get(),
            getFavoriteVideosUseCase = get(),
            preferences = get()
        )
    }

    // ===== VideoPlayerViewModel =====
    viewModel {
        VideoPlayerViewModel(
            playerManager = get(),
            preferences = get(),
            localRepository = get()
        )
    }
}

/**
 * 注意：
 *
 * 以上 `viewModel {}` 在 Activity/Fragment 中可通过：
 *
 *   val vm: LoginViewModel by viewModel()
 *
 * 直接注入，前提是 Activity 继承自 [org.koin.core.context.KoinContext].
 * 若使用普通 Activity，请通过：
 *
 *   val vm = ViewModelProvider(this, object : ViewModelProvider.Factory {
 *       override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
 *           val koin = getKoin()
 *           return when (modelClass) {
 *               LoginViewModel::class.java -> koin.get<LoginViewModel>() as T
 *               else -> throw IllegalArgumentException("Unknown VM: $modelClass")
 *           }
 *       }
 *   }).get(LoginViewModel::class.java)
 */

package com.embytok.app.di

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.viewmodel.CreationExtras
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.VideoPlayerViewModel
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module
import com.embytok.player.VideoPlayerManager
import com.embytok.repository.LocalRepository
import com.embytok.usecase.GetFavoriteVideosUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetRecentVideosUseCase
import com.embytok.usecase.GetVideosUseCase

/**
 * Koin ViewModel 模块。
 *
 * 在 Activity / Fragment 中通过 `by viewModel()` 注入 ViewModel。
 */
val viewModelModule = module {

    viewModel { LoginViewModel(get(), get<AuthenticateUseCase>()) }

    viewModel {
        FeedViewModel(
            getLibrariesUseCase = get(),
            getVideosUseCase = get(),
            getRecentVideosUseCase = get(),
            getFavoriteVideosUseCase = get(),
            preferences = get()
        )
    }

    viewModel {
        VideoPlayerViewModel(
            playerManager = get<VideoPlayerManager>(),
            preferences = get<AppPreferences>(),
            localRepository = get<LocalRepository>()
        )
    }
}

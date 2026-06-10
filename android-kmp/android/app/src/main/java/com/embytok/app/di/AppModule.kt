package com.embytok.app.di

import android.content.Context
import com.embytok.app.preferences.AppPreferences
import com.embytok.network.EmbyClient
import com.embytok.network.MediaClient
import com.embytok.network.PlexClient
import com.embytok.player.VideoPlayerManager
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightLocalRepository
import com.embytok.db.EmbyTokDatabase
import com.embytok.usecase.AuthenticateUseCase
import com.embytok.usecase.GetFavoriteVideosUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetRecentVideosUseCase
import com.embytok.usecase.GetSubtitlesUseCase
import com.embytok.usecase.GetVideosUseCase
import com.embytok.usecase.GetWatchHistoryUseCase
import com.embytok.usecase.MarkAsWatchedUseCase
import com.embytok.usecase.MediaUseCases
import com.embytok.usecase.SaveWatchProgressUseCase
import com.embytok.usecase.ToggleFavoriteUseCase
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import app.cash.sqldelight.db.SqlDriver
import org.koin.core.module.dsl.singleOf
import org.koin.dsl.module

/**
 * Koin 核心依赖模块
 *
 * 提供：
 *  - [AppPreferences]：DataStore 偏好
 *  - [SqlDriver]：SQLDelight 驱动
 *  - [EmbyTokDatabase]：数据库实例
 *  - [LocalRepository]：本地存储仓库（观看历史/收藏/搜索）
 *  - [MediaClient]：Emby/Plex 网络客户端（根据 serverType 动态选择）
 *  - [VideoPlayerManager]：ExoPlayer 播放器封装
 *  - [MediaUseCases]：用例聚合
 */
val appModule = module {

    // ===== Preferences =====
    single { AppPreferences(get()) }

    // ===== SQLDelight 数据库 =====
    single<SqlDriver> {
        AndroidSqliteDriver(
            schema = EmbyTokDatabase.Schema,
            context = get<Context>().applicationContext,
            name = "embytok.db"
        )
    }

    single {
        EmbyTokDatabase(get())
    }

    single<LocalRepository> {
        SqlDelightLocalRepository(get())
    }

    // ===== Media 网络客户端（根据 preferences 选择 Emby / Plex） =====
    single<MediaClient> {
        val prefs: AppPreferences = get()
        // 构造时暂时用默认 EmbyClient；登录时会根据 serverType 重建
        EmbyClient(
            baseUrl = "https://placeholder",
            apiKey = null,
            userId = null
        )
    }

    // ===== VideoPlayerManager =====
    single { VideoPlayerManager(get()) }

    // ===== UseCases =====
    single {
        AuthenticateUseCase(
            preferences = get(),
            createEmbyClient = { config ->
                EmbyClient(
                    baseUrl = config.serverUrl,
                    apiKey = config.apiKey,
                    userId = config.userId
                )
            },
            createPlexClient = { config ->
                PlexClient(
                    baseUrl = config.serverUrl,
                    token = config.accessToken,
                    clientIdentifier = "android-kmp"
                )
            }
        )
    }

    singleOf(::GetLibrariesUseCase)
    singleOf(::GetVideosUseCase)
    singleOf(::GetRecentVideosUseCase)
    singleOf(::GetFavoriteVideosUseCase)
    singleOf(::GetWatchHistoryUseCase)
    singleOf(::GetSubtitlesUseCase)
    singleOf(::MarkAsWatchedUseCase)
    singleOf(::SaveWatchProgressUseCase)
    singleOf(::ToggleFavoriteUseCase)

    single {
        MediaUseCases(
            authenticate = get(),
            getLibraries = get(),
            getVideos = get(),
            getRecentVideos = get(),
            getFavoriteVideos = get(),
            getWatchHistory = get(),
            getSubtitles = get(),
            markAsWatched = get(),
            saveWatchProgress = get(),
            toggleFavorite = get()
        )
    }
}

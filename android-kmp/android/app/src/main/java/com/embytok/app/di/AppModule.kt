package com.embytok.app.di

import android.content.Context
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.db.EmbyTokDatabase
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.client.EmbyClient
import com.embytok.network.client.PlexClient
import com.embytok.player.VideoPlayerManager
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightLocalRepository
import com.embytok.usecase.GetFavoriteVideosUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetRecentVideosUseCase
import com.embytok.usecase.GetSubtitlesUseCase
import com.embytok.usecase.GetVideosUseCase
import com.embytok.usecase.GetWatchHistoryUseCase
import com.embytok.usecase.MarkAsWatchedUseCase
import com.embytok.usecase.SaveWatchProgressUseCase
import com.embytok.usecase.ToggleFavoriteUseCase
import kotlinx.coroutines.flow.firstOrNull
import org.koin.dsl.module

/**
 * Koin 核心依赖模块。
 *
 * 注册次序：DataStore → SQLDelight → LocalRepository → MediaClient → UseCases → VideoPlayerManager
 */
val appModule = module {

    // ===== AppPreferences（基于 DataStore） =====
    single { AppPreferences(get<Context>().applicationContext) }

    // ===== SQLDelight 数据库 =====
    single {
        AndroidSqliteDriver(
            schema = EmbyTokDatabase.Schema,
            context = get<Context>().applicationContext,
            name = "embytok.db"
        )
    }
    single { EmbyTokDatabase(get()) }
    single<LocalRepository> { SqlDelightLocalRepository(get()) }

    // ===== MediaClient 工厂（Emby / Plex） =====
    // 提供一个 Provider：读取当前 AppPreferences.serverConfig 动态构造 MediaClient
    single {
        MediaClientProvider(get())
    }
    factory { (config: ServerConfig) ->
        when (config.serverType) {
            ServerType.EMBY -> EmbyClient(
                baseUrl = config.url,
                apiKey = config.token.ifBlank { null },
                userId = config.userId.ifBlank { null }
            )
            ServerType.PLEX -> PlexClient(
                baseUrl = config.url,
                token = config.token,
                clientIdentifier = "android-kmp"
            )
        }
    }

    // ===== VideoPlayerManager =====
    single { VideoPlayerManager(get<Context>().applicationContext) }

    // ===== UseCases =====
    single {
        AuthenticateUseCase(
            preferences = get(),
            createEmbyClient = { config ->
                EmbyClient(
                    baseUrl = config.url,
                    apiKey = config.token.ifBlank { null },
                    userId = config.userId.ifBlank { null }
                )
            },
            createPlexClient = { config ->
                PlexClient(
                    baseUrl = config.url,
                    token = config.token,
                    clientIdentifier = "android-kmp"
                )
            }
        )
    }
    single { GetLibrariesUseCase { get<MediaClientProvider>().current() } }
    single { GetVideosUseCase { get<MediaClientProvider>().current() } }
    single { GetRecentVideosUseCase { get<MediaClientProvider>().current() } }
    single { GetFavoriteVideosUseCase { get<MediaClientProvider>().current() } }
    single { GetWatchHistoryUseCase(get<LocalRepository>()) }
    single { SaveWatchProgressUseCase(get<LocalRepository>()) }
    single { MarkAsWatchedUseCase { get<MediaClientProvider>().current() } }
    single { ToggleFavoriteUseCase { get<MediaClientProvider>().current() } }
    single { GetSubtitlesUseCase { get<MediaClientProvider>().current() } }
}

/**
 * MediaClientProvider：基于当前 AppPreferences 中的 ServerConfig 构造 MediaClient。
 * 带缓存 — 每次 [clearCache] 后（如登出 / 切换服务器）会重新构造。
 */
class MediaClientProvider(private val preferences: AppPreferences) {

    @Volatile
    private var cached: MediaClient? = null

    /** 清除缓存；登录成功后调用。 */
    fun clearCache() {
        cached = null
    }

    /** 同步获取（若有缓存）；否则返回 null。 */
    fun current(): MediaClient? = cached

    /** 挂起获取：若缓存不存在则从 preferences 读取并构造。 */
    suspend fun currentSuspend(): MediaClient? {
        cached?.let { return it }
        val config = preferences.serverConfig.firstOrNull() ?: return null
        return when (config.serverType) {
            ServerType.EMBY -> EmbyClient(
                baseUrl = config.url,
                apiKey = config.token.ifBlank { null },
                userId = config.userId.ifBlank { null }
            )
            ServerType.PLEX -> PlexClient(
                baseUrl = config.url,
                token = config.token,
                clientIdentifier = "android-kmp"
            )
        }.also { cached = it }
    }
}

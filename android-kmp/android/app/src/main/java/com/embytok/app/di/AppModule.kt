package com.embytok.app.di

import android.content.Context
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerType
import com.embytok.network.ClientFactory
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightRepository
import com.embytok.db.EmbyTokDatabase
import com.embytok.db.AndroidDatabaseDriverFactory
import com.embytok.usecase.AuthenticateUseCase
import com.embytok.usecase.GetFavoritesUseCase
import com.embytok.usecase.GetLibrariesUseCase
import com.embytok.usecase.GetResumeItemsUseCase
import com.embytok.usecase.GetSubtitleTracksUseCase
import com.embytok.usecase.GetVideosUseCase
import com.embytok.usecase.GetVideoUrlUseCase
import com.embytok.usecase.SearchItemsUseCase
import com.embytok.usecase.ToggleFavoriteUseCase
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

/**
 * 主 Koin 模块
 *
 * 按功能分层提供依赖：
 *  - Preferences 层（DataStore）
 *  - 数据库层（SQLDelight）
 *  - Repository 层
 *  - 网络层（Ktor + MediaClient）
 *  - UseCase 层
 */
val appModule: Module = module {

    // ============ Preferences（DataStore） ============
    single<AppPreferences> { AppPreferences(androidContext()) }

    // ============ 数据库（SQLDelight） ============
    single<EmbyTokDatabase> {
        AndroidDatabaseDriverFactory.createDatabase(androidContext())
    }

    single<LocalRepository> {
        SqlDelightRepository(get<EmbyTokDatabase>())
    }

    // ============ 网络层（MediaClient） ============
    // 从 DataStore 读取配置创建客户端（单例）
    single<MediaClient?> {
        val prefs = get<AppPreferences>()
        val config = prefs.getServerConfig() ?: return@single null
        ClientFactory.fromConfig(config)
    }

    // 认证工厂（lambda）：每次登录时调用
    single<suspend (ServerType, String, String, String, String) -> com.embytok.domain.model.ServerConfig> {
        { type, url, username, password, token ->
            ClientFactory.create(type, url, username, password, token)
        }
    }

    // ============ UseCase 层 ============
    single<AuthenticateUseCase> {
        AuthenticateUseCase(get())
    }

    single<GetLibrariesUseCase> {
        GetLibrariesUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<GetVideosUseCase> {
        GetVideosUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<GetResumeItemsUseCase> {
        GetResumeItemsUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<GetFavoritesUseCase> {
        GetFavoritesUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<ToggleFavoriteUseCase> {
        ToggleFavoriteUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<GetVideoUrlUseCase> {
        GetVideoUrlUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<GetSubtitleTracksUseCase> {
        GetSubtitleTracksUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }

    single<SearchItemsUseCase> {
        SearchItemsUseCase(getClient = { requireNotNull(get<MediaClient?>()) { "未登录：MediaClient 未初始化" } })
    }
}

/**
 * 重新初始化 MediaClient（登录成功后调用）
 */
fun reinitializeMediaClient(context: Context, config: com.embytok.domain.model.ServerConfig) {
    ClientFactory.fromConfig(config)
}

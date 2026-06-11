package com.embytok.app.ui.di

import android.content.Context
import com.embytok.app.db.AndroidDatabaseDriverFactory
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.db.EmbyTokDatabase
import com.embytok.domain.client.MediaClient
import com.embytok.network.ClientFactory
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightLocalRepository
import com.embytok.player.VideoPlayerManager

/**
 * 简化的单例依赖容器。
 *
 * 小型项目直接用 object 作为 ServiceLocator，不必引入 Koin/Hilt 依赖。
 * 提供：
 *  - AppPreferences（DataStore）
 *  - AuthenticateUseCase（登录/登出/状态判断）
 *  - LocalRepository（SQLDelight 本地数据库）
 *  - MediaClient（Emby 或 Plex 网络客户端）
 *  - VideoPlayerManager（ExoPlayer 播放管理器）
 */
object ServiceLocator {

    @Volatile
    private var appContext: Context? = null

    /** 必须在 Application.onCreate 中调用一次 */
    fun init(context: Context) {
        if (appContext == null) {
            appContext = context.applicationContext
        }
    }

    val preferences: AppPreferences by lazy {
        AppPreferences(appContext ?: error("ServiceLocator 未初始化"))
    }

    val authenticateUseCase: AuthenticateUseCase by lazy {
        AuthenticateUseCase(preferences)
    }

    private val database: EmbyTokDatabase by lazy {
        val driver = AndroidDatabaseDriverFactory(
            appContext ?: error("ServiceLocator 未初始化")
        ).createDriver()
        EmbyTokDatabase(driver)
    }

    val localRepository: LocalRepository by lazy {
        SqlDelightLocalRepository(database)
    }

    /**
     * 媒体客户端（Emby 或 Plex）
     * 根据已保存的 ServerConfig 动态创建，需要登录后调用
     */
    suspend fun mediaClient(): MediaClient? {
        val config = authenticateUseCase.currentConfig() ?: return null
        return ClientFactory.create(config)
    }

    /**
     * 视频播放管理器（单例 ExoPlayer 实例）
     */
    val playerManager: VideoPlayerManager by lazy {
        VideoPlayerManager(appContext ?: error("ServiceLocator 未初始化"))
    }
}

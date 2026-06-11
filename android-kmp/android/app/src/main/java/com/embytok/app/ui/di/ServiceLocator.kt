package com.embytok.app.ui.di

import android.content.Context
import com.embytok.app.db.AndroidDatabaseDriverFactory
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.db.EmbyTokDatabase
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightLocalRepository

/**
 * 简化的单例依赖容器。
 *
 * 在小型项目中可以直接用 object 作为 ServiceLocator，不必引入 Koin/Hilt。
 * 大型项目可以替换为真正的依赖注入框架。
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
        val driver = AndroidDatabaseDriverFactory(appContext ?: error("ServiceLocator 未初始化")).createDriver()
        EmbyTokDatabase(driver)
    }

    val localRepository: LocalRepository by lazy {
        SqlDelightLocalRepository(database)
    }
}

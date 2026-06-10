package com.embytok.app

import android.app.Application
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level
import com.embytok.app.di.appModule
import com.embytok.app.di.viewModelModule

/**
 * EmbyTok Application 入口。
 *
 * 负责：
 *  - 初始化 Koin 依赖注入
 *  - 提供全局 Context
 */
class EmbyTokApp : Application() {

    override fun onCreate() {
        super.onCreate()

        startKoin {
            androidLogger(Level.ERROR)
            androidContext(this@EmbyTokApp)
            modules(appModule, viewModelModule)
        }
    }
}

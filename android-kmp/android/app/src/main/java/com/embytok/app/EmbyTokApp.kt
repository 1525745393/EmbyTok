package com.embytok.app

import android.app.Application
import com.embytok.app.di.appModule
import com.embytok.common.EmbyTokLogger
import co.touchlab.kermit.Severity
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

/**
 * EmbyTok 应用类
 */
class EmbyTokApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // 初始化日志
        EmbyTokLogger.initialize(
            minSeverity = if (BuildConfig.DEBUG) Severity.Debug else Severity.Warn
        )

        // 初始化 Koin DI
        startKoin {
            androidLogger(if (BuildConfig.DEBUG) Level.DEBUG else Level.NONE)
            androidContext(this@EmbyTokApp)
            modules(appModule)
        }

        EmbyTokLogger.i("EmbyTok 应用已启动", "EmbyTokApp")
    }
}

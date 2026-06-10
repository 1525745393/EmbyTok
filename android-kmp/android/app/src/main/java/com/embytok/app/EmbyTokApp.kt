package com.embytok.app

import android.app.Application
import com.embytok.app.ui.di.ServiceLocator

/**
 * EmbyTok Android Application 入口。
 *
 * 负责初始化全局单例 [ServiceLocator]，使其可以在任何组件中获取
 * AppPreferences / AuthenticateUseCase 等核心依赖。
 */
class EmbyTokApp : Application() {

    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)
    }
}

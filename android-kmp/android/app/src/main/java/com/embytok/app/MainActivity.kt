package com.embytok.app

import android.app.Application
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.embytok.app.ui.EmbyTokApp
import com.embytok.app.ui.di.ServiceLocator

/**
 * EmbyTok Android 应用主入口
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 沉浸式 Edge-to-Edge
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            EmbyTokApp()
        }
    }
}

/**
 * 自定义 Application 类，初始化 ServiceLocator
 */
class EmbyTokApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)
    }
}

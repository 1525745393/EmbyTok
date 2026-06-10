package com.embytok.app.di

import android.content.Context
import com.embytok.app.preferences.AppPreferences
import com.embytok.db.AndroidDatabaseDriverFactory
import com.embytok.db.EmbyTokDatabase
import com.embytok.repository.LocalRepository
import com.embytok.repository.SqlDelightRepository
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

/**
 * Koin 依赖注入模块
 *
 * 按功能分层，方便测试时替换。
 */
val appModule: Module = module {
    // ============ DataStore 偏好设置 ============
    single<AppPreferences> { AppPreferences(androidContext()) }

    // ============ 数据库 (SQLDelight) ============
    single<EmbyTokDatabase> {
        AndroidDatabaseDriverFactory.createDatabase(androidContext())
    }

    single<LocalRepository> {
        SqlDelightRepository(get<EmbyTokDatabase>())
    }
}

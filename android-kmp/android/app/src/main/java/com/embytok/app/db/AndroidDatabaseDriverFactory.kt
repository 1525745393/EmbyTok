package com.embytok.db

import android.content.Context
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import app.cash.sqldelight.db.SqlDriver
import com.embytok.db.EmbyTokDatabase

/**
 * Android SQLDelight Driver 工厂
 * 在 Android 平台上创建数据库驱动，并负责数据库升级
 */
object AndroidDatabaseDriverFactory {

    private const val DB_NAME = "embytok.db"

    /**
     * 创建数据库 driver
     */
    fun createDriver(context: Context): SqlDriver {
        return AndroidSqliteDriver(
            schema = EmbyTokDatabase.Schema,
            context = context,
            name = DB_NAME
        )
    }

    /**
     * 创建 EmbyTokDatabase 实例（带 DI 友好的方式）
     */
    fun createDatabase(context: Context): EmbyTokDatabase {
        val driver = createDriver(context)
        return EmbyTokDatabase(driver)
    }

    /**
     * 清除数据库（仅测试/调试用）
     */
    fun clearDatabase(context: Context) {
        context.deleteDatabase(DB_NAME)
    }
}

/**
 * 平台通用 DatabaseDriverFactory 接口（未来支持 iOS）
 */
interface DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}

/**
 * Android 实现
 */
class AndroidDatabaseDriverFactoryImpl(
    private val context: Context
) : DatabaseDriverFactory {
    override fun createDriver(): SqlDriver {
        return AndroidDatabaseDriverFactory.createDriver(context)
    }
}

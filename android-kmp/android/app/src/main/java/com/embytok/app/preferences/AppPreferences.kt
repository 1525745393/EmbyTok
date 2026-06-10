package com.embytok.app.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.embytok.domain.model.AppLanguage
import com.embytok.domain.model.OrientationMode
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.domain.model.SubtitleSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

/**
 * 应用偏好设置管理器（基于 Android DataStore Preferences
 *
 * 负责持久化：
 *  - 服务器配置（ServerConfig
 *  - UI 偏好（方向过滤、默认静音、自动连播等）
 *  - 字幕设置
 *  - 语言设置
 */
class AppPreferences(
    private val context: Context
) {

    companion object {
        private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "embytok_preferences")

        // ============ Keys ============
        private object Keys {
            // 服务器配置
            val SERVER_TYPE = stringPreferencesKey("server_type")
            val SERVER_URL = stringPreferencesKey("server_url")
            val USERNAME = stringPreferencesKey("username")
            val TOKEN = stringPreferencesKey("token")
            val USER_ID = stringPreferencesKey("user_id")

            // UI 偏好
            val ORIENTATION_MODE = stringPreferencesKey("orientation_mode")
            val IS_MUTED = booleanPreferencesKey("is_muted")
            val AUTO_PLAY = booleanPreferencesKey("auto_play")

            // 字幕
            val SUBTITLE_ENABLED = booleanPreferencesKey("subtitle_enabled")
            val SUBTITLE_SIZE = stringPreferencesKey("subtitle_size")
            val SUBTITLE_COLOR = stringPreferencesKey("subtitle_color")
            val SUBTITLE_POSITION = stringPreferencesKey("subtitle_position")
            val SUBTITLE_BG = stringPreferencesKey("subtitle_bg_color")

            // 语言
            val LANGUAGE = stringPreferencesKey("language")
        }
    }

    private val dataStore = context.dataStore

    // ============ 服务器配置 ============

    fun getServerConfig(): ServerConfig? = runBlocking {
        val prefs = dataStore.data.first()
        val type = prefs[Keys.SERVER_TYPE] ?: return@runBlocking null
        val url = prefs[Keys.SERVER_URL] ?: return@runBlocking null
        val token = prefs[Keys.TOKEN] ?: return@runBlocking null
        val username = prefs[Keys.USERNAME] ?: ""
        val userId = prefs[Keys.USER_ID] ?: ""

        ServerConfig(
            url = url,
            username = username,
            token = token,
            userId = userId,
            serverType = ServerType.valueOf(type ?: "EMBY")
        )
    }

    suspend fun saveServerConfig(config: ServerConfig) {
        dataStore.edit {
            it[Keys.SERVER_TYPE] = config.serverType.name
            it[Keys.SERVER_URL] = config.url
            it[Keys.USERNAME] = config.username
            it[Keys.TOKEN] = config.token
            it[Keys.USER_ID] = config.userId
        }
    }

    suspend fun clearServerConfig() {
        dataStore.edit {
            it.remove(Keys.SERVER_TYPE)
            it.remove(Keys.SERVER_URL)
            it.remove(Keys.USERNAME)
            it.remove(Keys.TOKEN)
            it.remove(Keys.USER_ID)
        }
    }

    // ============ UI 偏好 ============

    val orientationMode: Flow<OrientationMode> = dataStore.data.map {
        val value = it[Keys.ORIENTATION_MODE] ?: "BOTH"
        OrientationMode.valueOf(value)
    }

    suspend fun setOrientationMode(mode: OrientationMode) {
        dataStore.edit { it[Keys.ORIENTATION_MODE] = mode.name }
    }

    val isMuted: Flow<Boolean> = dataStore.data.map {
        it[Keys.IS_MUTED] ?: false
    }

    suspend fun setMuted(muted: Boolean) {
        dataStore.edit { it[Keys.IS_MUTED] = muted }
    }

    val isAutoPlay: Flow<Boolean> = dataStore.data.map {
        it[Keys.AUTO_PLAY] ?: true
    }

    suspend fun setAutoPlay(enabled: Boolean) {
        dataStore.edit { it[Keys.AUTO_PLAY] = enabled }
    }

    // ============ 字幕设置 ============

    val subtitleSettings: Flow<SubtitleSettings> = dataStore.data.map {
        SubtitleSettings(
            enabled = it[Keys.SUBTITLE_ENABLED] ?: false,
            selectedTrackId = null, // 不持久化 trackId
            fontSize = FontSize.valueOf(
                it[Keys.SUBTITLE_SIZE] ?: FontSize.MEDIUM.name
            ),
            textColor = it[Keys.SUBTITLE_COLOR] ?: "#FFFFFF",
            backgroundColor = it[Keys.SUBTITLE_BG] ?: "#CC000000",
            position = SubtitlePosition.valueOf(
                it[Keys.SUBTITLE_POSITION] ?: SubtitlePosition.BOTTOM.name
            )
        )
    }

    suspend fun saveSubtitleSettings(settings: SubtitleSettings) {
        dataStore.edit {
            it[Keys.SUBTITLE_ENABLED] = settings.enabled
            it[Keys.SUBTITLE_SIZE] = settings.fontSize.name
            it[Keys.SUBTITLE_COLOR] = settings.textColor
            it[Keys.SUBTITLE_BG] = settings.backgroundColor
            it[Keys.SUBTITLE_POSITION] = settings.position.name
        }
    }

    // ============ 语言 ============

    val language: Flow<AppLanguage> = dataStore.data.map {
        AppLanguage.valueOf(it[Keys.LANGUAGE] ?: AppLanguage.SYSTEM.name)
    }

    suspend fun setLanguage(language: AppLanguage) {
        dataStore.edit { it[Keys.LANGUAGE] = language.name }
    }
}

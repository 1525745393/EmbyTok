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
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

// Context 扩展：单例 DataStore
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "embytok_preferences")

/**
 * AppPreferences — 应用偏好（DataStore 实现）
 *
 * 负责:
 *  - 服务器配置持久化 (ServerConfig: url / username / token / userId / serverType)
 *  - 播放偏好 (orientationMode / isMuted / isAutoPlay / playbackSpeed)
 *  - 字幕设置 (SubtitleSettings)
 *  - 应用语言 (AppLanguage)
 */
class AppPreferences(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }

    // ================ 服务器配置 ================

    /** 当前活动服务器（单用户登录场景使用的默认服务器 id） */
    suspend fun saveServerConfig(config: ServerConfig) {
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_URL] = config.url
            prefs[Keys.USERNAME] = config.username
            prefs[Keys.TOKEN] = config.token
            prefs[Keys.USER_ID] = config.userId
            prefs[Keys.SERVER_TYPE] = config.serverType.name
            prefs[Keys.SERVER_NAME] = config.serverName
            prefs[Keys.CURRENT_SERVER_ID] = config.id
        }
        // 同步写入服务器列表
        addToServerList(config)
    }

    val serverConfig: Flow<ServerConfig?> = context.dataStore.data.map { prefs ->
        val url = prefs[Keys.SERVER_URL] ?: return@map null
        val serverType = prefs[Keys.SERVER_TYPE]?.let {
            try { ServerType.valueOf(it) } catch (_: Exception) { ServerType.EMBY }
        } ?: ServerType.EMBY
        // 回退：如果缺少 id 则临时从 url+username 合成
        val urlVal = prefs[Keys.SERVER_URL].orEmpty()
        val usernameVal = prefs[Keys.USERNAME].orEmpty()
        val fallbackId = prefs[Keys.CURRENT_SERVER_ID]
            ?: computeServerId(urlVal, usernameVal, serverType)
        ServerConfig(
            id = fallbackId,
            url = url,
            username = usernameVal,
            token = prefs[Keys.TOKEN].orEmpty(),
            userId = prefs[Keys.USER_ID].orEmpty(),
            serverType = serverType,
            serverName = prefs[Keys.SERVER_NAME].orEmpty()
        )
    }

    suspend fun clearServerConfig() {
        context.dataStore.edit { prefs ->
            prefs.remove(Keys.SERVER_URL)
            prefs.remove(Keys.USERNAME)
            prefs.remove(Keys.TOKEN)
            prefs.remove(Keys.USER_ID)
            prefs.remove(Keys.SERVER_TYPE)
            prefs.remove(Keys.SERVER_NAME)
            prefs.remove(Keys.CURRENT_SERVER_ID)
        }
    }

    /** 当前活动服务器 id */
    val currentServerId: Flow<String?> = context.dataStore.data.map { it[Keys.CURRENT_SERVER_ID] }

    /** 切换当前活动服务器 */
    suspend fun switchToServer(serverId: String) {
        val list = serverListRaw()
        val target = list.firstOrNull { it.id == serverId } ?: return
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_URL] = target.url
            prefs[Keys.USERNAME] = target.username
            prefs[Keys.TOKEN] = target.token
            prefs[Keys.USER_ID] = target.userId
            prefs[Keys.SERVER_TYPE] = target.serverType.name
            prefs[Keys.SERVER_NAME] = target.serverName
            prefs[Keys.CURRENT_SERVER_ID] = target.id
        }
    }

    // ================ 服务器列表 ================

    private suspend fun serverListRaw(): List<ServerConfig> {
        val jsonStr = context.dataStore.data.firstOrNull()?.get(Keys.SERVER_LIST)
        return jsonStr?.let {
            try { json.decodeFromString<List<ServerConfig>>(it) } catch (_: Exception) { emptyList() }
        }.orEmpty()
    }

    /** 已保存的服务器列表 Flow */
    val serverList: Flow<List<ServerConfig>> = context.dataStore.data.map { prefs ->
        val jsonStr = prefs[Keys.SERVER_LIST]
        jsonStr?.let {
            try { json.decodeFromString<List<ServerConfig>>(it) } catch (_: Exception) { emptyList() }
        }.orEmpty()
    }

    private suspend fun addToServerList(config: ServerConfig) {
        val current = serverListRaw()
        val updated = (current.filterNot { it.id == config.id } + config)
            .sortedByDescending { it.createdAt }
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_LIST] = json.encodeToString(updated)
        }
    }

    /** 从列表中删除一个服务器；若它是当前活动服务器，则同时清除登录状态 */
    suspend fun removeServer(serverId: String) {
        val current = serverListRaw()
        val remain = current.filterNot { it.id == serverId }
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_LIST] = json.encodeToString(remain)
        }
        val activeId = context.dataStore.data.firstOrNull()?.get(Keys.CURRENT_SERVER_ID)
        if (activeId == serverId) clearServerConfig()
    }

    /** 更新服务器名称（用户自定义名称） */
    suspend fun updateServerName(serverId: String, newName: String) {
        val list = serverListRaw().map { if (it.id == serverId) it.copy(serverName = newName) else it }
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_LIST] = json.encodeToString(list)
        }
        // 如果是当前活动服务器也同步更新
        val activeId = context.dataStore.data.firstOrNull()?.get(Keys.CURRENT_SERVER_ID)
        if (activeId == serverId) {
            context.dataStore.edit { prefs ->
                prefs[Keys.SERVER_NAME] = newName
            }
        }
    }

    // ================ 播放偏好 ================

    val orientationMode: Flow<OrientationMode> = context.dataStore.data.map { prefs ->
        prefs[Keys.ORIENTATION_MODE]?.let {
            try { OrientationMode.valueOf(it) } catch (_: Exception) { null }
        } ?: OrientationMode.BOTH
    }

    suspend fun setOrientationMode(mode: OrientationMode) {
        context.dataStore.edit { it[Keys.ORIENTATION_MODE] = mode.name }
    }

    val isMuted: Flow<Boolean> = context.dataStore.data.map {
        it[Keys.IS_MUTED] ?: false
    }

    suspend fun setMuted(muted: Boolean) {
        context.dataStore.edit { it[Keys.IS_MUTED] = muted }
    }

    val isAutoPlay: Flow<Boolean> = context.dataStore.data.map {
        it[Keys.IS_AUTO_PLAY] ?: true
    }

    suspend fun setAutoPlay(auto: Boolean) {
        context.dataStore.edit { it[Keys.IS_AUTO_PLAY] = auto }
    }

    val playbackSpeed: Flow<Float> = context.dataStore.data.map {
        (it[Keys.PLAYBACK_SPEED] ?: "1.0").toFloatOrNull() ?: 1.0f
    }

    suspend fun setPlaybackSpeed(speed: Float) {
        context.dataStore.edit { it[Keys.PLAYBACK_SPEED] = speed.toString() }
    }

    // ================ 字幕设置 ================

    val subtitleSettings: Flow<SubtitleSettings> = context.dataStore.data.map { prefs ->
        val jsonStr = prefs[Keys.SUBTITLE_SETTINGS] ?: return@map SubtitleSettings()
        try {
            json.decodeFromString<SubtitleSettings>(jsonStr)
        } catch (_: Exception) {
            SubtitleSettings()
        }
    }

    suspend fun saveSubtitleSettings(settings: SubtitleSettings) {
        context.dataStore.edit {
            it[Keys.SUBTITLE_SETTINGS] = json.encodeToString(settings)
        }
    }

    // ================ 应用语言 ================

    val appLanguage: Flow<AppLanguage> = context.dataStore.data.map { prefs ->
        prefs[Keys.APP_LANGUAGE]?.let {
            try { AppLanguage.valueOf(it) } catch (_: Exception) { null }
        } ?: AppLanguage.SYSTEM
    }

    suspend fun setAppLanguage(lang: AppLanguage) {
        context.dataStore.edit { it[Keys.APP_LANGUAGE] = lang.name }
    }

    // ================ 辅助方法 ================

    suspend fun isLoggedIn(): Boolean {
        return serverConfig.firstOrNull() != null
    }

    // ================ 偏好 Key 常量 ================

    private object Keys {
        // 服务器
        val SERVER_URL = stringPreferencesKey("server_url")
        val USERNAME = stringPreferencesKey("username")
        val TOKEN = stringPreferencesKey("token")
        val USER_ID = stringPreferencesKey("user_id")
        val SERVER_TYPE = stringPreferencesKey("server_type")
        val SERVER_NAME = stringPreferencesKey("server_name")
        val CURRENT_SERVER_ID = stringPreferencesKey("current_server_id")
        val SERVER_LIST = stringPreferencesKey("server_list_json")
        // 播放
        val ORIENTATION_MODE = stringPreferencesKey("orientation_mode")
        val IS_MUTED = booleanPreferencesKey("is_muted")
        val IS_AUTO_PLAY = booleanPreferencesKey("is_auto_play")
        val PLAYBACK_SPEED = stringPreferencesKey("playback_speed")
        // 字幕
        val SUBTITLE_SETTINGS = stringPreferencesKey("subtitle_settings")
        // 语言
        val APP_LANGUAGE = stringPreferencesKey("app_language")
    }
}


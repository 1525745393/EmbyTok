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
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

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

    suspend fun saveServerConfig(config: ServerConfig) {
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVER_URL] = config.url
            prefs[Keys.USERNAME] = config.username
            prefs[Keys.TOKEN] = config.token
            prefs[Keys.USER_ID] = config.userId
            prefs[Keys.SERVER_TYPE] = config.serverType.name
            prefs[Keys.SERVER_NAME] = config.serverName
        }
    }

    val serverConfig: Flow<ServerConfig?> = context.dataStore.data.map { prefs ->
        val url = prefs[Keys.SERVER_URL] ?: return@map null
        val serverType = prefs[Keys.SERVER_TYPE]?.let {
            try { ServerType.valueOf(it) } catch (_: Exception) { ServerType.EMBY }
        } ?: ServerType.EMBY
        ServerConfig(
            url = url,
            username = prefs[Keys.USERNAME].orEmpty(),
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

    // ================ 多服务器列表 ================

    /**
     * 已保存的所有服务器列表
     * 通过 JSON 编码存储，支持多服务器管理
     */
    private val serversJsonFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[Keys.SERVERS_JSON]
    }

    val savedServers: Flow<List<ServerConfig>> = serversJsonFlow.map { json ->
        if (json.isNullOrBlank()) {
            // 兼容旧格式：只有一个 serverConfig 时转为列表
            val single = serverConfig.firstOrNull()
            if (single != null) listOf(single) else emptyList()
        } else {
            try {
                json.decodeFromString<List<SerializableServerConfig>>(json)
                    .map { it.toServerConfig() }
            } catch (_: Exception) {
                emptyList()
            }
        }
    }

    /**
     * 保存服务器列表
     */
    suspend fun saveServers(servers: List<ServerConfig>) {
        val jsonStr = json.encodeToString(
            servers.map { SerializableServerConfig.from(it) }
        )
        context.dataStore.edit { prefs ->
            prefs[Keys.SERVERS_JSON] = jsonStr
        }
    }

    /**
     * 添加一个服务器到列表
     */
    suspend fun addServer(server: ServerConfig) {
        val current = savedServers.firstOrNull() ?: emptyList()
        // 如果已存在相同 URL 的服务器则替换
        val filtered = current.filter { it.url != server.url }
        saveServers(filtered + server)
    }

    /**
     * 从列表中移除指定服务器
     */
    suspend fun removeServer(serverUrl: String) {
        val current = savedServers.firstOrNull() ?: emptyList()
        saveServers(current.filter { it.url != serverUrl })
    }

    /**
     * 设置当前活跃服务器（会同步更新 serverConfig）
     */
    suspend fun setActiveServer(server: ServerConfig) {
        saveServerConfig(server)
        addServer(server) // 确保在列表中
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
        // 多服务器列表（JSON 编码）
        val SERVERS_JSON = stringPreferencesKey("servers_json")
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

/**
 * 用于 JSON 序列化的服务器配置（因为 kotlinx.serialization 需要显式声明可序列化类）
 */
@Serializable
private data class SerializableServerConfig(
    val url: String,
    val username: String,
    val token: String,
    val userId: String,
    val serverType: String,
    val serverName: String
) {
    fun toServerConfig(): ServerConfig = ServerConfig(
        url = url,
        username = username,
        token = token,
        userId = userId,
        serverType = try { ServerType.valueOf(serverType) } catch (_: Exception) { ServerType.EMBY },
        serverName = serverName
    )

    companion object {
        fun from(config: ServerConfig): SerializableServerConfig = SerializableServerConfig(
            url = config.url,
            username = config.username,
            token = config.token,
            userId = config.userId,
            serverType = config.serverType.name,
            serverName = config.serverName
        )
    }
}

package com.embytok.app.usecase

import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.ClientFactory
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

/**
 * 登录 / 登出用例。
 *
 * 封装认证逻辑：
 *   - Emby：用户名+密码 或 API Key
 *   - Plex：Access Token
 *
 * 支持多服务器管理：保存多个配置，自由切换当前活动服务器。
 */
class AuthenticateUseCase(
    private val preferences: AppPreferences
) {

    /** 当前服务器配置 Flow（响应式） */
    val configFlow: Flow<ServerConfig?> = preferences.serverConfig

    /** 已保存的服务器列表 Flow（响应式） */
    val serverListFlow: Flow<List<ServerConfig>> = preferences.serverList

    /** 当前活动服务器 id Flow */
    val currentServerIdFlow: Flow<String?> = preferences.currentServerId

    /** 当前缓存的配置（用于 UI 显示，非挂起版本） */
    @Volatile
    private var cachedConfig: ServerConfig? = null

    /** 当前缓存的 MediaClient（根据配置动态创建） */
    @Volatile
    private var cachedClient: MediaClient? = null

    fun currentConfigCached(): ServerConfig? = cachedConfig

    /**
     * 执行登录
     */
    suspend fun execute(
        serverType: ServerType,
        serverUrl: String,
        username: String,
        password: String? = null,
        apiKey: String? = null,
        accessToken: String? = null
    ): Result<Unit> = runCatching {
        val trimmedUrl = serverUrl.trim().trimEnd('/')
        if (trimmedUrl.isEmpty()) {
            throw IllegalArgumentException("服务器地址不能为空")
        }

        val client = when (serverType) {
            ServerType.EMBY -> {
                val apiKeyVal = apiKey?.takeIf { it.isNotBlank() }
                val passwordVal = password?.takeIf { it.isNotBlank() }
                if (apiKeyVal == null && passwordVal == null) {
                    throw IllegalArgumentException("请输入 API Key 或 用户名+密码")
                }
                // 使用 ClientFactory 基于最小配置构造 EmbyClient
                ClientFactory.createEmby(
                    baseUrl = trimmedUrl,
                    apiKey = apiKeyVal,
                    userId = null
                )
            }
            ServerType.PLEX -> {
                val token = accessToken?.takeIf { it.isNotBlank() }
                    ?: throw IllegalArgumentException("Plex 必须提供 Access Token")
                ClientFactory.createPlex(
                    baseUrl = trimmedUrl,
                    token = token
                )
            }
        }

        // 验证服务器连通性
        val serverUserId = client.ping().getOrThrow()

        // 计算服务器唯一 id
        val svcId = computeServerId(trimmedUrl, username, serverType)

        val config = ServerConfig(
            id = svcId,
            url = trimmedUrl,
            username = username,
            token = apiKey ?: accessToken ?: "",
            userId = serverUserId,
            serverType = serverType,
            serverName = ""
        )

        preferences.saveServerConfig(config)
        cachedConfig = config
        cachedClient = client
    }

    /** 退出登录：清除服务器配置和缓存 */
    suspend fun logout() {
        preferences.clearServerConfig()
        cachedConfig = null
        cachedClient = null
    }

    /** 获取当前配置（挂起版） */
    suspend fun currentConfig(): ServerConfig? {
        val fromPrefs = preferences.serverConfig.firstOrNull()
        if (fromPrefs != null) cachedConfig = fromPrefs
        return fromPrefs
    }

    /** 获取当前 MediaClient（挂起版）。若未登录则返回 null。 */
    suspend fun currentClient(): MediaClient? {
        cachedClient?.let { return it }
        val config = currentConfig() ?: return null
        return ClientFactory.create(config).also { cachedClient = it }
    }

    /** UI 调用：若已有缓存则直接返回，否则从偏好中构造 */
    fun clientOrNull(): MediaClient? = cachedClient

    // ================ 多服务器管理 ================

    /** 切换到指定服务器（更新活动配置 + 重建 MediaClient） */
    suspend fun switchToServer(serverId: String): Result<Unit> = runCatching {
        preferences.switchToServer(serverId)
        // 重建缓存
        val newConfig = preferences.serverConfig.firstOrNull()
            ?: throw IllegalStateException("切换后读取配置失败")
        cachedConfig = newConfig
        cachedClient = ClientFactory.create(newConfig)
    }

    /** 删除一个已保存的服务器 */
    suspend fun removeServer(serverId: String): Result<Unit> = runCatching {
        preferences.removeServer(serverId)
        // 如果删除的是当前服务器，重置缓存
        if (cachedConfig?.id == serverId) {
            cachedConfig = null
            cachedClient = null
        }
    }

    /** 更新服务器自定义名称 */
    suspend fun renameServer(serverId: String, newName: String) {
        preferences.updateServerName(serverId, newName)
        cachedConfig?.let {
            if (it.id == serverId) cachedConfig = it.copy(serverName = newName)
        }
    }

    /** 获取服务器列表（一次性读取） */
    suspend fun serverList(): List<ServerConfig> = preferences.serverList.firstOrNull().orEmpty()
}

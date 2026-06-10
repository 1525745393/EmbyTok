package com.embytok.app.usecase

import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.ClientFactory
import kotlinx.coroutines.flow.firstOrNull

/**
 * 登录用例：验证服务器凭据 → 持久化 ServerConfig → 可用于构造 MediaClient。
 */
class AuthenticateUseCase(
    private val preferences: AppPreferences
) {

    /**
     * 执行登录：
     * - 对 Emby：若传入 apiKey 则直接 ping；否则用用户名/密码调用 authenticate。
     * - 对 Plex：仅 token ping。
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

        val (token, userId) = when (serverType) {
            ServerType.EMBY -> {
                if (!apiKey.isNullOrBlank()) {
                    val client = com.embytok.network.client.EmbyClient(
                        baseUrl = trimmedUrl,
                        apiKey = apiKey,
                        userId = ""
                    )
                    val uid = client.ping().getOrThrow()
                    apiKey to uid
                } else if (password != null) {
                    val client = com.embytok.network.client.EmbyClient(
                        baseUrl = trimmedUrl,
                        apiKey = "",
                        userId = ""
                    )
                    val uid = client.authenticate(username, password).getOrThrow()
                    "" to uid
                } else {
                    throw IllegalArgumentException("需要 API Key 或 用户名/密码")
                }
            }
            ServerType.PLEX -> {
                val tokenValue = accessToken ?: ""
                if (tokenValue.isBlank()) {
                    throw IllegalArgumentException("Plex 必须提供 Access Token")
                }
                val client = com.embytok.network.client.PlexClient(
                    baseUrl = trimmedUrl,
                    token = tokenValue
                )
                val uid = client.ping().getOrThrow()
                tokenValue to uid
            }
        }

        preferences.saveServerConfig(
            ServerConfig(
                url = trimmedUrl,
                username = username,
                token = token,
                userId = userId,
                serverType = serverType
            )
        )
    }

    suspend fun logout() = preferences.clearServerConfig()

    suspend fun currentConfig(): ServerConfig? = preferences.serverConfig.firstOrNull()

    fun clientOrNull(): MediaClient? {
        return null  // 非挂起版本，UI 层使用 currentClient()
    }

    /** 挂起版本：读取偏好并构造 MediaClient */
    suspend fun currentClient(): MediaClient? {
        val config = currentConfig() ?: return null
        return runCatching { ClientFactory.create(config) }.getOrNull()
    }
}

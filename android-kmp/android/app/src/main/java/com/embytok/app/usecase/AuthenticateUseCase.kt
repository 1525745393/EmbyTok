package com.embytok.app.usecase

import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType

/**
 * 认证用例（Android 层专属，因为依赖 DataStore）。
 */
class AuthenticateUseCase(
    private val preferences: AppPreferences,
    private val createEmbyClient: (ServerConfig) -> MediaClient,
    private val createPlexClient: (ServerConfig) -> MediaClient
) {

    suspend fun execute(
        serverType: ServerType,
        serverUrl: String,
        username: String,
        password: String? = null,
        apiKey: String? = null,
        accessToken: String? = null
    ): Result<Unit> {
        return runCatching {
            val trimmedUrl = serverUrl.trim().trimEnd('/')
            if (trimmedUrl.isEmpty()) {
                throw IllegalArgumentException("服务器地址不能为空")
            }

            val client = when (serverType) {
                ServerType.EMBY -> createEmbyClient(
                    ServerConfig(
                        url = trimmedUrl,
                        username = username,
                        token = apiKey.orEmpty(),
                        userId = "",
                        serverType = ServerType.EMBY
                    )
                )
                ServerType.PLEX -> createPlexClient(
                    ServerConfig(
                        url = trimmedUrl,
                        username = username,
                        token = accessToken.orEmpty(),
                        userId = "",
                        serverType = ServerType.PLEX
                    )
                )
            }

            val userId = when (serverType) {
                ServerType.EMBY -> {
                    if (!apiKey.isNullOrBlank()) client.ping().getOrThrow()
                    else client.authenticate(username, password.orEmpty()).getOrThrow()
                }
                ServerType.PLEX -> client.ping().getOrThrow()
            }

            preferences.saveServerConfig(
                ServerConfig(
                    url = trimmedUrl,
                    username = username,
                    token = when (serverType) {
                        ServerType.EMBY -> apiKey.orEmpty()
                        ServerType.PLEX -> accessToken.orEmpty()
                    },
                    userId = userId,
                    serverType = serverType
                )
            )
        }
    }

    suspend fun logout() = preferences.clearServerConfig()
    suspend fun hasSavedConfig(): Boolean = preferences.isLoggedIn()
}

package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 服务器配置（持久化到 DataStore）。
 */
@Serializable
data class ServerConfig(
    val url: String,
    val username: String,
    val token: String,
    val userId: String,
    val serverType: ServerType,
    val serverName: String = ""
) {
    fun getApiBaseUrl(): String = url.trimEnd('/')
    fun getFullUrl(): String = url.trimEnd('/')
    fun isValid(): Boolean = url.isNotBlank() && token.isNotBlank() && userId.isNotBlank()
}

/**
 * Emby 认证响应
 */
@Serializable
data class EmbyAuthResponse(
    val User: EmbyUser,
    val AccessToken: String,
    val ServerId: String
)

@Serializable
data class EmbyUser(
    val Id: String,
    val Name: String,
    val Policy: EmbyPolicy? = null
)

@Serializable
data class EmbyPolicy(
    val IsAdministrator: Boolean = false
)

/**
 * Plex 认证响应（简化版）
 */
@Serializable
data class PlexAuthResponse(
    val username: String,
    val token: String
)

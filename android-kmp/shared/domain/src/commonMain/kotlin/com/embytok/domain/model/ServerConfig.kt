package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 服务器类型
 */
@Serializable
enum class ServerType {
    EMBY,
    PLEX
}

/**
 * 服务器配置（登录后保存）
 */
@Serializable
data class ServerConfig(
    val url: String,
    val username: String,
    val token: String,
    val userId: String,
    val serverType: ServerType,
    val serverName: String? = null
) {
    /**
     * 获取带协议前缀的完整 URL
     */
    fun getFullUrl(): String {
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            url.trimEnd('/')
        } else {
            "http://${url.trimEnd('/')}"
        }
    }

    /**
     * 获取 API 基础路径
     */
    fun getApiBaseUrl(): String = "${getFullUrl()}/embyserver" // Emby 特有路径

    /**
     * 验证配置是否有效
     */
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
 * Plex 认证响应（简化版，直接使用 token）
 */
@Serializable
data class PlexAuthResponse(
    val username: String,
    val token: String
)

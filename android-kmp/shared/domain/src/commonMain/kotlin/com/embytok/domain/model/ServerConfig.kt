package com.embytok.domain.model

import kotlinx.serialization.Serializable

/**
 * 媒体服务器类型。
 */
@Serializable
enum class ServerType {
    EMBY,
    PLEX
}

/**
 * 服务器配置（持久化到 DataStore）。
 *
 * 保存登录验证后所需的全部信息，用于后续构建 [MediaClient]。
 *
 * @param id 唯一标识（基于 URL + username 生成的 hash）
 * @param url 服务器根地址
 * @param username 登录用户名
 * @param token Emby 的 AccessToken 或 Plex 的 X-Plex-Token
 * @param userId Emby 中的用户 Id（Plex 下可为空字符串）
 * @param serverType 服务器类型：EMBY / PLEX
 * @param serverName 用户可读的服务器名称，用于 UI 展示
 * @param createdAt 创建/保存时间（毫秒时间戳）
 */
@Serializable
data class ServerConfig(
    val id: String,
    val url: String,
    val username: String,
    val token: String,
    val userId: String,
    val serverType: ServerType,
    val serverName: String = "",
    val createdAt: Long = System.currentTimeMillis()
) {
    fun getApiBaseUrl(): String = url.trimEnd('/')
    fun getFullUrl(): String = url.trimEnd('/')
    fun isValid(): Boolean = url.isNotBlank() && token.isNotBlank() && userId.isNotBlank()

    /** 简洁描述："类型 | 名称@地址" */
    fun displayName(): String {
        val type = if (serverType == ServerType.EMBY) "Emby" else "Plex"
        val name = serverName.ifBlank { username }
        return "$name · $type"
    }
}

/**
 * 基于 URL + 用户名 + 类型计算稳定的唯一 id
 */
fun computeServerId(url: String, username: String, serverType: ServerType): String {
    val raw = "${serverType.name}|${url.trimEnd('/')}|$username"
    // 简单 hash（JVM 下可用 hashCode；跨平台则直接用字符串去关键字符）
    val hc = raw.hashCode().toLong() and 0xFFFFFFFFL
    return "svc_$hc"
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

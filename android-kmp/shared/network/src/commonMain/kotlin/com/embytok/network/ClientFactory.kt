package com.embytok.network

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.client.EmbyClient
import com.embytok.network.client.PlexClient

/**
 * 媒体客户端工厂。
 *
 * 根据 [ServerConfig] 类型构造对应的 Emby / Plex 客户端。
 */
object ClientFactory {

    /**
     * 基于 ServerConfig 构造 MediaClient。
     */
    fun create(config: ServerConfig): MediaClient {
        val http = defaultHttpClient()
        return when (config.serverType) {
            ServerType.EMBY -> EmbyClient(
                baseUrl = config.getFullUrl(),
                apiKey = config.token.ifBlank { null },
                userId = config.userId.ifBlank { null },
                httpClient = http
            )
            ServerType.PLEX -> PlexClient(
                baseUrl = config.getFullUrl(),
                token = config.token,
                httpClient = http
            )
        }
    }

    /** Alias for [create] */
    fun fromConfig(config: ServerConfig): MediaClient = create(config)

    /**
     * 直接构造 EmbyClient（登录阶段使用，此时 userId 可能为 null）。
     */
    fun createEmby(baseUrl: String, apiKey: String?, userId: String?): MediaClient {
        return EmbyClient(
            baseUrl = baseUrl,
            apiKey = apiKey,
            userId = userId,
            httpClient = defaultHttpClient()
        )
    }

    /**
     * 直接构造 PlexClient（登录阶段使用）。
     */
    fun createPlex(baseUrl: String, token: String): MediaClient {
        return PlexClient(
            baseUrl = baseUrl,
            token = token,
            httpClient = defaultHttpClient()
        )
    }
}

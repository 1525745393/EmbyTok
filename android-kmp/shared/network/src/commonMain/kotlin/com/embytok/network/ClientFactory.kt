package com.embytok.network

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.network.client.EmbyClient
import com.embytok.network.client.PlexClient

/**
 * 媒体客户端工厂。
 *
 * 基于持久化的 [ServerConfig] 构造对应的 [EmbyClient] 或 [PlexClient] 实例。
 */
object ClientFactory {

    /**
     * 根据 [ServerConfig.serverType] 构建相应的 [MediaClient]。
     *
     * @throws IllegalArgumentException 如果服务器类型未知。
     */
    fun create(config: ServerConfig): MediaClient {
        val http = defaultHttpClient()
        return when (config.serverType) {
            com.embytok.domain.model.ServerType.EMBY -> EmbyClient(
                baseUrl = config.getFullUrl(),
                apiKey = config.token,
                userId = config.userId,
                httpClient = http
            )
            com.embytok.domain.model.ServerType.PLEX -> PlexClient(
                baseUrl = config.getFullUrl(),
                token = config.token,
                httpClient = http
            )
        }
    }

    /** Alias for [create]. */
    fun fromConfig(config: ServerConfig): MediaClient = create(config)
}

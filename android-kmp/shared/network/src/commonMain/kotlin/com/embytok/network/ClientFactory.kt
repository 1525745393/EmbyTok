package com.embytok.network

import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.network.client.EmbyClient
import com.embytok.network.client.PlexClient
import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * 媒体客户端工厂。基于 [ServerConfig] 构造 EmbyClient / PlexClient 实例。
 */
object ClientFactory {

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

    fun fromConfig(config: ServerConfig): MediaClient = create(config)
}

private fun defaultHttpClient(): HttpClient = HttpClient {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
        })
    }
    install(HttpTimeout) {
        requestTimeoutMillis = 15_000
        connectTimeoutMillis = 10_000
        socketTimeoutMillis = 60_000
    }
}

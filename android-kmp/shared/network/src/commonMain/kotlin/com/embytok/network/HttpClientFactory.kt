package com.embytok.network

import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * 全局共享的 Ktor HttpClient 工厂。
 *
 * 为 EmbyClient / PlexClient 提供一致的配置：
 *   - ContentNegotiation (kotlinx.serialization.json)
 *   - HttpTimeout (连接/请求/套接字超时)
 */
fun defaultHttpClient(): HttpClient = HttpClient {
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

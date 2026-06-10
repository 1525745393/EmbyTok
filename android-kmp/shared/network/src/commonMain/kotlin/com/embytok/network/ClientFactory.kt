package com.embytok.network

import com.embytok.common.EmbyTokLogger
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.emby.EmbyClient
import com.embytok.network.plex.PlexClient
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * 客户端工厂
 * 根据配置创建对应的媒体服务器客户端
 */
object ClientFactory {

    private val logger = EmbyTokLogger

    /**
     * HTTP 客户端实例缓存
     */
    private var httpClient: HttpClient? = null

    /**
     * 获取或创建 HTTP 客户端
     */
    fun getHttpClient(): HttpClient {
        return httpClient ?: createHttpClient().also { httpClient = it }
    }

    /**
     * 创建 HTTP 客户端
     */
    private fun createHttpClient(): HttpClient {
        return HttpClient(OkHttp) {
            // JSON 序列化配置
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                    encodeDefaults = true
                    prettyPrint = false
                })
            }

            // HTTP 超时配置
            install(HttpTimeout) {
                requestTimeoutMillis = 30_000
                connectTimeoutMillis = 15_000
                socketTimeoutMillis = 30_000
            }

            // 指数退避重试
            install(HttpRequestRetry) {
                retryOnServerErrors(maxRetries = 3)
                retryOnException(maxRetries = 3, retryOnTimeout = true)
                exponentialDelay()
            }

            // 日志（仅在调试模式）
            install(Logging) {
                logger = object : Logger {
                    override fun log(message: String) {
                        EmbyTokLogger.d("HTTP: $message", "KtorClient")
                    }
                }
                level = LogLevel.BODY
            }

            // 引擎特定配置
            engine {
                config {
                    retryOnConnectionFailure(true)
                    connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                }
            }
        }
    }

    /**
     * 根据配置创建媒体客户端
     * @param config 服务器配置
     * @return 对应类型的 MediaClient 实例
     */
    fun create(config: ServerConfig): MediaClient {
        logger.d("创建媒体客户端: type=${config.serverType}", "ClientFactory")

        val client = when (config.serverType) {
            ServerType.EMBY -> EmbyClient(config, getHttpClient())
            ServerType.PLEX -> PlexClient(config, getHttpClient())
        }

        return client
    }

    /**
     * 认证并创建客户端
     * @param type 服务器类型
     * @param url 服务器地址
     * @param username 用户名（Emby 使用）
     * @param password 密码（Emby 使用）
     * @param token Plex Token（Plex 使用）
     */
    suspend fun authenticate(
        type: ServerType,
        url: String,
        username: String = "",
        password: String = "",
        token: String = ""
    ): ServerConfig {
        logger.d("开始认证: type=$type, url=$url", "ClientFactory")

        // 构建初始配置
        val initialConfig = ServerConfig(
            url = url,
            username = username,
            token = if (type == ServerType.PLEX) token else "",
            userId = if (type == ServerType.PLEX) "plex-user" else "",
            serverType = type
        )

        // 创建临时客户端进行认证
        val tempConfig = initialConfig.copy(
            token = if (type == ServerType.PLEX) token else ""
        )

        val client = create(tempConfig)

        return if (type == ServerType.EMBY) {
            client.authenticate(username, password)
        } else {
            client.authenticate(username, password)
        }
    }

    /**
     * 释放资源
     */
    fun release() {
        httpClient?.close()
        httpClient = null
    }
}

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
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import java.util.concurrent.TimeUnit

/**
 * HTTP 客户端工厂
 *
 * 配置统一的 Ktor HttpClient（OkHttp 引擎）：
 * - JSON 自动序列化/反序列化
 * - 合理的超时配置
 * - 日志打印（仅 debug）
 */
object HttpClientFactory {

    private val json by lazy {
        Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
            explicitNulls = false
        }
    }

    /**
     * 创建通用 HTTP 客户端
     */
    fun create(): HttpClient {
        return HttpClient(OkHttp) {
            // 引擎级配置（OkHttp）
            engine {
                config {
                    connectTimeout(30, TimeUnit.SECONDS)
                    readTimeout(60, TimeUnit.SECONDS)
                    writeTimeout(60, TimeUnit.SECONDS)
                    followRedirects(true)
                    followSslRedirects(true)
                    retryOnConnectionFailure(true)
                }
            }

            // 默认请求头
            defaultRequest {
                header("Accept", "application/json")
            }

            // JSON 内容协商
            install(ContentNegotiation) {
                json(json)
            }

            // 日志（仅调试级）
            install(Logging) {
                logger = object : Logger {
                    override fun log(message: String) {
                        EmbyTokLogger.d(message, "KtorHttpClient")
                    }
                }
                level = LogLevel.INFO
            }

            // HTTP 状态码处理
            HttpResponseValidator {
                validateResponse { response ->
                    when (response.status) {
                        HttpStatusCode.Unauthorized -> {
                            throw IllegalStateException("未授权：请检查登录凭证")
                        }
                        HttpStatusCode.NotFound -> {
                            throw IllegalStateException("资源未找到：${response.request.url}")
                        }
                        else -> {
                            // 其他错误：5xx 等
                            if (response.status.value >= 500) {
                                throw IllegalStateException("服务器错误 (${response.status.value})")
                            }
                        }
                    }
                }
            }

            // 响应缓存（避免重复请求相同数据）
            expectSuccess = true
        }
    }
}

/**
 * 媒体客户端工厂
 *
 * 负责根据 [ServerType] 创建对应的 [MediaClient] 实现
 * 并完成首次认证（Emby 用户名密码 / Plex Token 验证）
 */
object ClientFactory {

    private var cachedClient: MediaClient? = null
    private var cachedConfig: ServerConfig? = null

    /**
     * 创建并认证客户端
     *
     * @param type 服务器类型
     * @param url 服务器地址（含 http/https）
     * @param username 用户名（Emby 必填，Plex 可选）
     * @param password 密码（Emby 必填，Plex 可选）
     * @param token Token（Plex 必填，Emby 可选）
     * @return 已认证的 ServerConfig
     */
    suspend fun create(
        type: ServerType,
        url: String,
        username: String,
        password: String,
        token: String
    ): ServerConfig {
        val httpClient = HttpClientFactory.create()

        val initialConfig = ServerConfig(
            url = url,
            username = username,
            token = token,
            userId = "",
            serverType = type,
            serverName = ""
        )

        val client: MediaClient = when (type) {
            ServerType.EMBY -> EmbyClient(initialConfig, httpClient)
            ServerType.PLEX -> PlexClient(initialConfig, httpClient)
        }

        // 执行认证
        val authenticatedConfig = client.authenticate(username, password)

        EmbyTokLogger.i("认证成功: server=$type, url=$url", "ClientFactory")

        // 缓存带完整认证信息的客户端
        val authenticatedClient: MediaClient = when (type) {
            ServerType.EMBY -> EmbyClient(authenticatedConfig, httpClient)
            ServerType.PLEX -> PlexClient(authenticatedConfig, httpClient)
        }

        cachedClient = authenticatedClient
        cachedConfig = authenticatedConfig

        return authenticatedConfig
    }

    /**
     * 从已保存的 ServerConfig 创建客户端（无需重新认证）
     */
    fun fromConfig(config: ServerConfig): MediaClient {
        if (cachedConfig == config && cachedClient != null) {
            return cachedClient!!
        }
        val httpClient = HttpClientFactory.create()
        val client: MediaClient = when (config.serverType) {
            ServerType.EMBY -> EmbyClient(config, httpClient)
            ServerType.PLEX -> PlexClient(config, httpClient)
        }
        cachedClient = client
        cachedConfig = config
        return client
    }

    /**
     * 获取当前已缓存的客户端（供 ViewModel 使用）
     */
    fun getCurrent(): MediaClient? = cachedClient

    /**
     * 清除缓存（登出时调用）
     */
    fun clearCache() {
        cachedClient = null
        cachedConfig = null
    }
}

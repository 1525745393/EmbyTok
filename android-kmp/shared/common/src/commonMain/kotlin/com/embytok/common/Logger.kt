package com.embytok.common

import co.touchlab.kermit.Logger
import co.touchlab.kermit.Severity

/**
 * EmbyTok 日志工具
 * 跨平台日志接口，使用 Kermit 实现
 */
object EmbyTokLogger {
    private var isInitialized = false

    fun initialize(minSeverity: Severity = Severity.Info) {
        if (isInitialized) return

        Logger.init(minSeverity = minSeverity)
        isInitialized = true
    }

    fun d(message: String, tag: String = "EmbyTok") = Logger.d(tag) { message }
    fun i(message: String, tag: String = "EmbyTok") = Logger.i(tag) { message }
    fun w(message: String, tag: String = "EmbyTok") = Logger.w(tag) { message }
    fun e(message: String, throwable: Throwable? = null, tag: String = "EmbyTok") {
        if (throwable != null) {
            Logger.e(tag, throwable) { message }
        } else {
            Logger.e(tag) { message }
        }
    }

    /**
     * 脱敏日志 - 用于打印包含敏感信息的请求/响应
     * 只打印前50个字符，避免暴露完整 token
     */
    fun dMasked(message: String, sensitiveValue: String?, tag: String = "EmbyTok") {
        if (sensitiveValue == null) {
            d(message, tag)
        } else {
            val masked = if (sensitiveValue.length > 10) {
                sensitiveValue.take(5) + "***" + sensitiveValue.takeLast(5)
            } else {
                "***"
            }
            d("$message [masked: $masked]", tag)
        }
    }
}

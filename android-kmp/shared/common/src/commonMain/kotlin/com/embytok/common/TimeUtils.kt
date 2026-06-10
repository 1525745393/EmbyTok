package com.embytok.common

import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * EmbyTok 时间工具函数
 * 处理时间戳转换、相对时间格式化等功能
 */

// Emby/Plex 使用 100 纳秒作为 tick 单位
// 转换为秒 = ticks / 10_000_000
private const val TICKS_PER_SECOND = 10_000_000L

/**
 * 将 Emby tick 转换为秒数
 */
fun ticksToSeconds(ticks: Long): Long = ticks / TICKS_PER_SECOND

/**
 * 将秒数转换为 Emby tick
 */
fun secondsToTicks(seconds: Long): Long = seconds * TICKS_PER_SECOND

/**
 * 格式化时间为友好文本（中文）
 * 例如: "120 分钟"
 */
fun formatTimeText(ticks: Long?): String {
    if (ticks == null || ticks <= 0) return ""
    val seconds = ticksToSeconds(ticks)
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60

    return when {
        hours > 0 -> "$hours 小时 $minutes 分钟"
        minutes > 0 -> "$minutes 分钟"
        else -> "$seconds 秒"
    }
}

/**
 * 格式化时间为紧凑文本
 * 例如: "2h" / "45m" / "30s"
 */
fun formatTimeCompact(ticks: Long?): String {
    if (ticks == null || ticks <= 0) return ""
    val seconds = ticksToSeconds(ticks)
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60

    return when {
        hours > 0 -> "${hours}h ${minutes}m"
        minutes > 0 -> "${minutes}m"
        else -> "${secs}s"
    }
}

/**
 * 格式化视频时长（用于显示在海报上）
 * 例如: "1:30:45" 或 "45:30"
 */
fun formatVideoDuration(ticks: Long?): String {
    if (ticks == null || ticks <= 0) return ""
    val seconds = ticksToSeconds(ticks)
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60

    return if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, secs)
    } else {
        String.format("%d:%02d", minutes, secs)
    }
}

/**
 * 计算播放进度百分比
 * @param positionTicks 当前播放位置（tick）
 * @param totalTicks 总时长（tick）
 * @return 0.0 到 1.0 的进度值
 */
fun calculatePlaybackProgress(positionTicks: Long, totalTicks: Long): Float {
    if (totalTicks <= 0) return 0f
    return (positionTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f)
}

/**
 * 格式化相对时间（中文）
 * 例如: "刚刚" / "5分钟前" / "2小时前" / "昨天" / "3天前"
 */
fun formatRelativeTime(millis: Long): String {
    val now = Clock.System.now().toEpochMilliseconds()
    val diff = now - millis
    val seconds = diff / 1000
    val minutes = seconds / 60
    val hours = minutes / 60
    val days = hours / 24

    return when {
        seconds < 60 -> "刚刚"
        minutes < 60 -> "${minutes}分钟前"
        hours < 24 -> "${hours}小时前"
        days == 1L -> "昨天"
        days < 7 -> "${days}天前"
        days < 30 -> "${days / 7}周前"
        else -> "${days / 30}个月前"
    }
}

/**
 * 获取当前时间戳（毫秒）
 */
fun currentTimeMillis(): Long = Clock.System.now().toEpochMilliseconds()

/**
 * 获取当前时区
 */
fun currentTimeZone(): TimeZone = TimeZone.currentSystemDefault()

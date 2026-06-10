package com.embytok.common

/**
 * 设备检测工具
 * 用于检测设备类型（手机/平板/TV）
 */

expect object DeviceDetector {
    /**
     * 是否为移动设备（手机或平板）
     */
    val isMobile: Boolean

    /**
     * 是否为平板
     */
    val isTablet: Boolean

    /**
     * 是否为 TV 设备
     */
    val isTv: Boolean

    /**
     * 是否为 iOS 设备
     */
    val isIos: Boolean

    /**
     * 是否为 Android 设备
     */
    val isAndroid: Boolean

    /**
     * 是否为横屏模式
     */
    val isLandscape: Boolean

    /**
     * 获取设备 ID（用于 Emby/Plex API）
     */
    fun getDeviceId(): String

    /**
     * 获取设备名称
     */
    fun getDeviceName(): String

    /**
     * 获取操作系统名称
     */
    fun getOsName(): String
}

/**
 * 设备类型的枚举
 */
enum class DeviceType {
    MOBILE,
    TABLET,
    TV,
    WEB,
    UNKNOWN
}

/**
 * 获取当前设备类型
 */
fun getCurrentDeviceType(): DeviceType = when {
    DeviceDetector.isTv -> DeviceType.TV
    DeviceDetector.isTablet -> DeviceType.TABLET
    DeviceDetector.isMobile -> DeviceType.MOBILE
    else -> DeviceType.UNKNOWN
}

/**
 * 是否应该使用 TV 布局模式
 */
fun shouldUseTvLayout(): Boolean = DeviceDetector.isTv

/**
 * 是否支持竖屏模式
 */
fun supportsPortraitMode(): Boolean = !DeviceDetector.isTv

/**
 * 获取推荐的网格列数
 */
fun getRecommendedGridColumns(): Int = when {
    DeviceDetector.isTv -> 6
    DeviceDetector.isTablet -> 4
    DeviceDetector.isLandscape -> 4
    else -> 3
}

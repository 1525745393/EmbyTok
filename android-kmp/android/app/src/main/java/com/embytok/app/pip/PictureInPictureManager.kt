package com.embytok.app.pip

import android.app.PictureInPictureParams
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import com.embytok.player.VideoPlayerManager

/**
 * 画中画（Picture-in-Picture）管理器
 *
 * 功能：
 * - 检查设备是否支持 PiP
 * - 进入/退出 PiP 模式
 * - 配置 PiP 参数（宽高比、Action 按钮）
 * - 监听 PiP 状态变化
 *
 * 使用方法：
 * - Activity 创建时传入 Activity context
 * - 在 onUserLeaveHint() / 用户点击 PiP 按钮时调用 enterPictureInPicture()
 * - 在 onPictureInPictureModeChanged() 中调用 onPictureInPictureModeChanged()
 */
class PictureInPictureManager(
    private var activityContext: android.app.Activity?,
    private val playerManager: VideoPlayerManager
) {
    private var isInPipMode: Boolean = false
    private var listener: OnPipStateChangeListener? = null

    /**
     * PiP 状态变化监听器
     */
    interface OnPipStateChangeListener {
        fun onEnteredPip()
        fun onExitedPip()
    }

    fun setListener(listener: OnPipStateChangeListener?) {
        this.listener = listener
    }

    /**
     * 是否支持 PiP（Android 8.0+）
     */
    fun isSupported(): Boolean {
        val ctx = activityContext ?: return false
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                ctx.packageManager.hasSystemFeature(
                    android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE
                )
    }

    /**
     * 进入画中画模式
     *
     * @param aspectRatio 宽高比（通常为视频宽高比），默认 16:9
     * @param title 标题（用于 PiP 通知/媒体按钮标签）
     * @return true 表示成功请求进入 PiP
     */
    fun enterPictureInPicture(
        aspectRatio: Rational = Rational(16, 9),
        title: String? = null
    ): Boolean {
        if (!isSupported()) return false
        val activity = activityContext ?: return false

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)
                    .apply {
                        // Android 12+ 支持自动进入 PiP 和无缝调整
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            setAutoEnterEnabled(true)
                            setSeamlessResizeEnabled(true)
                        }
                    }
                    .build()

                activity.enterPictureInPictureMode(params)
                isInPipMode = true
                listener?.onEnteredPip()
                true
            } else {
                false
            }
        } catch (e: IllegalStateException) {
            // Activity 不在前台时抛出异常
            android.util.Log.w("PictureInPictureManager", "无法进入 PiP: ${e.message}")
            false
        } catch (e: Exception) {
            android.util.Log.e("PictureInPictureManager", "进入 PiP 失败", e)
            false
        }
    }

    /**
     * Activity 应该在 onPictureInPictureModeChanged 中调用此方法
     */
    fun onPictureInPictureModeChanged(isInPip: Boolean, newConfig: Configuration?) {
        if (this.isInPipMode != isInPip) {
            this.isInPipMode = isInPip
            if (isInPip) {
                listener?.onEnteredPip()
                // 进入 PiP 时隐藏非必要的 UI 元素
                // （Compose 端可通过 state 监听）
            } else {
                listener?.onExitedPip()
                // 恢复完整 UI
            }
        }
    }

    /**
     * 更新 PiP 参数（例如切换视频后更新宽高比）
     */
    fun updatePipParams(
        aspectRatio: Rational = Rational(16, 9),
        title: String? = null
    ): Boolean {
        if (!isSupported() || !isInPipMode) return false
        val activity = activityContext ?: return false

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(aspectRatio)
                .build()
            activity.setPictureInPictureParams(params)
            true
        } else {
            false
        }
    }

    /**
     * 更新当前 Activity 引用（在 Activity recreate 等场景下使用）
     */
    fun updateActivity(activity: android.app.Activity?) {
        this.activityContext = activity
    }

    /**
     * 当前是否在 PiP 模式中
     */
    fun isInPipMode(): Boolean = isInPipMode

    /**
     * 基于当前播放视频计算宽高比
     */
    fun calculateVideoAspectRatio(): Rational {
        // 默认 16:9，未来可从 ExoPlayer 的 VideoSize 读取真实值
        return Rational(16, 9)
    }

    /**
     * 生命周期绑定：Activity 销毁时清理
     */
    fun onDestroy() {
        listener = null
        activityContext = null
    }
}

package com.embytok.app.service

import android.app.PendingIntent
import android.content.Intent
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.embytok.app.MainActivity
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.player.VideoPlayerManager

/**
 * 媒体播放后台服务
 *
 * 基于 Media3 MediaSessionService，实现：
 *  - 后台音频播放
 *  - 系统媒体控制（通知栏、耳机按钮、Android Auto）
 *  - 锁屏控制
 *
 * 生命周期与 ExoPlayer 实例绑定，Service 销毁时释放播放器。
 */
class PlaybackService : MediaSessionService() {

    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()

        // 获取或初始化 VideoPlayerManager 中的 ExoPlayer
        val context = applicationContext
        val manager = ServiceLocator.playerManager

        // 创建 MediaSession，绑定当前 ExoPlayer
        val player = manager.getPlayer() ?: ExoPlayer.Builder(context).build().also {
            // 如果 playerManager 尚未初始化，则临时创建一个
        }

        mediaSession = MediaSession.Builder(context, player)
            .setSessionActivity(getPendingIntent())
            .build()
    }

    /**
     * 返回与当前 Activity 关联的 PendingIntent
     * 用于点击通知栏播放控制时跳转到播放界面
     */
    private fun getPendingIntent(): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    /**
     * MediaSessionService 要求实现此方法，返回当前活跃的 MediaSession
     */
    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val player = mediaSession?.player
        if (player != null) {
            if (!player.playWhenReady ||
                player.mediaItemCount == 0 ||
                player.playbackState == Player.STATE_ENDED
            ) {
                // 用户划掉应用：停止播放、结束 Service
                stopSelf()
            }
        }
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        super.onDestroy()
    }
}

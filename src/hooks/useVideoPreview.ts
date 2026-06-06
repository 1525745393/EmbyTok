import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVideoPreviewOptions {
  /** 预览触发阈值（毫秒） */
  hoverThreshold?: number;
  /** 预览时长（毫秒） */
  previewDuration?: number;
  /** 预览时是否静音 */
  muted?: boolean;
  /** 当前激活的视频ID */
  activeVideoId?: string | null;
}

interface UseVideoPreviewReturn {
  /** 当前正在预览的视频ID */
  previewingId: string | null;
  /** 开始预览 */
  startPreview: (videoId: string) => void;
  /** 停止预览 */
  stopPreview: () => void;
  /** 暂停预览 */
  pausePreview: () => void;
  /** 恢复预览 */
  resumePreview: () => void;
  /** 是否有预览正在播放 */
  isPreviewing: boolean;
}

/**
 * 短视频预览Hook
 * 检测用户滚动停留，自动播放预览视频
 */
export function useVideoPreview({
  hoverThreshold = 500,
  previewDuration = 3000,
  muted = true,
  activeVideoId = null,
}: UseVideoPreviewOptions = {}): UseVideoPreviewReturn {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);

  // 清除所有定时器
  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  // 停止预览
  const stopPreview = useCallback(() => {
    clearTimers();
    setPreviewingId(null);
    isPausedRef.current = false;
  }, [clearTimers]);

  // 暂停预览（不清除状态）
  const pausePreview = useCallback(() => {
    if (previewingId) {
      isPausedRef.current = true;
      clearTimers();
    }
  }, [previewingId, clearTimers]);

  // 恢复预览
  const resumePreview = useCallback(() => {
    if (previewingId && isPausedRef.current) {
      isPausedRef.current = false;
      // 重新开始预览计时
      previewTimerRef.current = setTimeout(() => {
        stopPreview();
      }, previewDuration);
    }
  }, [previewingId, previewDuration, stopPreview]);

  // 开始预览
  const startPreview = useCallback((videoId: string) => {
    // 如果是同一视频且正在预览，不重复启动
    if (previewingId === videoId && !isPausedRef.current) {
      return;
    }

    // 停止当前预览
    clearTimers();
    isPausedRef.current = false;

    // 开始新的预览
    setPreviewingId(videoId);

    // 设置预览时长
    previewTimerRef.current = setTimeout(() => {
      stopPreview();
    }, previewDuration);
  }, [previewingId, previewDuration, clearTimers, stopPreview]);

  // 延迟触发预览（用于hover检测）
  const startPreviewWithDelay = useCallback((videoId: string) => {
    clearTimers();

    hoverTimerRef.current = setTimeout(() => {
      startPreview(videoId);
    }, hoverThreshold);
  }, [hoverThreshold, clearTimers, startPreview]);

  // 组件卸载或activeVideoId变化时停止预览
  useEffect(() => {
    if (activeVideoId && previewingId && activeVideoId !== previewingId) {
      stopPreview();
    }
  }, [activeVideoId, previewingId, stopPreview]);

  // 清理函数
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    previewingId,
    startPreview: startPreviewWithDelay,
    stopPreview,
    pausePreview,
    resumePreview,
    isPreviewing: previewingId !== null && !isPausedRef.current,
  };
}

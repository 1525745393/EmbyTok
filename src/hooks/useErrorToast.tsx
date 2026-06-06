import { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

/**
 * Toast 类型
 */
type ToastType = 'error' | 'success' | 'info';

/**
 * Toast 选项接口
 */
export interface ErrorToastOptions {
  /** 自定义描述文字 */
  description?: string;
  /** 显示时长（毫秒），0 表示不自动消失 */
  duration?: number;
  /** 显示重试按钮 */
  showRetry?: boolean;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * Toast 数据结构
 */
interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * 错误提示 Hook 返回值接口
 */
export interface UseErrorToastReturn {
  /** 显示错误提示 */
  showError: (message: string, options?: ErrorToastOptions) => void;
  /** 显示成功提示 */
  showSuccess: (message: string) => void;
  /** 显示信息提示 */
  showInfo: (message: string) => void;
  /** 隐藏指定 Toast */
  hideToast: (id: string) => void;
  /** 隐藏所有 Toast */
  hideAll: () => void;
  /** 当前 Toast 列表 */
  toasts: ToastData[];
}

/**
 * Toast 配置默认值
 */
const DEFAULT_TOAST_CONFIG = {
  error: {
    duration: 5000,
    icon: AlertCircle,
  },
  success: {
    duration: 3000,
    icon: CheckCircle,
  },
  info: {
    duration: 4000,
    icon: Info,
  },
};

/**
 * 错误提示 Hook
 * 提供友好的错误提示UI，支持自动消失和重试按钮
 */
export function useErrorToast(): UseErrorToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // 定时器引用
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // 生成唯一 ID
  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * 显示 Toast
   */
  const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: ErrorToastOptions
  ) => {
    const id = generateId();
    const config = DEFAULT_TOAST_CONFIG[type];
    const duration = options?.duration ?? config.duration;
    
    const newToast: ToastData = {
      id,
      type,
      message,
      description: options?.description,
      duration,
      showRetry: options?.showRetry,
      onRetry: options?.onRetry,
      className: options?.className,
    };

    setToasts(prev => [...prev, newToast]);

    // 如果设置了自动消失
    if (duration > 0) {
      const timer = setTimeout(() => {
        hideToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [generateId]);

  /**
   * 隐藏指定 Toast
   */
  const hideToast = useCallback((id: string) => {
    // 清除定时器
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 隐藏所有 Toast
   */
  const hideAll = useCallback(() => {
    // 清除所有定时器
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    
    setToasts([]);
  }, []);

  /**
   * 显示错误提示
   */
  const showError = useCallback((
    message: string,
    options?: ErrorToastOptions
  ) => {
    return showToast('error', message, options);
  }, [showToast]);

  /**
   * 显示成功提示
   */
  const showSuccess = useCallback((message: string) => {
    return showToast('success', message);
  }, [showToast]);

  /**
   * 显示信息提示
   */
  const showInfo = useCallback((message: string) => {
    return showToast('info', message);
  }, [showToast]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return {
    showError,
    showSuccess,
    showInfo,
    hideToast,
    hideAll,
    toasts,
  };
}

/**
 * Toast 容器组件
 * 用于在应用顶层渲染 Toast
 */
export interface ToastContainerProps {
  toasts: ToastData[];
  onHide: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const config = DEFAULT_TOAST_CONFIG[toast.type];
        const Icon = config.icon;
        
        const bgColorClass = {
          error: 'bg-red-900/90 border-red-700',
          success: 'bg-green-900/90 border-green-700',
          info: 'bg-blue-900/90 border-blue-700',
        }[toast.type];

        const iconColorClass = {
          error: 'text-red-400',
          success: 'text-green-400',
          info: 'text-blue-400',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`
              ${bgColorClass}
              ${toast.className || ''}
              border rounded-lg shadow-lg p-4 
              backdrop-blur-sm
              pointer-events-auto
              animate-in slide-in-from-right fade-in duration-300
            `}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${iconColorClass} flex-shrink-0 mt-0.5`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {toast.message}
                </p>
                
                {toast.description && (
                  <p className="text-white/70 text-xs mt-1">
                    {toast.description}
                  </p>
                )}
                
                {toast.showRetry && toast.onRetry && (
                  <button
                    onClick={() => {
                      toast.onRetry?.();
                      onHide(toast.id);
                    }}
                    className="
                      mt-3 px-3 py-1.5 
                      bg-white/20 hover:bg-white/30 
                      text-white text-xs font-medium
                      rounded-md transition-colors
                    "
                  >
                    重试
                  </button>
                )}
              </div>
              
              <button
                onClick={() => onHide(toast.id)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 友好的错误消息映射
 */
export const ERROR_MESSAGES: Record<string, { title: string; description?: string }> = {
  NETWORK_ERROR: {
    title: '网络连接失败',
    description: '请检查您的网络连接后重试',
  },
  TIMEOUT: {
    title: '请求超时',
    description: '服务器响应时间过长，请稍后重试',
  },
  VIDEO_LOAD_FAILED: {
    title: '视频加载失败',
    description: '请尝试切换视频源或检查网络连接',
  },
  SERVER_ERROR: {
    title: '服务器错误',
    description: '服务器暂时不可用，请稍后重试',
  },
  AUTH_FAILED: {
    title: '认证失败',
    description: '请重新登录后重试',
  },
  NOT_FOUND: {
    title: '内容不存在',
    description: '请求的资源可能已被删除或移动',
  },
};

/**
 * 根据错误类型获取友好的错误消息
 */
export function getFriendlyError(errorCode: string): { title: string; description?: string } {
  return ERROR_MESSAGES[errorCode] || {
    title: '操作失败',
    description: '请稍后重试',
  };
}

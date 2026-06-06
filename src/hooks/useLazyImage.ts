import { useState, useRef, useEffect, useCallback } from 'react';

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number | number[];
  onLoad?: () => void;
  onError?: (error: Event) => void;
  retryCount?: number;
  retryDelay?: number;
  // 新增：响应式图片和渐进式加载选项
  progressive?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export function useLazyImage({
  rootMargin = '200px 0px',
  threshold = 0.1,
  onLoad,
  onError,
  retryCount = 3,
  retryDelay = 1000,
  progressive = true,
  priority = 'medium',
}: UseLazyImageOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'placeholder' | 'low-res' | 'high-res'>(
    'placeholder'
  );
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 根据优先级动态调整 rootMargin
  const getDynamicRootMargin = useCallback(() => {
    switch (priority) {
      case 'high':
        return '500px 0px'; // 高优先级提前加载
      case 'medium':
        return rootMargin;
      case 'low':
        return '100px 0px'; // 低优先级延迟加载
      default:
        return rootMargin;
    }
  }, [rootMargin, priority]);

  const retryLoad = useCallback(() => {
    if (!imgRef.current || attempts >= retryCount) return;

    setIsError(false);
    setAttempts((prev) => prev + 1);

    retryTimerRef.current = setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.src = imgRef.current.src;
      }
    }, retryDelay);
  }, [attempts, retryCount, retryDelay]);

  const handleLoadComplete = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    setLoadingStage('high-res');
    onLoad?.();
  }, [onLoad]);

  const handleLoad = useCallback(
    (e: Event) => {
      const img = e.target as HTMLImageElement;

      if (progressive) {
        // 渐进式加载逻辑
        if (loadingStage === 'placeholder') {
          setLoadingStage('low-res');
        } else if (loadingStage === 'low-res') {
          handleLoadComplete();
        } else {
          handleLoadComplete();
        }
      } else {
        handleLoadComplete();
      }
    },
    [progressive, loadingStage, handleLoadComplete]
  );

  const handleError = useCallback(
    (error: Event) => {
      setIsError(true);
      onError?.(error);
    },
    [onError]
  );

  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (imgRef.current) {
        observerRef.current?.unobserve(imgRef.current);
        imgRef.current.removeEventListener('load', handleLoad);
        imgRef.current.removeEventListener('error', handleError);
      }

      imgRef.current = node;

      if (node) {
        // 添加事件监听器
        node.addEventListener('load', handleLoad);
        node.addEventListener('error', handleError);

        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;

                // 渐进式加载：先加载低质量版本
                if (progressive && img.dataset.placeholder) {
                  // 先加载占位图
                  img.src = img.dataset.placeholder;
                  setLoadingStage('placeholder');

                  // 然后加载低分辨率版本
                  setTimeout(() => {
                    if (img.dataset.lowRes) {
                      img.src = img.dataset.lowRes;
                      setLoadingStage('low-res');
                    }
                  }, 100);

                  // 最后加载高分辨率版本
                  setTimeout(() => {
                    if (img.dataset.src) {
                      img.src = img.dataset.src;
                      if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                      }
                      if (img.dataset.sizes) {
                        img.sizes = img.dataset.sizes;
                      }
                    }
                  }, 300);
                } else {
                  // 普通加载
                  if (img.dataset.src) {
                    img.src = img.dataset.src;
                    if (img.dataset.srcset) {
                      img.srcset = img.dataset.srcset;
                    }
                    if (img.dataset.sizes) {
                      img.sizes = img.dataset.sizes;
                    }
                  }
                  setLoadingStage('high-res');
                }

                observerRef.current?.unobserve(img);
              }
            });
          },
          {
            rootMargin: getDynamicRootMargin(),
            threshold,
          }
        );

        observerRef.current.observe(node);
      }
    },
    [getDynamicRootMargin, threshold, progressive, handleLoad, handleError]
  );

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (imgRef.current) {
        imgRef.current.removeEventListener('load', handleLoad);
        imgRef.current.removeEventListener('error', handleError);
      }
    };
  }, [handleLoad, handleError]);

  return {
    setRef,
    isLoaded,
    isError,
    retryLoad,
    attempts,
    canRetry: attempts < retryCount,
    loadingStage,
  };
}

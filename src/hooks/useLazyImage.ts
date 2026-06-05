import { useState, useRef, useEffect, useCallback } from 'react';

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number | number[];
  onLoad?: () => void;
  onError?: (error: Event) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useLazyImage({
  rootMargin = '200px 0px',
  threshold = 0.1,
  onLoad,
  onError,
  retryCount = 3,
  retryDelay = 1000
}: UseLazyImageOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryLoad = useCallback(() => {
    if (!imgRef.current || attempts >= retryCount) return;

    setIsError(false);
    setAttempts(prev => prev + 1);

    retryTimerRef.current = setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.src = imgRef.current.src;
      }
    }, retryDelay);
  }, [attempts, retryCount, retryDelay]);

  const setRef = useCallback((node: HTMLImageElement | null) => {
    if (imgRef.current) {
      observerRef.current?.unobserve(imgRef.current);
    }

    imgRef.current = node;

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                if (img.dataset.srcset) {
                  img.srcset = img.dataset.srcset;
                }
              }
              observerRef.current?.unobserve(img);
            }
          });
        },
        { rootMargin, threshold }
      );

      observerRef.current.observe(node);
    }
  }, [rootMargin, threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: Event) => {
    setIsError(true);
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    setRef,
    isLoaded,
    isError,
    retryLoad,
    attempts,
    canRetry: attempts < retryCount
  };
}

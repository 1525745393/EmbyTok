import { useState, useCallback, useEffect, useRef } from 'react';

export interface LoadingStateOptions {
  initialLoadedCount?: number;
  batchSize?: number;
  onBatchLoaded?: (loadedCount: number) => void;
}

export interface LoadingStateReturn {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  setLoadedCount: (count: number) => void;
  incrementLoaded: (count?: number) => void;
  setTotalCount: (count: number) => void;
  startLoading: () => void;
  stopLoading: () => void;
  resetLoading: () => void;
  isInitialLoading: boolean;
  hasLoadedOnce: boolean;
}

export function useLoadingState(options: LoadingStateOptions = {}): LoadingStateReturn {
  const {
    initialLoadedCount = 0,
    batchSize = 4,
    onBatchLoaded,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCountState] = useState(initialLoadedCount);
  const [totalCount, setTotalCountState] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const pendingRef = useRef<number>(0);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLoadedCount = useCallback((count: number) => {
    setLoadedCountState(count);
    if (count > 0 && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      setIsInitialLoading(false);
    }
    if (count >= totalCount && totalCount > 0) {
      setIsLoading(false);
    }
    onBatchLoaded?.(count);
  }, [totalCount, hasLoadedOnce, onBatchLoaded]);

  const incrementLoaded = useCallback((count: number = 1) => {
    const newCount = loadedCount + count;
    pendingRef.current += count;

    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }

    batchTimerRef.current = setTimeout(() => {
      setLoadedCount(pendingRef.current);
      pendingRef.current = 0;
    }, 50);
  }, [loadedCount, setLoadedCount]);

  const setTotalCount = useCallback((count: number) => {
    setTotalCountState(count);
    if (count === 0) {
      setIsLoading(false);
    }
  }, []);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadedCountState(0);
    pendingRef.current = 0;
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
  }, []);

  const resetLoading = useCallback(() => {
    setIsLoading(true);
    setLoadedCountState(0);
    setTotalCountState(0);
    setIsInitialLoading(true);
    setHasLoadedOnce(false);
    pendingRef.current = 0;
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (totalCount > 0 && loadedCount >= totalCount) {
      setIsLoading(false);
    }
  }, [totalCount, loadedCount]);

  return {
    isLoading,
    loadedCount,
    totalCount,
    setLoadedCount,
    incrementLoaded,
    setTotalCount,
    startLoading,
    stopLoading,
    resetLoading,
    isInitialLoading,
    hasLoadedOnce,
  };
}

export default useLoadingState;

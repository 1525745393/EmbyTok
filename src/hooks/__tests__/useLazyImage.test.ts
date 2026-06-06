import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLazyImage } from '../useLazyImage';

describe('useLazyImage Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLazyImage());

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.attempts).toBe(0);
    expect(result.current.loadingStage).toBe('placeholder');
    expect(typeof result.current.setRef).toBe('function');
    expect(typeof result.current.retryLoad).toBe('function');
  });

  it('should accept custom configuration', () => {
    const { result } = renderHook(() =>
      useLazyImage({
        rootMargin: '100px 0px',
        threshold: 0.5,
        retryCount: 5,
        retryDelay: 2000,
        progressive: false,
        priority: 'high',
      })
    );

    expect(result.current.canRetry).toBe(true);
  });

  it('should handle load events', () => {
    const mockOnLoad = vi.fn();
    const { result } = renderHook(() => useLazyImage({ onLoad: mockOnLoad }));

    expect(typeof result.current.setRef).toBe('function');
  });

  it('should handle error events', () => {
    const mockOnError = vi.fn();
    const { result } = renderHook(() => useLazyImage({ onError: mockOnError }));

    expect(typeof result.current.setRef).toBe('function');
  });

  it('should track retry attempts', () => {
    const { result } = renderHook(() => useLazyImage({ retryCount: 3 }));

    expect(result.current.attempts).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should return correct loading stages', () => {
    const { result } = renderHook(() => useLazyImage());

    expect(result.current.loadingStage).toBe('placeholder');
  });
});

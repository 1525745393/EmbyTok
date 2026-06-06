import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGestureControls } from '../useGestureControls';

describe('useGestureControls Hook', () => {
  const mockTogglePlay = vi.fn();
  const mockOnDoubleTap = vi.fn();
  const mockOnSwipeDown = vi.fn();
  const mockVideoRef = {
    current: {
      playbackRate: 1.0,
      currentTime: 100,
      duration: 200,
    } as HTMLVideoElement,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useGestureControls({
        togglePlay: mockTogglePlay,
        videoRef: mockVideoRef,
      })
    );

    expect(result.current.playbackRate).toBe(1.0);
    expect(result.current.seekOffset).toBeNull();
    expect(result.current.hearts).toEqual([]);
  });

  it('should expose all handler methods', () => {
    const { result } = renderHook(() =>
      useGestureControls({
        togglePlay: mockTogglePlay,
        videoRef: mockVideoRef,
      })
    );

    expect(typeof result.current.handleTouchStart).toBe('function');
    expect(typeof result.current.handleTouchMove).toBe('function');
    expect(typeof result.current.handleTouchEnd).toBe('function');
    expect(typeof result.current.addHeart).toBe('function');
  });

  it('should add hearts', () => {
    const { result } = renderHook(() =>
      useGestureControls({
        togglePlay: mockTogglePlay,
        videoRef: mockVideoRef,
      })
    );

    expect(result.current.hearts.length).toBe(0);

    act(() => {
      result.current.addHeart(100, 200);
    });

    expect(result.current.hearts.length).toBe(1);
    expect(result.current.hearts[0].x).toBe(100);
    expect(result.current.hearts[0].y).toBe(200);
  });

  it('should accept optional callbacks', () => {
    const { result } = renderHook(() =>
      useGestureControls({
        togglePlay: mockTogglePlay,
        onDoubleTap: mockOnDoubleTap,
        onSwipeDown: mockOnSwipeDown,
        videoRef: mockVideoRef,
      })
    );

    expect(result.current).toBeDefined();
  });
});

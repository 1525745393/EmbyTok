import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoControls } from '../useVideoControls';

describe('useVideoControls Hook', () => {
  // Mock video element
  const mockVideoElement = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    muted: false,
    currentTime: 0,
    duration: 100,
    playbackRate: 1.0
  };

  const mockContainerElement = {
    getBoundingClientRect: vi.fn().mockReturnValue({
      width: 1000,
      height: 500,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 500
    }),
    focus: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock refs
    Object.defineProperty(global, 'React', {
      value: {
        ...global.React,
        useRef: vi.fn().mockImplementation(() => ({
          current: mockVideoElement
        }))
      }
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.isSeeking).toBe(false);
    expect(result.current.isUserPaused).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts playing when isActive is true', async () => {
    mockVideoElement.play.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useVideoControls({
      isActive: true,
      isMuted: false
    }));

    // Wait for async play
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPlaying).toBe(true);
    expect(mockVideoElement.play).toHaveBeenCalled();
  });

  it('handles play error gracefully', async () => {
    mockVideoElement.play.mockRejectedValue(new Error('Play failed'));
    
    const { result } = renderHook(() => useVideoControls({
      isActive: true,
      isMuted: false
    }));

    // Wait for async play
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('toggles play state correctly', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    // Toggle to play
    act(() => {
      mockVideoElement.paused = true;
      result.current.togglePlay();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isUserPaused).toBe(false);
    expect(mockVideoElement.play).toHaveBeenCalled();

    // Toggle to pause
    act(() => {
      mockVideoElement.paused = false;
      result.current.togglePlay();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isUserPaused).toBe(true);
    expect(mockVideoElement.pause).toHaveBeenCalled();
  });

  it('handles time update', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    act(() => {
      mockVideoElement.currentTime = 30;
      result.current.handleTimeUpdate();
    });

    expect(result.current.currentTime).toBe(30);
  });

  it('handles loaded metadata', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    act(() => {
      mockVideoElement.duration = 120;
      result.current.handleLoadedMetadata();
    });

    expect(result.current.duration).toBe(120);
  });

  it('handles video ended with auto play', () => {
    const onVideoEnd = vi.fn();
    
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false,
      isAutoPlay: true,
      onVideoEnd
    }));

    act(() => {
      result.current.handleVideoEnded();
    });

    expect(onVideoEnd).toHaveBeenCalled();
  });

  it('does not call onVideoEnd without auto play', () => {
    const onVideoEnd = vi.fn();
    
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false,
      isAutoPlay: false,
      onVideoEnd
    }));

    act(() => {
      result.current.handleVideoEnded();
    });

    expect(onVideoEnd).not.toHaveBeenCalled();
  });

  it('handles seek operations', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    // Set up duration
    act(() => {
      mockVideoElement.duration = 100;
      result.current.handleLoadedMetadata();
    });

    // Start seek
    act(() => {
      result.current.handleSeekStart({ 
        stopPropagation: vi.fn() 
      } as any);
    });
    expect(result.current.isSeeking).toBe(true);

    // Move seek
    act(() => {
      result.current.handleSeekMove({
        stopPropagation: vi.fn(),
        clientX: 500
      } as any);
    });
    expect(result.current.currentTime).toBe(50); // 50% of 100

    // End seek
    act(() => {
      result.current.handleSeekEnd({
        stopPropagation: vi.fn()
      } as any);
    });
    expect(result.current.isSeeking).toBe(false);
    expect(mockVideoElement.currentTime).toBe(50);
  });

  it('sets and clears errors', () => {
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false
    }));

    act(() => {
      result.current.setError('Playback error');
    });
    expect(result.current.error).toBe('Playback error');

    // Clear error by activating
    const { result: result2 } = renderHook(() => useVideoControls({
      isActive: true,
      isMuted: false
    }));
    expect(result2.current.error).toBeNull();
  });

  it('calls load start callback', () => {
    const onVideoLoadStart = vi.fn();
    
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false,
      onVideoLoadStart
    }));

    act(() => {
      result.current.handleLoadStart();
    });

    expect(onVideoLoadStart).toHaveBeenCalled();
  });

  it('calls can play callback', () => {
    const onVideoLoadComplete = vi.fn();
    
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false,
      onVideoLoadComplete
    }));

    act(() => {
      result.current.handleCanPlay();
    });

    expect(onVideoLoadComplete).toHaveBeenCalled();
  });

  it('calls playing callback', () => {
    const onVideoLoadComplete = vi.fn();
    
    const { result } = renderHook(() => useVideoControls({
      isActive: false,
      isMuted: false,
      onVideoLoadComplete
    }));

    act(() => {
      result.current.handlePlaying();
    });

    expect(onVideoLoadComplete).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.hasStarted).toBe(true);
  });
});

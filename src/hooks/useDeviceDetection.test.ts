import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceDetection } from './useDeviceDetection';

// 模拟依赖的 utils 函数
vi.mock('../../utils', () => ({
  isMobile: vi.fn(),
  isLandscape: vi.fn(),
  isIOSSafari: vi.fn(),
}));

// 导入模拟后的函数
import { isMobile, isLandscape, isIOSSafari } from '../../utils';

describe('useDeviceDetection hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    (isMobile as any).mockReturnValue(false);
    (isLandscape as any).mockReturnValue(false);
    (isIOSSafari as any).mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current).toEqual({
      isIOSSafari: false,
      isMobile: false,
      isLandscape: false,
    });
  });

  it('should detect mobile device', () => {
    (isMobile as any).mockReturnValue(true);
    (isLandscape as any).mockReturnValue(false);
    (isIOSSafari as any).mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isIOSSafari).toBe(false);
    expect(result.current.isLandscape).toBe(false);
  });

  it('should detect iOS Safari', () => {
    (isMobile as any).mockReturnValue(true);
    (isLandscape as any).mockReturnValue(true);
    (isIOSSafari as any).mockReturnValue(true);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isIOSSafari).toBe(true);
    expect(result.current.isLandscape).toBe(true);
  });

  it('should update state on resize event', () => {
    (isMobile as any)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    (isLandscape as any)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    (isIOSSafari as any)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const { result } = renderHook(() => useDeviceDetection());

    // 初始状态
    expect(result.current.isMobile).toBe(false);

    // 触发 resize 事件
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // 更新后的状态
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isIOSSafari).toBe(true);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useDeviceDetection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should return correct state structure', () => {
    (isMobile as any).mockReturnValue(true);
    (isLandscape as any).mockReturnValue(false);
    (isIOSSafari as any).mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    // 验证返回对象的结构
    expect(result.current).toHaveProperty('isIOSSafari');
    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isLandscape');

    // 验证所有属性都是布尔值
    expect(typeof result.current.isIOSSafari).toBe('boolean');
    expect(typeof result.current.isMobile).toBe('boolean');
    expect(typeof result.current.isLandscape).toBe('boolean');
  });
});

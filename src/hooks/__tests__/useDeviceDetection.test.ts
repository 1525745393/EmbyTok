import { renderHook } from '@testing-library/react';
import { useDeviceDetection } from '../useDeviceDetection';
import * as utils from '../../../utils';

vi.mock('../../../utils', () => ({
  isMobile: vi.fn(),
  isLandscape: vi.fn(),
  isIOSSafari: vi.fn(),
}));

describe('useDeviceDetection', () => {
  const mockIsMobile = vi.mocked(utils.isMobile);
  const mockIsLandscape = vi.mocked(utils.isLandscape);
  const mockIsIOSSafari = vi.mocked(utils.isIOSSafari);

  beforeEach(() => {
    vi.clearAllMocks();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  it('应该初始化设备检测状态', () => {
    mockIsMobile.mockReturnValue(false);
    mockIsLandscape.mockReturnValue(false);
    mockIsIOSSafari.mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.isIOSSafari).toBe(false);
  });

  it('应该正确检测移动端', () => {
    mockIsMobile.mockReturnValue(true);
    mockIsLandscape.mockReturnValue(false);
    mockIsIOSSafari.mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(true);
  });

  it('应该正确检测横屏模式', () => {
    mockIsMobile.mockReturnValue(false);
    mockIsLandscape.mockReturnValue(true);
    mockIsIOSSafari.mockReturnValue(false);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isLandscape).toBe(true);
  });

  it('应该正确检测 iOS Safari', () => {
    mockIsMobile.mockReturnValue(false);
    mockIsLandscape.mockReturnValue(false);
    mockIsIOSSafari.mockReturnValue(true);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isIOSSafari).toBe(true);
  });

  it('应该注册和注销 resize 事件监听', () => {
    mockIsMobile.mockReturnValue(false);
    mockIsLandscape.mockReturnValue(false);
    mockIsIOSSafari.mockReturnValue(false);

    const { unmount } = renderHook(() => useDeviceDetection());

    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('应该同时检测多个设备特性', () => {
    mockIsMobile.mockReturnValue(true);
    mockIsLandscape.mockReturnValue(true);
    mockIsIOSSafari.mockReturnValue(true);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isIOSSafari).toBe(true);
  });
});

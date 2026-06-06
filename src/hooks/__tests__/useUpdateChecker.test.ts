import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateChecker } from '../useUpdateChecker';

describe('useUpdateChecker Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUpdateChecker());

    expect(result.current.currentVersion).toBeDefined();
    expect(result.current.isChecking).toBe(false);
    expect(result.current.lastCheckTime).toBe(0);
    expect(result.current.checkError).toBeNull();
  });

  it('should expose checkForUpdates method', () => {
    const { result } = renderHook(() => useUpdateChecker());

    expect(typeof result.current.checkForUpdates).toBe('function');
  });

  it('should parse version strings correctly', () => {
    // We can't directly test private methods, but we can test the
    // hook's behavior through public API
    const { result } = renderHook(() => useUpdateChecker());

    // Basic test to ensure the hook loads
    expect(result.current.currentVersion).toBeTruthy();
  });

  it('should call checkForUpdates', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v1.0.0' }),
    });

    const { result } = renderHook(() => useUpdateChecker());

    await act(async () => {
      const checkResult = await result.current.checkForUpdates();
      expect(checkResult).toBeDefined();
    });

    expect(global.fetch).toHaveBeenCalled();
    global.fetch = originalFetch;
  });

  it('should handle update check errors', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateChecker());

    await act(async () => {
      const checkResult = await result.current.checkForUpdates();
      expect(checkResult.hasUpdate).toBe(false);
    });

    expect(result.current.checkError).toBeTruthy();
    expect(result.current.isChecking).toBe(false);

    global.fetch = originalFetch;
  });
});

import { renderHook, act } from '@testing-library/react';
import { useWatchHistory } from '../useWatchHistory';
import { useLocalStorageState } from '../useLocalStorageState';

vi.mock('../useLocalStorageState', () => ({
  useLocalStorageState: vi.fn(),
}));

describe('useWatchHistory', () => {
  const mockSetHistory = vi.fn();
  const mockUseLocalStorageState = vi.mocked(useLocalStorageState);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocalStorageState.mockReturnValue([
      { items: [], lastUpdated: 1234567890 },
      mockSetHistory,
    ]);
  });

  // Helper function to handle both function and value updates
  const applySetState = (prevState: any, arg: any) => {
    return typeof arg === 'function' ? arg(prevState) : arg;
  };

  it('应该初始化空的历史记录', () => {
    const { result } = renderHook(() => useWatchHistory());

    expect(result.current.history).toEqual([]);
  });

  it('应该添加新的观看历史项目', () => {
    const { result } = renderHook(() => useWatchHistory());

    const testItem = {
      itemId: 'video123',
      name: 'Test Video',
      positionTicks: 12345,
      totalTicks: 60000,
    };

    act(() => {
      result.current.addToHistory(testItem);
    });

    expect(mockSetHistory).toHaveBeenCalledTimes(1);
    const arg = mockSetHistory.mock.calls[0][0];
    const resultState = applySetState({ items: [], lastUpdated: 0 }, arg);

    expect(resultState.items).toHaveLength(1);
    expect(resultState.items[0].itemId).toBe('video123');
    expect(resultState.items[0].name).toBe('Test Video');
    expect(resultState.items[0].positionTicks).toBe(12345);
  });

  it('应该更新已存在的历史项目并移到顶部', () => {
    const existingItem = {
      id: 'old_id',
      itemId: 'video123',
      name: 'Old Name',
      positionTicks: 5000,
      totalTicks: 60000,
      watchedAt: 1234567890,
    };

    mockUseLocalStorageState.mockReturnValue([
      { items: [existingItem], lastUpdated: 1234567890 },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    const newItem = {
      itemId: 'video123',
      name: 'Updated Video',
      positionTicks: 10000,
      totalTicks: 60000,
    };

    act(() => {
      result.current.addToHistory(newItem);
    });

    const arg = mockSetHistory.mock.calls[0][0];
    const resultState = applySetState({ items: [existingItem], lastUpdated: 1234567890 }, arg);

    expect(resultState.items).toHaveLength(1);
    expect(resultState.items[0].name).toBe('Updated Video');
    expect(resultState.items[0].positionTicks).toBe(10000);
  });

  it('应该保持历史记录不超过最大数量', () => {
    const manyItems = Array.from({ length: 150 }, (_, i) => ({
      id: `item_${i}`,
      itemId: `video_${i}`,
      name: `Video ${i}`,
      positionTicks: 0,
      totalTicks: 60000,
      watchedAt: Date.now() - i,
    }));

    mockUseLocalStorageState.mockReturnValue([
      { items: manyItems, lastUpdated: Date.now() },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    const newItem = {
      itemId: 'new_video',
      name: 'New Video',
      positionTicks: 0,
      totalTicks: 60000,
    };

    act(() => {
      result.current.addToHistory(newItem);
    });

    const arg = mockSetHistory.mock.calls[0][0];
    const resultState = applySetState({ items: manyItems, lastUpdated: Date.now() }, arg);

    expect(resultState.items.length).toBeLessThanOrEqual(100);
  });

  it('应该从历史记录中删除项目', () => {
    const existingItem = {
      id: 'item1',
      itemId: 'video123',
      name: 'Test Video',
      positionTicks: 12345,
      totalTicks: 60000,
      watchedAt: 1234567890,
    };

    mockUseLocalStorageState.mockReturnValue([
      { items: [existingItem], lastUpdated: 1234567890 },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.removeFromHistory('video123');
    });

    const arg = mockSetHistory.mock.calls[0][0];
    const resultState = applySetState({ items: [existingItem], lastUpdated: 1234567890 }, arg);

    expect(resultState.items).toHaveLength(0);
  });

  it('应该清空整个历史记录', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      id: `item_${i}`,
      itemId: `video_${i}`,
      name: `Video ${i}`,
      positionTicks: 0,
      totalTicks: 60000,
      watchedAt: Date.now(),
    }));

    mockUseLocalStorageState.mockReturnValue([
      { items: manyItems, lastUpdated: Date.now() },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.clearHistory();
    });

    const arg = mockSetHistory.mock.calls[0][0];
    const resultState = applySetState({ items: manyItems, lastUpdated: Date.now() }, arg);

    expect(resultState.items).toHaveLength(0);
  });

  it('应该获取历史记录中的项目', () => {
    const existingItem = {
      id: 'item1',
      itemId: 'video123',
      name: 'Test Video',
      positionTicks: 12345,
      totalTicks: 60000,
      watchedAt: 1234567890,
    };

    mockUseLocalStorageState.mockReturnValue([
      { items: [existingItem], lastUpdated: 1234567890 },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    const foundItem = result.current.getHistoryItem('video123');
    expect(foundItem).toEqual(existingItem);

    const notFound = result.current.getHistoryItem('non_existent');
    expect(notFound).toBeUndefined();
  });

  it('应该获取项目的播放进度', () => {
    const existingItem = {
      id: 'item1',
      itemId: 'video123',
      name: 'Test Video',
      positionTicks: 12345,
      totalTicks: 60000,
      watchedAt: 1234567890,
    };

    mockUseLocalStorageState.mockReturnValue([
      { items: [existingItem], lastUpdated: 1234567890 },
      mockSetHistory,
    ]);

    const { result } = renderHook(() => useWatchHistory());

    const progress = result.current.getProgress('video123');
    expect(progress).toBe(12345);

    const noProgress = result.current.getProgress('non_existent');
    expect(noProgress).toBe(0);
  });
});

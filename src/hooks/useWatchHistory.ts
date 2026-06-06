import { useCallback } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { WatchHistory, WatchHistoryItem } from '../../types';

const WATCH_HISTORY_KEY = 'embytok_watch_history';
const MAX_HISTORY_ITEMS = 100;

export function useWatchHistory() {
  const [history, setHistory] = useLocalStorageState<WatchHistory>(WATCH_HISTORY_KEY, {
    items: [],
    lastUpdated: Date.now(),
  });

  const addToHistory = useCallback(
    (item: Omit<WatchHistoryItem, 'id' | 'watchedAt'>) => {
      setHistory((prev) => {
        const now = Date.now();
        const existingIndex = prev.items.findIndex((h) => h.itemId === item.itemId);
        let newItems: WatchHistoryItem[];

        const newItem: WatchHistoryItem = {
          ...item,
          id: existingIndex >= 0 ? prev.items[existingIndex].id : `${item.itemId}_${now}`,
          watchedAt: now,
        };

        if (existingIndex >= 0) {
          newItems = [newItem, ...prev.items.filter((_, i) => i !== existingIndex)];
        } else {
          newItems = [newItem, ...prev.items];
        }

        if (newItems.length > MAX_HISTORY_ITEMS) {
          newItems = newItems.slice(0, MAX_HISTORY_ITEMS);
        }

        return {
          items: newItems,
          lastUpdated: now,
        };
      });
    },
    [setHistory]
  );

  const removeFromHistory = useCallback(
    (itemId: string) => {
      setHistory((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.itemId !== itemId),
        lastUpdated: Date.now(),
      }));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory({ items: [], lastUpdated: Date.now() });
  }, [setHistory]);

  const getHistoryItem = useCallback(
    (itemId: string) => {
      return history.items.find((item) => item.itemId === itemId);
    },
    [history.items]
  );

  const getProgress = useCallback(
    (itemId: string) => {
      const item = history.items.find((h) => h.itemId === itemId);
      return item ? item.positionTicks : 0;
    },
    [history.items]
  );

  return {
    history: history.items,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem,
    getProgress,
  };
}

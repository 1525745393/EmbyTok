import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { SearchResult, SearchHistoryItem, EmbyItem } from '../../types';
import type { MediaClient } from '../../services/MediaClient';
import { getUserStorageKey } from './useMultiUser';

const SEARCH_HISTORY_KEY = 'embytok_search_history';
const MAX_SEARCH_HISTORY = 20;
const DEBOUNCE_DELAY = 300;

export function useSearch(client: MediaClient | null, userId?: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ items: [], totalRecordCount: 0 });
  const [loading, setLoading] = useState(false);
  // 如果有 userId，使用用户隔离的存储键
  const storageKey = userId ? getUserStorageKey(userId, 'search_history') : SEARCH_HISTORY_KEY;
  const [searchHistory, setSearchHistory] = useLocalStorageState<SearchHistoryItem[]>(
    storageKey,
    []
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query.toLowerCase() !== searchQuery.toLowerCase());
      const newItem: SearchHistoryItem = {
        query: searchQuery.trim(),
        timestamp: Date.now()
      };
      const newHistory = [newItem, ...filtered];
      return newHistory.slice(0, MAX_SEARCH_HISTORY);
    });
  }, [setSearchHistory]);

  const removeFromHistory = useCallback((searchQuery: string) => {
    setSearchHistory(prev => 
      prev.filter(item => item.query !== searchQuery)
    );
  }, [setSearchHistory]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!client || !searchQuery.trim()) {
      setResults({ items: [], totalRecordCount: 0 });
      return;
    }

    setLoading(true);
    try {
      const items = await client.searchItems(searchQuery);
      setResults({
        items,
        totalRecordCount: items.length
      });
      addToHistory(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ items: [], totalRecordCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [client, addToHistory]);

  const debouncedSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, DEBOUNCE_DELAY);
    } else {
      setResults({ items: [], totalRecordCount: 0 });
    }
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    searchHistory,
    setQuery,
    debouncedSearch,
    performSearch,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { SearchResult, SearchHistoryItem, EmbyItem } from '../../types';
import type { MediaClient } from '../../services/MediaClient';

const SEARCH_HISTORY_KEY = 'embytok_search_history';
const MAX_SEARCH_HISTORY = 20;
const DEBOUNCE_DELAY = 300;
const PAGE_SIZE = 20;

export function useSearch(client: MediaClient | null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ items: [], totalRecordCount: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorageState<SearchHistoryItem[]>(
    SEARCH_HISTORY_KEY,
    []
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSearchQueryRef = useRef('');

  const addToHistory = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setSearchHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.query.toLowerCase() !== searchQuery.toLowerCase()
        );
        const newItem: SearchHistoryItem = {
          query: searchQuery.trim(),
          timestamp: Date.now(),
        };
        const newHistory = [newItem, ...filtered];
        return newHistory.slice(0, MAX_SEARCH_HISTORY);
      });
    },
    [setSearchHistory]
  );

  const removeFromHistory = useCallback(
    (searchQuery: string) => {
      setSearchHistory((prev) => prev.filter((item) => item.query !== searchQuery));
    },
    [setSearchHistory]
  );

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  const performSearch = useCallback(
    async (searchQuery: string, isLoadMore = false) => {
      if (!client || !searchQuery.trim()) {
        setResults({ items: [], totalRecordCount: 0 });
        setHasMore(false);
        setCurrentPage(0);
        return;
      }

      const page = isLoadMore ? currentPage + 1 : 0;
      const startIndex = page * PAGE_SIZE;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        currentSearchQueryRef.current = searchQuery;
      }

      try {
        const items = await client.searchItems(searchQuery);

        if (isLoadMore && currentSearchQueryRef.current !== searchQuery) {
          return;
        }

        const hasMoreItems = items.length > startIndex + PAGE_SIZE;
        const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE);

        if (isLoadMore) {
          setResults((prev) => ({
            items: [...prev.items, ...pageItems],
            totalRecordCount: items.length,
          }));
        } else {
          setResults({
            items: pageItems,
            totalRecordCount: items.length,
          });
        }

        setCurrentPage(page);
        setHasMore(hasMoreItems);

        if (!isLoadMore) {
          addToHistory(searchQuery);
        }
      } catch (error) {
        console.error('Search error:', error);
        if (!isLoadMore) {
          setResults({ items: [], totalRecordCount: 0 });
          setHasMore(false);
          setCurrentPage(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [client, addToHistory, currentPage]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    performSearch(query, true);
  }, [hasMore, loadingMore, loading, query, performSearch]);

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
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
        setHasMore(false);
        setCurrentPage(0);
      }
    },
    [performSearch]
  );

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
    loadingMore,
    hasMore,
    searchHistory,
    setQuery,
    debouncedSearch,
    performSearch,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadMore,
  };
}

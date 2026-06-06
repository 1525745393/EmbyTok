import { useState, useEffect, useCallback, useMemo } from 'react';
import { EmbyLibrary } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import { useLocalStorageState } from './useLocalStorageState';

export function useLibraries(client: MediaClient | null) {
  const [libraries, setLibraries] = useState<EmbyLibrary[]>([]);
  const [selectedLib, setSelectedLib] = useState<EmbyLibrary | null>(null);
  const [hiddenLibIds, setHiddenLibIds] = useLocalStorageState<string[]>('embyHiddenLibs', []);

  const hiddenLibIdsSet = useMemo(() => new Set(hiddenLibIds), [hiddenLibIds]);

  const fetchLibraries = useCallback(async () => {
    if (client) {
      const libs = await client.getLibraries();
      setLibraries(libs);
    }
  }, [client]);

  const toggleHiddenLib = useCallback(
    (id: string) => {
      setHiddenLibIds((prev) => {
        const set = new Set(prev);
        if (set.has(id)) {
          set.delete(id);
        } else {
          set.add(id);
        }
        return Array.from(set);
      });
    },
    [setHiddenLibIds]
  );

  useEffect(() => {
    if (client) {
      fetchLibraries();
    }
  }, [client, fetchLibraries]);

  return {
    libraries,
    selectedLib,
    setSelectedLib,
    hiddenLibIds,
    hiddenLibIdsSet,
    toggleHiddenLib,
    fetchLibraries,
  };
}

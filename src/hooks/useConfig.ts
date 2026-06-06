import { useMemo } from 'react';
import { ServerConfig } from '../../types';
import { ClientFactory } from '../../services/clientFactory';
import { useLocalStorageState } from './useLocalStorageState';

export function useConfig() {
  const [config, setConfig] = useLocalStorageState<ServerConfig | null>('embyConfig', null);

  const client = useMemo(() => {
    return config ? ClientFactory.create(config) : null;
  }, [config]);

  const logout = () => {
    setConfig(null);
    localStorage.removeItem('embyConfig');
    window.location.reload();
  };

  return { config, setConfig, client, logout };
}

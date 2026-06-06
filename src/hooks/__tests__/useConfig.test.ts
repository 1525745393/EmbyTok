import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfig } from '../useConfig';
import { ClientFactory } from '../../../services/clientFactory';
import type { ServerConfig } from '../../../types';

vi.mock('../../../services/clientFactory');

describe('useConfig', () => {
  const mockConfig: ServerConfig = {
    url: 'http://localhost:8096',
    username: 'testuser',
    token: 'testtoken',
    userId: 'user123',
    serverType: 'emby' as const,
  };

  const mockClient = {
    authenticate: vi.fn(),
    getVideos: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (ClientFactory.create as any).mockReturnValue(mockClient);
  });

  it('should initialize with null config when localStorage is empty', () => {
    const { result } = renderHook(() => useConfig());

    expect(result.current.config).toBeNull();
    expect(result.current.client).toBeNull();
  });

  it('should read config from localStorage and create client', () => {
    localStorage.setItem('embyConfig', JSON.stringify(mockConfig));

    const { result } = renderHook(() => useConfig());

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.client).toEqual(mockClient);
    expect(ClientFactory.create).toHaveBeenCalledWith(mockConfig);
  });

  it('should update config and create new client when setConfig is called', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.setConfig(mockConfig);
    });

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.client).toEqual(mockClient);
    expect(ClientFactory.create).toHaveBeenCalledWith(mockConfig);
  });

  it('should clear config and client when setConfig is called with null', () => {
    localStorage.setItem('embyConfig', JSON.stringify(mockConfig));

    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.setConfig(null);
    });

    expect(result.current.config).toBeNull();
    expect(result.current.client).toBeNull();
  });

  it('should clear config and reload page on logout', () => {
    localStorage.setItem('embyConfig', JSON.stringify(mockConfig));
    const mockReload = vi.fn();
    Object.defineProperty(window.location, 'reload', {
      value: mockReload,
      configurable: true,
    });

    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('embyConfig')).toEqual(JSON.stringify(null));
    expect(mockReload).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbyClient } from '../EmbyClient';
import type { ServerConfig, EmbyLibrary, EmbyItem } from '../../types';

describe('EmbyClient', () => {
  let client: EmbyClient;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      url: 'http://localhost:8096',
      username: 'testuser',
      token: 'testtoken123',
      userId: 'user123',
      serverType: 'emby' as const,
    };
    client = new EmbyClient(config);
  });

  describe('constructor', () => {
    it('should create an instance of EmbyClient', () => {
      expect(client).toBeInstanceOf(EmbyClient);
    });
  });

  describe('getVideoUrl', () => {
    it('should return a valid video URL for an item', () => {
      const item = {
        Id: 'video123',
        Name: 'Test Video',
      } as EmbyItem;

      const url = client.getVideoUrl(item);

      expect(url).toContain('http://localhost:8096');
      expect(url).toContain('video123');
      expect(url).toContain('testtoken123');
    });

    it('should return URL with MediaSourceId when available', () => {
      const item = {
        Id: 'video123',
        Name: 'Test Video',
        MediaSources: [
          {
            Id: 'source456',
            Container: 'mp4',
            Path: '/path/to/video.mp4',
            Protocol: 'File',
            SupportsDirectPlay: true,
          },
        ],
      } as EmbyItem;

      const url = client.getVideoUrl(item);

      expect(url).toContain('MediaSourceId=source456');
    });
  });

  describe('getImageUrl', () => {
    it('should return a valid image URL', () => {
      const url = client.getImageUrl('item123', 'tag456', 'Primary');

      expect(url).toContain('http://localhost:8096');
      expect(url).toContain('item123');
      expect(url).toContain('tag456');
      expect(url).toContain('Primary');
      expect(url).toContain('testtoken123');
    });

    it('should return empty string when tag is undefined', () => {
      const url = client.getImageUrl('item123', undefined, 'Primary');
      expect(url).toBe('');
    });

    it('should use Primary as default image type', () => {
      const url = client.getImageUrl('item123', 'tag456');
      expect(url).toContain('Primary');
    });
  });

  describe('API methods with fetch mock', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('authenticate should return server config on successful auth', async () => {
      const mockResponse = {
        User: {
          Id: 'newuserid',
          Name: 'testuser',
        },
        AccessToken: 'newaccesstoken',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.authenticate('testuser', 'password123');

      expect(result.userId).toBe('newuserid');
      expect(result.token).toBe('newaccesstoken');
      expect(result.username).toBe('testuser');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('authenticate should throw error on failed auth', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(client.authenticate('testuser', 'wrongpassword')).rejects.toThrow();
    });

    it('getLibraries should return libraries array', async () => {
      const mockLibraries = {
        Items: [
          { Id: 'lib1', Name: 'Movies', CollectionType: 'movies' },
          { Id: 'lib2', Name: 'TV Shows', CollectionType: 'tvshows' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLibraries,
      });

      const result = await client.getLibraries();

      expect(result).toHaveLength(2);
      expect(result[0].Name).toBe('Movies');
    });

    it('getVideos should return video response', async () => {
      const mockResponse = {
        Items: [
          { Id: 'video1', Name: 'Video 1', Type: 'Movie' },
          { Id: 'video2', Name: 'Video 2', Type: 'Movie' },
        ],
        TotalRecordCount: 2,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getVideos(undefined, null, 'latest', 0, 10, 'both');

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('searchItems should return search results', async () => {
      const mockResponse = {
        Items: [{ Id: 'video1', Name: 'Test Movie', Type: 'Movie' }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchItems('test');

      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('Test Movie');
    });
  });
});

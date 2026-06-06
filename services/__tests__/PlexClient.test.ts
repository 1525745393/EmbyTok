import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlexClient } from '../PlexClient';
import type { ServerConfig } from '../../types';

describe('PlexClient', () => {
  let client: PlexClient;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      url: 'http://localhost:32400',
      username: 'testuser',
      token: 'plex-token-123',
      userId: 'user123',
      serverType: 'plex' as const,
    };
    client = new PlexClient(config);
  });

  describe('constructor', () => {
    it('should create an instance of PlexClient', () => {
      expect(client).toBeInstanceOf(PlexClient);
    });
  });

  describe('getVideoUrl', () => {
    it('should return a valid video URL for an item', () => {
      const item = {
        Id: 'video123',
        Name: 'Test Video',
        _PlexKey: '/library/parts/123',
      } as any;

      const url = client.getVideoUrl(item);

      expect(url).toContain('http://localhost:32400');
      expect(url).toContain('123');
      expect(url).toContain('plex-token-123');
    });

    it('should return transcoded URL if no direct key', () => {
      const item = {
        Id: 'video123',
        Name: 'Test Video',
      } as any;

      const url = client.getVideoUrl(item);

      expect(url).toContain('/video/:/transcode/universal/start');
      expect(url).toContain('video123');
    });
  });

  describe('getImageUrl', () => {
    it('should return a valid image URL', () => {
      const url = client.getImageUrl('item123', 'tag456', 'Primary');

      expect(url).toContain('http://localhost:32400');
      expect(url).toContain('item123');
      expect(url).toContain('plex-token-123');
    });
  });

  describe('API methods with fetch mock', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('authenticate should return server config on successful auth', async () => {
      const mockResponse = {
        MediaContainer: {
          machineIdentifier: 'machine-123',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.authenticate('testuser', 'plex-token');

      expect(result.userId).toBe('machine-123');
      expect(result.token).toBe('plex-token');
      expect(result.username).toBe('testuser');
    });

    it('authenticate should throw error on failed auth', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(client.authenticate('testuser', 'wrong-token')).rejects.toThrow();
    });

    it('getLibraries should return libraries array', async () => {
      const mockResponse = {
        MediaContainer: {
          Directory: [
            { key: '1', title: 'Movies', type: 'movie' },
            { key: '2', title: 'TV Shows', type: 'show' },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getLibraries();

      expect(result).toHaveLength(2);
      expect(result[0].Name).toBe('Movies');
    });

    it('getVideos should return video response', async () => {
      const mockResponse = {
        MediaContainer: {
          Metadata: [
            { ratingKey: '1', title: 'Video 1', type: 'movie', duration: 100000 },
            { ratingKey: '2', title: 'Video 2', type: 'movie', duration: 200000 },
          ],
          totalSize: 2,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getVideos(
        '1',
        { Id: '1', Name: 'Movies', CollectionType: 'movie' },
        'latest',
        0,
        10,
        'both'
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('searchItems should return search results', async () => {
      const mockResponse = {
        MediaContainer: {
          Metadata: [{ ratingKey: '1', title: 'Test Movie', type: 'movie' }],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchItems('test');

      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('Test Movie');
    });

    it('deleteItem should throw error as not supported', async () => {
      await expect(client.deleteItem('item123')).rejects.toThrow();
    });

    it('getSubtitleTracks should return subtitle tracks', async () => {
      const mockResponse = {
        MediaContainer: {
          Metadata: [
            {
              Media: [
                {
                  Part: [
                    {
                      Stream: [
                        {
                          id: 's1',
                          streamType: 3,
                          displayTitle: 'English',
                          languageCode: 'eng',
                          default: true,
                        },
                        { id: 's2', streamType: 3, displayTitle: 'Chinese', languageCode: 'chi' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSubtitleTracks('item123');

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('English');
    });
  });
});

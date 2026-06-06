import { describe, it, expect, vi } from 'vitest';
import { isFolderType, calculatePlaybackProgress, isTVDevice, isIOSSafari } from '../media';
import type { EmbyItem } from '../../types';

describe('media utils', () => {
  describe('isFolderType', () => {
    it('should return true for Series type', () => {
      const item = { Type: 'Series' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for Season type', () => {
      const item = { Type: 'Season' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for Folder type', () => {
      const item = { Type: 'Folder' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for CollectionFolder type', () => {
      const item = { Type: 'CollectionFolder' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for BoxSet type', () => {
      const item = { Type: 'BoxSet' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for lowercase folder types', () => {
      const item = { Type: 'series' } as EmbyItem;
      expect(isFolderType(item)).toBe(true);
    });

    it('should return false for Movie type', () => {
      const item = { Type: 'Movie' } as EmbyItem;
      expect(isFolderType(item)).toBe(false);
    });

    it('should return false for Episode type', () => {
      const item = { Type: 'Episode' } as EmbyItem;
      expect(isFolderType(item)).toBe(false);
    });

    it('should return false when Type is undefined', () => {
      const item = {} as EmbyItem;
      expect(isFolderType(item)).toBe(false);
    });

    it('should return false when Type is empty string', () => {
      const item = { Type: '' } as EmbyItem;
      expect(isFolderType(item)).toBe(false);
    });
  });

  describe('calculatePlaybackProgress', () => {
    it('should return 0 when both values are undefined', () => {
      expect(calculatePlaybackProgress()).toBe(0);
    });

    it('should return 0 when playbackPositionTicks is undefined', () => {
      expect(calculatePlaybackProgress(undefined, 1000)).toBe(0);
    });

    it('should return 0 when runTimeTicks is undefined', () => {
      expect(calculatePlaybackProgress(500)).toBe(0);
    });

    it('should return 0 when runTimeTicks is 0', () => {
      expect(calculatePlaybackProgress(500, 0)).toBe(0);
    });

    it('should calculate 50% progress correctly', () => {
      expect(calculatePlaybackProgress(50, 100)).toBe(50);
    });

    it('should calculate 25% progress correctly', () => {
      expect(calculatePlaybackProgress(25, 100)).toBe(25);
    });

    it('should round to nearest integer', () => {
      expect(calculatePlaybackProgress(33, 100)).toBe(33);
    });

    it('should cap at 100% when progress exceeds 100', () => {
      expect(calculatePlaybackProgress(150, 100)).toBe(100);
    });

    it('should handle large tick values correctly', () => {
      expect(calculatePlaybackProgress(5000000000, 10000000000)).toBe(50);
    });
  });

  describe('isTVDevice', () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('should return true when userAgent contains tv', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'SmartTV/1.0',
        configurable: true,
      });
      expect(isTVDevice()).toBe(true);
    });

    it('should return true when userAgent contains googletv', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'GoogleTV/1.0',
        configurable: true,
      });
      expect(isTVDevice()).toBe(true);
    });

    it('should return true when userAgent contains smarttv', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'SmartTV/1.0',
        configurable: true,
      });
      expect(isTVDevice()).toBe(true);
    });

    it('should return false for regular browser userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      expect(isTVDevice()).toBe(false);
    });

    it('should be case insensitive', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'TV-Browser/1.0',
        configurable: true,
      });
      expect(isTVDevice()).toBe(true);
    });
  });

  describe('isIOSSafari', () => {
    const originalUserAgent = navigator.userAgent;
    const originalWindow = { ...window };

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
      (window as any).MSStream = undefined;
    });

    it('should return true for iPhone Safari userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isIOSSafari()).toBe(true);
    });

    it('should return true for iPad Safari userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isIOSSafari()).toBe(true);
    });

    it('should return false for Chrome on iOS', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.83 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isIOSSafari()).toBe(false);
    });

    it('should return false for Windows browser', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });
      expect(isIOSSafari()).toBe(false);
    });

    it('should return false when MSStream is present', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });
      (window as any).MSStream = {};
      expect(isIOSSafari()).toBe(false);
    });
  });
});

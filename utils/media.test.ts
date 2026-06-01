import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFolderType, calculatePlaybackProgress, isTVDevice, isIOSSafari } from './media';
import type { EmbyItem } from '../types';

describe('media utils', () => {
  describe('isFolderType', () => {
    it('should return true for Series type', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Series',
        Type: 'Series',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for Season type', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Season',
        Type: 'Season',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for Folder type', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Folder',
        Type: 'Folder',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for CollectionFolder type', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Collection',
        Type: 'CollectionFolder',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for BoxSet type', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Box Set',
        Type: 'BoxSet',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return true for lowercase types', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Series',
        Type: 'series',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(true);
    });

    it('should return false for non-folder types', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Movie',
        Type: 'Movie',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(false);
    });

    it('should return false when Type is missing', () => {
      const item: EmbyItem = {
        Id: '1',
        Name: 'Test Item',
        Type: '',
        MediaType: 'Video',
      };
      expect(isFolderType(item)).toBe(false);
    });
  });

  describe('calculatePlaybackProgress', () => {
    it('should return 0 when playbackPositionTicks is undefined', () => {
      expect(calculatePlaybackProgress(undefined, 1000000000)).toBe(0);
    });

    it('should return 0 when runTimeTicks is undefined', () => {
      expect(calculatePlaybackProgress(500000000, undefined)).toBe(0);
    });

    it('should return 0 when runTimeTicks is 0', () => {
      expect(calculatePlaybackProgress(500000000, 0)).toBe(0);
    });

    it('should calculate 50% progress', () => {
      expect(calculatePlaybackProgress(500000000, 1000000000)).toBe(50);
    });

    it('should calculate 25% progress', () => {
      expect(calculatePlaybackProgress(250000000, 1000000000)).toBe(25);
    });

    it('should calculate 75% progress', () => {
      expect(calculatePlaybackProgress(750000000, 1000000000)).toBe(75);
    });

    it('should round to nearest integer', () => {
      expect(calculatePlaybackProgress(333333333, 1000000000)).toBe(33);
      expect(calculatePlaybackProgress(666666666, 1000000000)).toBe(67);
    });

    it('should not exceed 100%', () => {
      expect(calculatePlaybackProgress(1500000000, 1000000000)).toBe(100);
    });
  });

  describe('isTVDevice', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should return true when userAgent includes tv', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (TV; Android) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isTVDevice()).toBe(true);
    });

    it('should return false when userAgent does not include tv', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isTVDevice()).toBe(false);
    });
  });

  describe('isIOSSafari', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should return true for iPhone Safari', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      (window as any).MSStream = undefined;
      expect(isIOSSafari()).toBe(true);
    });

    it('should return true for iPad Safari', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      (window as any).MSStream = undefined;
      expect(isIOSSafari()).toBe(true);
    });

    it('should return false for Chrome on iOS', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) CriOS/120.0.6099.83 Mobile/15E148',
        configurable: true,
      });
      (window as any).MSStream = undefined;
      expect(isIOSSafari()).toBe(false);
    });

    it('should return false for non-iOS devices', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isIOSSafari()).toBe(false);
    });
  });
});

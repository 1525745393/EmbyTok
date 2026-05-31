import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isMobile, isLandscape } from './device';

describe('device utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isMobile', () => {
    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      expect(isMobile()).toBe(false);
      global.window = originalWindow;
    });

    it('should return true for Android userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPhone userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPad userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return false for desktop userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isMobile()).toBe(false);
    });
  });

  describe('isLandscape', () => {
    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      expect(isLandscape()).toBe(false);
      global.window = originalWindow;
    });

    it('should return true when width > height', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1080,
        configurable: true,
      });
      expect(isLandscape()).toBe(true);
    });

    it('should return false when width < height', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1080,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1920,
        configurable: true,
      });
      expect(isLandscape()).toBe(false);
    });

    it('should return false when width === height', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        configurable: true,
      });
      expect(isLandscape()).toBe(false);
    });
  });
});

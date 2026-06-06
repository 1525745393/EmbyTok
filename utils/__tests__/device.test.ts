import { describe, it, expect, vi } from 'vitest';
import { isMobile, isLandscape } from '../device';

describe('device utils', () => {
  describe('isMobile', () => {
    const originalUserAgent = navigator.userAgent;
    const originalWindow = typeof window !== 'undefined' ? window : undefined;

    afterEach(() => {
      vi.restoreAllMocks();
      if (originalWindow) {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: originalUserAgent,
          configurable: true,
        });
      }
    });

    it('should return false when window is undefined', () => {
      const originalWindow = (global as any).window;
      delete (global as any).window;
      expect(isMobile()).toBe(false);
      (global as any).window = originalWindow;
    });

    it('should return true for Android userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPhone userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPad userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return false for desktop browser userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });
      expect(isMobile()).toBe(false);
    });

    it('should be case insensitive', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'mozilla/5.0 (linux; android 10; sm-g970f) applewebkit/537.36',
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });
  });

  describe('isLandscape', () => {
    const originalWindow = typeof window !== 'undefined' ? { ...window } : undefined;

    afterEach(() => {
      vi.restoreAllMocks();
      if (originalWindow) {
        Object.defineProperty(window, 'innerWidth', {
          value: originalWindow.innerWidth,
          configurable: true,
        });
        Object.defineProperty(window, 'innerHeight', {
          value: originalWindow.innerHeight,
          configurable: true,
        });
      }
    });

    it('should return false when window is undefined', () => {
      const originalWindow = (global as any).window;
      delete (global as any).window;
      expect(isLandscape()).toBe(false);
      (global as any).window = originalWindow;
    });

    it('should return true when width is greater than height', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      expect(isLandscape()).toBe(true);
    });

    it('should return false when width is less than height', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1080, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1920, configurable: true });
      expect(isLandscape()).toBe(false);
    });

    it('should return false when width equals height', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
      expect(isLandscape()).toBe(false);
    });
  });
});

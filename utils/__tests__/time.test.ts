import { describe, it, expect } from 'vitest';
import { formatTimeText, formatTime } from '../time';

describe('time utils', () => {
  describe('formatTimeText', () => {
    it('should return empty string when ticks is undefined', () => {
      expect(formatTimeText()).toBe('');
    });

    it('should format 60 seconds as 1 minute', () => {
      expect(formatTimeText(600000000)).toBe('1 分钟');
    });

    it('should format 120 seconds as 2 minutes', () => {
      expect(formatTimeText(1200000000)).toBe('2 分钟');
    });

    it('should format 1800 seconds as 30 minutes', () => {
      expect(formatTimeText(18000000000)).toBe('30 分钟');
    });

    it('should format 3600 seconds as 60 minutes', () => {
      expect(formatTimeText(36000000000)).toBe('60 分钟');
    });

    it('should round to nearest minute', () => {
      expect(formatTimeText(850000000)).toBe('1 分钟');
    });

    it('should handle large tick values', () => {
      expect(formatTimeText(360000000000)).toBe('600 分钟');
    });
  });

  describe('formatTime', () => {
    it('should return empty string when ticks is undefined', () => {
      expect(formatTime()).toBe('');
    });

    it('should format 60 seconds as 1m', () => {
      expect(formatTime(600000000)).toBe('1m');
    });

    it('should format 120 seconds as 2m', () => {
      expect(formatTime(1200000000)).toBe('2m');
    });

    it('should format 1800 seconds as 30m', () => {
      expect(formatTime(18000000000)).toBe('30m');
    });

    it('should format 3600 seconds as 60m', () => {
      expect(formatTime(36000000000)).toBe('60m');
    });

    it('should round to nearest minute', () => {
      expect(formatTime(850000000)).toBe('1m');
    });

    it('should handle large tick values', () => {
      expect(formatTime(360000000000)).toBe('600m');
    });
  });
});

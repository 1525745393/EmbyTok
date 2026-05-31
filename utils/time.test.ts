import { describe, it, expect } from 'vitest';
import { formatTimeText, formatTime } from './time';

describe('time utils', () => {
  describe('formatTimeText', () => {
    it('should return empty string when ticks is undefined', () => {
      expect(formatTimeText()).toBe('');
    });

    it('should return empty string when ticks is 0', () => {
      expect(formatTimeText(0)).toBe('');
    });

    it('should format ticks to minutes in Chinese', () => {
      expect(formatTimeText(600000000)).toBe('1 分钟');
      expect(formatTimeText(1200000000)).toBe('2 分钟');
      expect(formatTimeText(72000000000)).toBe('120 分钟');
    });

    it('should round to nearest minute', () => {
      expect(formatTimeText(599999999)).toBe('1 分钟');
      expect(formatTimeText(600000001)).toBe('1 分钟');
    });
  });

  describe('formatTime', () => {
    it('should return empty string when ticks is undefined', () => {
      expect(formatTime()).toBe('');
    });

    it('should return empty string when ticks is 0', () => {
      expect(formatTime(0)).toBe('');
    });

    it('should format ticks to minutes with "m" suffix', () => {
      expect(formatTime(600000000)).toBe('1m');
      expect(formatTime(1200000000)).toBe('2m');
      expect(formatTime(72000000000)).toBe('120m');
    });

    it('should round to nearest minute', () => {
      expect(formatTime(599999999)).toBe('1m');
      expect(formatTime(600000001)).toBe('1m');
    });
  });
});

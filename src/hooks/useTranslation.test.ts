import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from './useTranslation';

// 模拟 translations
vi.mock('../locales', () => ({
  translations: {
    zh: {
      language: '中文',
      login: {
        title: '登录',
        username: '用户名',
        password: '密码',
        submit: '提交',
        serverUrl: '服务器地址',
      },
    },
    en: {
      language: 'English',
      login: {
        title: 'Login',
        username: 'Username',
        password: 'Password',
        submit: 'Submit',
        serverUrl: 'Server URL',
      },
    },
  },
  Language: {
    zh: 'zh',
    en: 'en',
  },
  Translations: {},
}));

describe('useTranslation hook', () => {
  const LANGUAGE_KEY = 'embyLanguage';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default language (zh)', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.language).toBe('zh');
    });

    it('should load language from localStorage if available', () => {
      localStorage.setItem(LANGUAGE_KEY, 'en');

      const { result } = renderHook(() => useTranslation());

      expect(result.current.language).toBe('en');
    });

    it('should fall back to default for invalid localStorage value', () => {
      localStorage.setItem(LANGUAGE_KEY, 'invalid');

      const { result } = renderHook(() => useTranslation());

      expect(result.current.language).toBe('zh');
    });

    it('should return translations object', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t).toBeDefined();
      expect(result.current.t).toHaveProperty('language');
      expect(result.current.t).toHaveProperty('login');
    });
  });

  describe('toggleLanguage', () => {
    it('should toggle language from zh to en', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.language).toBe('zh');

      act(() => {
        result.current.toggleLanguage();
      });

      expect(result.current.language).toBe('en');
    });

    it('should toggle language from en to zh', () => {
      localStorage.setItem(LANGUAGE_KEY, 'en');

      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.toggleLanguage();
      });

      expect(result.current.language).toBe('zh');
    });

    it('should save toggled language to localStorage', () => {
      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.toggleLanguage();
      });

      expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    });
  });

  describe('setLanguage', () => {
    it('should set language directly to en', () => {
      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
      expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    });

    it('should set language directly to zh', () => {
      localStorage.setItem(LANGUAGE_KEY, 'en');

      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.setLanguage('zh');
      });

      expect(result.current.language).toBe('zh');
      expect(localStorage.getItem(LANGUAGE_KEY)).toBe('zh');
    });

    it('should update translations when language changes', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t.language).toBe('中文');

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.t.language).toBe('English');
    });
  });

  describe('returned API', () => {
    it('should have all required properties', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current).toHaveProperty('language');
      expect(result.current).toHaveProperty('t');
      expect(result.current).toHaveProperty('toggleLanguage');
      expect(result.current).toHaveProperty('setLanguage');
    });

    it('should have functions of correct type', () => {
      const { result } = renderHook(() => useTranslation());

      expect(typeof result.current.language).toBe('string');
      expect(typeof result.current.t).toBe('object');
      expect(typeof result.current.toggleLanguage).toBe('function');
      expect(typeof result.current.setLanguage).toBe('function');
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation', () => {
  const LANGUAGE_KEY = 'embyLanguage';

  beforeEach(() => {
    localStorage.clear();
  });

  it('应该默认使用中文', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('zh');
    expect(result.current.t.login.chinese).toBe('中文');
  });

  it('应该从 localStorage 加载已保存的语言', () => {
    localStorage.setItem(LANGUAGE_KEY, 'en');

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('en');
    expect(result.current.t.login.english).toBe('English');
  });

  it('应该忽略无效的 localStorage 语言值', () => {
    localStorage.setItem(LANGUAGE_KEY, 'invalid_lang');

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('zh');
  });

  it('应该切换语言', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('zh');

    act(() => {
      result.current.toggleLanguage();
    });

    expect(result.current.language).toBe('en');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    expect(result.current.t.login.english).toBe('English');

    act(() => {
      result.current.toggleLanguage();
    });

    expect(result.current.language).toBe('zh');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('zh');
  });

  it('应该直接设置语言', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('zh');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');

    act(() => {
      result.current.setLanguage('zh');
    });

    expect(result.current.language).toBe('zh');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('zh');
  });

  it('应该正确返回翻译对象', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t.videoCard.mediaType).toBe('视频');
    expect(result.current.t.login.submit).toBe('立即连接');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.t.videoCard.mediaType).toBe('Video');
    expect(result.current.t.login.submit).toBe('Connect Now');
  });

  it('应该在 localStorage 访问失败时优雅降级', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('zh');

    act(() => {
      result.current.toggleLanguage();
    });

    expect(result.current.language).toBe('en');

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});

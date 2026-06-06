import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from '../useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 'initialValue'));

    expect(result.current[0]).toBe('initialValue');
  });

  it('should initialize with function initial value', () => {
    const { result } = renderHook(() =>
      useLocalStorageState('testKey', () => 'functionInitialValue')
    );

    expect(result.current[0]).toBe('functionInitialValue');
  });

  it('should read existing value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('savedValue'));

    const { result } = renderHook(() => useLocalStorageState('testKey', 'initialValue'));

    expect(result.current[0]).toBe('savedValue');
  });

  it('should update state and localStorage when setState is called', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 'initialValue'));

    act(() => {
      result.current[1]('newValue');
    });

    expect(result.current[0]).toBe('newValue');
    expect(localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
  });

  it('should update state with function updater', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('testKey')).toBe(JSON.stringify(1));
  });

  it('should handle objects correctly', () => {
    const initialObject = { key: 'value' };
    const { result } = renderHook(() => useLocalStorageState('testKey', initialObject));

    expect(result.current[0]).toEqual(initialObject);

    act(() => {
      result.current[1]({ key: 'newValue' });
    });

    expect(result.current[0]).toEqual({ key: 'newValue' });
  });

  it('should handle arrays correctly', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorageState('testKey', initialArray));

    expect(result.current[0]).toEqual(initialArray);

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('should fall back to initial value when localStorage has invalid JSON', () => {
    localStorage.setItem('testKey', '{invalid-json}');

    const { result } = renderHook(() => useLocalStorageState('testKey', 'fallbackValue'));

    expect(result.current[0]).toBe('fallbackValue');
  });

  it('should use different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorageState('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorageState('key2', 'value2'));

    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');

    act(() => {
      result1.current[1]('newValue1');
    });

    expect(result1.current[0]).toBe('newValue1');
    expect(result2.current[0]).toBe('value2');
  });
});

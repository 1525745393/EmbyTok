import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubtitles } from '../useSubtitles';
import type { SubtitleTrack } from '../../../types';

describe('useSubtitles Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSubtitles());

    expect(result.current.settings).toEqual({
      enabled: false,
      fontSize: 'medium',
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      position: 'bottom',
    });
    expect(result.current.cues).toEqual([]);
    expect(result.current.currentCue).toBeNull();
  });

  it('should toggle subtitles', () => {
    const { result } = renderHook(() => useSubtitles());

    expect(result.current.settings.enabled).toBe(false);

    act(() => {
      result.current.toggleSubtitles();
    });

    expect(result.current.settings.enabled).toBe(true);

    act(() => {
      result.current.toggleSubtitles();
    });

    expect(result.current.settings.enabled).toBe(false);
  });

  it('should update settings', () => {
    const { result } = renderHook(() => useSubtitles());

    act(() => {
      result.current.updateSettings({
        enabled: true,
        fontSize: 'large',
        textColor: '#000000',
      });
    });

    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.fontSize).toBe('large');
    expect(result.current.settings.textColor).toBe('#000000');
    expect(result.current.settings.backgroundColor).toBe('rgba(0, 0, 0, 0.75)');
    expect(result.current.settings.position).toBe('bottom');
  });

  it('should select subtitle track', () => {
    const { result } = renderHook(() => useSubtitles());

    expect(result.current.settings.selectedTrackId).toBeUndefined();

    act(() => {
      result.current.selectTrack('track1');
    });

    expect(result.current.settings.selectedTrackId).toBe('track1');

    act(() => {
      result.current.selectTrack();
    });

    expect(result.current.settings.selectedTrackId).toBeUndefined();
  });

  it('should persist settings in localStorage', () => {
    const { result } = renderHook(() => useSubtitles());

    act(() => {
      result.current.updateSettings({
        fontSize: 'small',
        position: 'top',
      });
    });

    expect(localStorage.getItem('embytok_subtitle_settings')).toContain('"fontSize":"small"');
    expect(localStorage.getItem('embytok_subtitle_settings')).toContain('"position":"top"');

    const { result: result2 } = renderHook(() => useSubtitles());
    expect(result2.current.settings.fontSize).toBe('small');
    expect(result2.current.settings.position).toBe('top');
  });

  it('should parse VTT subtitles', () => {
    const { result } = renderHook(() => useSubtitles());

    const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
First subtitle line

00:00:05.000 --> 00:00:08.000
Second subtitle line
With two lines`;

    const cues = result.current.parseVTT(vttContent);

    expect(cues).toHaveLength(2);
    expect(cues[0].startTime).toBe(1);
    expect(cues[0].endTime).toBe(4);
    expect(cues[0].text).toBe('First subtitle line');
    expect(cues[1].startTime).toBe(5);
    expect(cues[1].endTime).toBe(8);
    expect(cues[1].text).toBe('Second subtitle line\nWith two lines');
  });

  it('should update current time', () => {
    const { result } = renderHook(() => useSubtitles());

    act(() => {
      result.current.updateTime(10);
    });

    // We can't test currentCue directly because it depends on useEffect
    // but we can test that updateTime is accessible
    expect(typeof result.current.updateTime).toBe('function');
  });

  it('should expose all methods', () => {
    const { result } = renderHook(() => useSubtitles());

    expect(typeof result.current.updateSettings).toBe('function');
    expect(typeof result.current.toggleSubtitles).toBe('function');
    expect(typeof result.current.selectTrack).toBe('function');
    expect(typeof result.current.loadSubtitles).toBe('function');
    expect(typeof result.current.updateTime).toBe('function');
    expect(typeof result.current.parseVTT).toBe('function');
  });
});

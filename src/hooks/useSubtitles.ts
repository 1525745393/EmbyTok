import { useState, useCallback, useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { SubtitleSettings, SubtitleCue, SubtitleTrack } from '../../types';

const SUBTITLE_SETTINGS_KEY = 'embytok_subtitle_settings';

const DEFAULT_SETTINGS: SubtitleSettings = {
  enabled: false,
  fontSize: 'medium',
  textColor: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  position: 'bottom',
};

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  let seconds = 0;

  if (parts.length === 3) {
    seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }

  return seconds;
};

export function useSubtitles() {
  const [settings, setSettings] = useLocalStorageState<SubtitleSettings>(
    SUBTITLE_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const updateSettings = useCallback(
    (newSettings: Partial<SubtitleSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings]
  );

  const toggleSubtitles = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, [setSettings]);

  const selectTrack = useCallback(
    (trackId?: string) => {
      setSettings((prev) => ({ ...prev, selectedTrackId: trackId }));
    },
    [setSettings]
  );

  const parseVTT = useCallback((content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    let i = 0;

    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map((s) => s.trim());
        const startTime = parseTime(startStr);
        const endTime = parseTime(endStr);

        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += (text ? '\n' : '') + lines[i].trim();
          i++;
        }

        if (text) {
          cues.push({ startTime, endTime, text });
        }
      }

      i++;
    }

    return cues;
  }, []);

  const loadSubtitles = useCallback(
    async (track?: SubtitleTrack) => {
      if (!track?.url) {
        setCues([]);
        return;
      }

      try {
        const response = await fetch(track.url);
        const content = await response.text();
        const parsedCues = parseVTT(content);
        setCues(parsedCues);
      } catch (error) {
        console.error('Failed to load subtitles:', error);
        setCues([]);
      }
    },
    [parseVTT]
  );

  const updateTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    if (!settings.enabled || cues.length === 0) {
      setCurrentCue(null);
      return;
    }

    const activeCue = cues.find(
      (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
    );

    setCurrentCue(activeCue || null);
  }, [currentTime, cues, settings.enabled]);

  return {
    settings,
    cues,
    currentCue,
    updateSettings,
    toggleSubtitles,
    selectTrack,
    loadSubtitles,
    updateTime,
    parseVTT,
  };
}

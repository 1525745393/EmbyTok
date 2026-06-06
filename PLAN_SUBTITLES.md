# 字幕支持功能 Implementation Plan

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的字幕支持功能，包括字幕轨道检测、字幕显示、字幕设置（字体大小、颜色、位置）等

**Architecture:**

- 更新类型定义添加字幕相关类型
- 创建 `useSubtitles` Hook 管理字幕状态
- 创建字幕控件组件 `SubtitleControls`
- 创建字幕渲染组件 `SubtitleRenderer`
- 集成到 VideoCard 组件中
- 更新 EmbyClient 添加获取字幕轨道的方法

**Tech Stack:** React 18, TypeScript, HTML5 Video TextTrack API

---

## 任务分解

### Task 1: 更新类型定义

**Files:**

- Modify: `types.ts`

- [ ] **Step 1: 添加字幕相关类型**

在 types.ts 文件末尾添加：

```typescript
export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isDefault: boolean;
  format: 'srt' | 'vtt' | 'ass';
  url?: string;
  codec?: string;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  selectedTrackId: string | null;
  fontSize: number; // 12-36
  fontColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top';
  opacity: number; // 0-1
}
```

- [ ] **Step 2: 验证类型定义**

```bash
npm run build
```

Expected: 无类型错误

---

### Task 2: 更新 EmbyClient 添加字幕 API

**Files:**

- Modify: `services/EmbyClient.ts`

- [ ] **Step 1: 添加获取字幕轨道的方法**

在 EmbyClient 类中添加：

```typescript
async getSubtitleTracks(itemId: string): Promise&lt;SubtitleTrack[]&gt; {
  const params = new URLSearchParams({
    UserId: this.config.userId,
    ItemId: itemId
  });

  const response = await fetch(
    `${this.getCleanUrl()}/Videos/${itemId}/PlaybackInfo?${params.toString()}`,
    { headers: this.getHeaders() }
  );

  if (!response.ok) {
    throw new Error('Failed to get subtitle tracks');
  }

  const data = await response.json();

  // 解析字幕轨道
  const tracks: SubtitleTrack[] = [];

  if (data.MediaSources &amp;&amp; data.MediaSources.length &gt; 0) {
    const mediaSource = data.MediaSources[0];

    if (mediaSource.MediaStreams) {
      mediaSource.MediaStreams.forEach((stream: any, index: number) =&gt; {
        if (stream.Type === 'Subtitle') {
          tracks.push({
            id: `subtitle_${index}`,
            label: stream.DisplayTitle || stream.Language || `Subtitle ${index + 1}`,
            language: stream.Language || 'und',
            isDefault: stream.IsDefault || false,
            format: stream.Codec || 'vtt',
            // 如果有外部字幕 URL，构建它
            url: stream.IsExternal
              ? `${this.getCleanUrl()}/Videos/${itemId}/${stream.Index}/Subtitles/0/Stream.${stream.Codec === 'srt' ? 'srt' : 'vtt'}`
              : undefined
          });
        }
      });
    }
  }

  return tracks;
}

async getSubtitleContent(itemId: string, subtitleIndex: number): Promise&lt;string&gt; {
  const response = await fetch(
    `${this.getCleanUrl()}/Videos/${itemId}/${subtitleIndex}/Subtitles/0/Stream.vtt`,
    { headers: this.getHeaders() }
  );

  if (!response.ok) {
    throw new Error('Failed to get subtitle content');
  }

  return response.text();
}
```

- [ ] **Step 2: 验证代码**

```bash
npm run build
```

Expected: 构建成功

---

### Task 3: 创建 useSubtitles Hook

**Files:**

- Create: `src/hooks/useSubtitles.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: 创建 useSubtitles Hook**

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
import { SubtitleTrack, SubtitleSettings, SubtitleCue } from '../../types';
import { useLocalStorageState } from './useLocalStorageState';

const SUBTITLE_SETTINGS_KEY = 'embytok_subtitle_settings';

const DEFAULT_SETTINGS: SubtitleSettings = {
  enabled: false,
  selectedTrackId: null,
  fontSize: 18,
  fontColor: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  position: 'bottom',
  opacity: 1
};

export function useSubtitles() {
  const [settings, setSettings] = useLocalStorageState&lt;SubtitleSettings&gt;(
    SUBTITLE_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const [currentCues, setCurrentCues] = useState&lt;SubtitleCue[]&gt;([]);
  const [currentCue, setCurrentCue] = useState&lt;SubtitleCue | null&gt;(null);
  const videoTimeRef = useRef(0);

  // 更新字幕设置
  const updateSetting = useCallback(&lt;K extends keyof SubtitleSettings&gt;(
    key: K,
    value: SubtitleSettings[K]
  ) =&gt; {
    setSettings(prev =&gt; ({ ...prev, [key]: value }));
  }, [setSettings]);

  // 切换字幕启用状态
  const toggleEnabled = useCallback(() =&gt; {
    setSettings(prev =&gt; ({ ...prev, enabled: !prev.enabled }));
  }, [setSettings]);

  // 选择字幕轨道
  const selectTrack = useCallback((trackId: string | null) =&gt; {
    setSettings(prev =&gt; ({
      ...prev,
      selectedTrackId: trackId,
      enabled: trackId !== null
    }));
  }, [setSettings]);

  // 解析 VTT 字幕内容
  const parseVTT = useCallback((content: string): SubtitleCue[] =&gt; {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    let i = 0;

    // 跳过 WEBVTT 头部
    while (i &lt; lines.length &amp;&amp; !lines[i].includes('--&gt;')) {
      i++;
    }

    while (i &lt; lines.length) {
      const line = lines[i].trim();

      // 检查是否是时间戳行
      if (line.includes('--&gt;')) {
        const [startStr, endStr] = line.split('--&gt;').map(s =&gt; s.trim());

        // 解析时间（格式：HH:MM:SS.mmm）
        const parseTime = (timeStr: string): number =&gt; {
          const parts = timeStr.split(':');
          let seconds = 0;

          if (parts.length === 3) {
            seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60;
            const secParts = parts[2].split('.');
            seconds += parseInt(secParts[0]);
            if (secParts[1]) {
              seconds += parseInt(secParts[1]) / 1000;
            }
          } else if (parts.length === 2) {
            seconds = parseInt(parts[0]) * 60;
            const secParts = parts[1].split('.');
            seconds += parseInt(secParts[0]);
            if (secParts[1]) {
              seconds += parseInt(secParts[1]) / 1000;
            }
          }

          return seconds;
        };

        const startTime = parseTime(startStr);
        const endTime = parseTime(endStr);

        // 收集字幕文本（直到空行）
        i++;
        let text = '';
        while (i &lt; lines.length &amp;&amp; lines[i].trim() !== '') {
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

  // 加载字幕内容
  const loadSubtitles = useCallback(async (
    getContent: () =&gt; Promise&lt;string&gt;
  ) =&gt; {
    try {
      const content = await getContent();
      const cues = parseVTT(content);
      setCurrentCues(cues);
    } catch (error) {
      console.error('Failed to load subtitles:', error);
      setCurrentCues([]);
    }
  }, [parseVTT]);

  // 根据视频时间更新当前字幕
  const updateCurrentCue = useCallback((currentTime: number) =&gt; {
    videoTimeRef.current = currentTime;

    const cue = currentCues.find(
      c =&gt; currentTime &gt;= c.startTime &amp;&amp; currentTime &lt;= c.endTime
    ) || null;

    setCurrentCue(cue);
  }, [currentCues]);

  // 重置字幕
  const reset = useCallback(() =&gt; {
    setCurrentCues([]);
    setCurrentCue(null);
  }, []);

  return {
    settings,
    updateSetting,
    toggleEnabled,
    selectTrack,
    loadSubtitles,
    updateCurrentCue,
    reset,
    currentCues,
    currentCue
  };
}
```

- [ ] **Step 2: 导出新 Hook**

修改 `src/hooks/index.ts`，添加：

```typescript
export { useSubtitles } from './useSubtitles';
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

---

### Task 4: 创建字幕控件组件

**Files:**

- Create: `components/SubtitleControls.tsx`

- [ ] **Step 1: 创建 SubtitleControls 组件**

```typescript
import React from 'react';
import { SubtitleTrack, SubtitleSettings } from '../types';
import { X, Check, Settings, Type, Palette, ArrowUp, ArrowDown } from 'lucide-react';

interface SubtitleControlsProps {
  tracks: SubtitleTrack[];
  settings: SubtitleSettings;
  onSelectTrack: (trackId: string | null) =&gt; void;
  onUpdateSetting: &lt;K extends keyof SubtitleSettings&gt;(
    key: K,
    value: SubtitleSettings[K]
  ) =&gt; void;
  onClose: () =&gt; void;
  language: 'zh' | 'en';
}

const t = {
  zh: {
    title: '字幕设置',
    off: '关闭',
    fontSize: '字体大小',
    fontColor: '字体颜色',
    backgroundColor: '背景颜色',
    position: '位置',
    top: '顶部',
    bottom: '底部',
    transparency: '透明度'
  },
  en: {
    title: 'Subtitle Settings',
    off: 'Off',
    fontSize: 'Font Size',
    fontColor: 'Font Color',
    backgroundColor: 'Background Color',
    position: 'Position',
    top: 'Top',
    bottom: 'Bottom',
    transparency: 'Transparency'
  }
};

export function SubtitleControls({
  tracks,
  settings,
  onSelectTrack,
  onUpdateSetting,
  onClose,
  language
}: SubtitleControlsProps) {
  const texts = t[language];
  const [showSettings, setShowSettings] = React.useState(false);

  const presetColors = [
    '#ffffff', // 白色
    '#ffff00', // 黄色
    '#00ff00', // 绿色
    '#00ffff', // 青色
    '#ff0000', // 红色
    '#ff00ff'  // 品红
  ];

  return (
    &lt;div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"&gt;
      &lt;div className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[80vh] overflow-y-auto"&gt;
        &lt;div className="flex items-center justify-between mb-6"&gt;
          &lt;h3 className="text-white font-bold text-lg"&gt;{texts.title}&lt;/h3&gt;
          &lt;button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white"
          &gt;
            &lt;X size={24} /&gt;
          &lt;/button&gt;
        &lt;/div&gt;

        {!showSettings ? (
          &lt;&gt;
            {/* 字幕轨道选择 */}
            &lt;div className="space-y-2 mb-4"&gt;
              &lt;button
                onClick={() =&gt; onSelectTrack(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  settings.selectedTrackId === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              &gt;
                {settings.selectedTrackId === null &amp;&amp; &lt;Check size={18} /&gt;}
                &lt;span className={settings.selectedTrackId === null ? '' : 'ml-7'}&gt;
                  {texts.off}
                &lt;/span&gt;
              &lt;/button&gt;

              {tracks.map(track =&gt; (
                &lt;button
                  key={track.id}
                  onClick={() =&gt; onSelectTrack(track.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    settings.selectedTrackId === track.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                &gt;
                  {settings.selectedTrackId === track.id &amp;&amp; &lt;Check size={18} /&gt;}
                  &lt;span className={settings.selectedTrackId === track.id ? '' : 'ml-7'}&gt;
                    {track.label}
                  &lt;/span&gt;
                  {track.isDefault &amp;&amp; (
                    &lt;span className="ml-auto text-xs text-indigo-300"&gt;默认&lt;/span&gt;
                  )}
                &lt;/button&gt;
              ))}
            &lt;/div&gt;

            {/* 设置按钮 */}
            {tracks.length &gt; 0 &amp;&amp; (
              &lt;button
                onClick={() =&gt; setShowSettings(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
              &gt;
                &lt;Settings size={18} /&gt;
                &lt;span&gt;{texts.title}&lt;/span&gt;
              &lt;/button&gt;
            )}
          &lt;/&gt;
        ) : (
          &lt;div className="space-y-6"&gt;
            {/* 返回按钮 */}
            &lt;button
              onClick={() =&gt; setShowSettings(false)}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            &gt;
              &lt;ArrowDown size={18} /&gt;
              &lt;span&gt;返回&lt;/span&gt;
            &lt;/button&gt;

            {/* 字体大小 */}
            &lt;div&gt;
              &lt;div className="flex items-center justify-between mb-2"&gt;
                &lt;span className="text-white/70"&gt;{texts.fontSize}&lt;/span&gt;
                &lt;span className="text-white"&gt;{settings.fontSize}px&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className="flex items-center gap-3"&gt;
                &lt;button
                  onClick={() =&gt; onUpdateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
                  className="p-2 bg-white/10 rounded-lg"
                &gt;
                  &lt;ArrowDown size={18} /&gt;
                &lt;/button&gt;
                &lt;div className="flex-1 h-2 bg-white/20 rounded-full"&gt;
                  &lt;div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{
                      width: `${((settings.fontSize - 12) / 24) * 100}%`
                    }}
                  /&gt;
                &lt;/div&gt;
                &lt;button
                  onClick={() =&gt; onUpdateSetting('fontSize', Math.min(36, settings.fontSize + 2))}
                  className="p-2 bg-white/10 rounded-lg"
                &gt;
                  &lt;ArrowUp size={18} /&gt;
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* 字体颜色 */}
            &lt;div&gt;
              &lt;span className="text-white/70 block mb-2"&gt;{texts.fontColor}&lt;/span&gt;
              &lt;div className="flex gap-2"&gt;
                {presetColors.map(color =&gt; (
                  &lt;button
                    key={color}
                    onClick={() =&gt; onUpdateSetting('fontColor', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      settings.fontColor === color ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  /&gt;
                ))}
              &lt;/div&gt;
            &lt;/div&gt;

            {/* 背景颜色/透明度 */}
            &lt;div&gt;
              &lt;div className="flex items-center justify-between mb-2"&gt;
                &lt;span className="text-white/70"&gt;{texts.transparency}&lt;/span&gt;
                &lt;span className="text-white"&gt;{Math.round(settings.opacity * 100)}%&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className="flex items-center gap-3"&gt;
                &lt;button
                  onClick={() =&gt; onUpdateSetting('opacity', Math.max(0, settings.opacity - 0.1))}
                  className="p-2 bg-white/10 rounded-lg"
                &gt;
                  &lt;ArrowDown size={18} /&gt;
                &lt;/button&gt;
                &lt;div className="flex-1 h-2 bg-white/20 rounded-full"&gt;
                  &lt;div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${settings.opacity * 100}%` }}
                  /&gt;
                &lt;/div&gt;
                &lt;button
                  onClick={() =&gt; onUpdateSetting('opacity', Math.min(1, settings.opacity + 0.1))}
                  className="p-2 bg-white/10 rounded-lg"
                &gt;
                  &lt;ArrowUp size={18} /&gt;
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* 位置 */}
            &lt;div&gt;
              &lt;span className="text-white/70 block mb-2"&gt;{texts.position}&lt;/span&gt;
              &lt;div className="flex gap-2"&gt;
                {(['top', 'bottom'] as const).map(pos =&gt; (
                  &lt;button
                    key={pos}
                    onClick={() =&gt; onUpdateSetting('position', pos)}
                    className={`flex-1 py-3 rounded-lg text-center transition-colors ${
                      settings.position === pos
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  &gt;
                    {pos === 'top' ? texts.top : texts.bottom}
                  &lt;/button&gt;
                ))}
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

export default SubtitleControls;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 5: 创建字幕渲染组件

**Files:**

- Create: `components/SubtitleRenderer.tsx`

- [ ] **Step 1: 创建 SubtitleRenderer 组件**

```typescript
import React from 'react';
import { SubtitleSettings, SubtitleCue } from '../types';

interface SubtitleRendererProps {
  cue: SubtitleCue | null;
  settings: SubtitleSettings;
}

export function SubtitleRenderer({ cue, settings }: SubtitleRendererProps) {
  if (!settings.enabled || !cue) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '800px',
    textAlign: 'center',
    zIndex: 10,
    pointerEvents: 'none'
  };

  if (settings.position === 'top') {
    containerStyle.top = '10%';
  } else {
    containerStyle.bottom = '15%';
  }

  const textStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}px`,
    color: settings.fontColor,
    backgroundColor: settings.backgroundColor.replace(
      /[\d.]+\)$/,
      `${settings.opacity})`
    ),
    padding: '8px 16px',
    borderRadius: '4px',
    display: 'inline-block',
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.4
  };

  return (
    &lt;div style={containerStyle}&gt;
      &lt;div style={textStyle}&gt;
        {cue.text.split('\n').map((line, index) =&gt; (
          &lt;React.Fragment key={index}&gt;
            {line}
            {index &lt; cue.text.split('\n').length - 1 &amp;&amp; &lt;br /&gt;}
          &lt;/React.Fragment&gt;
        ))}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

export default SubtitleRenderer;
```

- [ ] **Step 2: 验证组件代码**

```bash
npm run build
```

Expected: 无 TypeScript 错误

---

### Task 6: 集成字幕功能到 VideoCard

**Files:**

- Modify: `components/VideoCard.tsx`
- Modify: `src/locales/zh.ts`
- Modify: `src/locales/en.ts`

- [ ] **Step 1: 更新翻译文件**

在 `src/locales/zh.ts` 中添加字幕相关翻译：

```typescript
subtitles: {
  title: '字幕',
  off: '关闭',
  settings: '字幕设置',
  fontSize: '字体大小',
  fontColor: '字体颜色',
  backgroundColor: '背景颜色',
  position: '位置',
  top: '顶部',
  bottom: '底部',
  transparency: '透明度',
  noSubtitles: '无字幕'
}
```

在 `src/locales/en.ts` 中添加：

```typescript
subtitles: {
  title: 'Subtitles',
  off: 'Off',
  settings: 'Subtitle Settings',
  fontSize: 'Font Size',
  fontColor: 'Font Color',
  backgroundColor: 'Background Color',
  position: 'Position',
  top: 'Top',
  bottom: 'Bottom',
  transparency: 'Transparency',
  noSubtitles: 'No subtitles available'
}
```

- [ ] **Step 2: 导入字幕相关 Hook 和组件**

在 VideoCard.tsx 顶部添加：

```typescript
import { useSubtitles } from '../src/hooks/useSubtitles';
import { SubtitleControls } from './SubtitleControls';
import { SubtitleRenderer } from './SubtitleRenderer';
import { Captions } from 'lucide-react';
```

- [ ] **Step 3: 集成字幕 Hook**

在 VideoCard 组件内部添加：

```typescript
const {
  settings: subtitleSettings,
  updateSetting: updateSubtitleSetting,
  toggleEnabled: toggleSubtitles,
  selectTrack: selectSubtitleTrack,
  loadSubtitles,
  updateCurrentCue,
  currentCue
} = useSubtitles();

const [subtitleTracks, setSubtitleTracks] = useState&lt;SubtitleTrack[]&gt;([]);
const [showSubtitleControls, setShowSubtitleControls] = useState(false);
```

- [ ] **Step 4: 添加加载字幕轨道的逻辑**

添加 useEffect 来加载字幕轨道：

```typescript
useEffect(() =&gt; {
  if (client &amp;&amp; item.Id) {
    const loadTracks = async () =&gt; {
      try {
        const tracks = await client.getSubtitleTracks(item.Id);
        setSubtitleTracks(tracks);

        // 自动选择默认字幕
        const defaultTrack = tracks.find(t =&gt; t.isDefault);
        if (defaultTrack &amp;&amp; !subtitleSettings.selectedTrackId) {
          selectSubtitleTrack(defaultTrack.id);
        }
      } catch (error) {
        console.error('Failed to load subtitle tracks:', error);
      }
    };

    loadTracks();
  }
}, [client, item.Id]);

// 监听视频时间更新，同步字幕
useEffect(() =&gt; {
  if (isActive &amp;&amp; videoRef.current) {
    const timeUpdateHandler = () =&gt; {
      updateCurrentCue(videoRef.current!.currentTime);
    };

    videoRef.current.addEventListener('timeupdate', timeUpdateHandler);

    return () =&gt; {
      videoRef.current?.removeEventListener('timeupdate', timeUpdateHandler);
    };
  }
}, [isActive, updateCurrentCue]);
```

- [ ] **Step 5: 添加字幕按钮到 UI**

在右侧按钮区域添加字幕按钮：

```typescript
{/* 字幕按钮 */}
&lt;button
  onClick={() =&gt; setShowSubtitleControls(true)}
  className={`p-2 rounded-full transition-colors ${
    subtitleSettings.enabled ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
  }`}
&gt;
  &lt;Captions size={20} /&gt;
&lt;/button&gt;
```

- [ ] **Step 6: 添加字幕渲染器**

在视频容器内添加字幕渲染：

```typescript
{/* 字幕渲染 */}
&lt;SubtitleRenderer cue={currentCue} settings={subtitleSettings} /&gt;
```

- [ ] **Step 7: 添加字幕控件模态框**

在组件末尾添加字幕控件：

```typescript
{/* 字幕控件 */}
{showSubtitleControls &amp;&amp; (
  &lt;SubtitleControls
    tracks={subtitleTracks}
    settings={subtitleSettings}
    onSelectTrack={selectSubtitleTrack}
    onUpdateSetting={updateSubtitleSetting}
    onClose={() =&gt; setShowSubtitleControls(false)}
    language={language}
  /&gt;
)}
```

- [ ] **Step 8: 验证集成**

```bash
npm run build
```

Expected: 构建成功

---

### Task 7: 最终测试和验证

**Files:** All modified files

- [ ] **Step 1: 完整构建验证**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 功能测试清单**

- [ ] 可以检测到视频的字幕轨道
- [ ] 可以切换不同的字幕轨道
- [ ] 可以关闭字幕
- [ ] 可以调整字体大小
- [ ] 可以修改字体颜色
- [ ] 可以调整背景透明度
- [ ] 可以改变字幕位置（顶部/底部）
- [ ] 字幕能正确随视频时间显示
- [ ] 中英文切换正常
- [ ] 没有字幕时显示适当提示

---

## 实施完成检查

- [ ] 所有任务步骤完成
- [ ] 代码已提交
- [ ] 功能已测试验证
- [ ] 文档已更新

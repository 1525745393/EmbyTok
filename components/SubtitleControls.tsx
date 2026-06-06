import React, { useState } from 'react';
import { SubtitleTrack, SubtitleSettings } from '../types';
import { Subtitles, Settings, X, Check } from 'lucide-react';
import { useTranslation } from '../src/hooks';

interface SubtitleControlsProps {
  tracks: SubtitleTrack[];
  settings: SubtitleSettings;
  onToggleSubtitles: () => void;
  onSelectTrack: (trackId?: string) => void;
  onUpdateSettings: (settings: Partial<SubtitleSettings>) => void;
  onClose: () => void;
}

const SubtitleControls: React.FC<SubtitleControlsProps> = ({
  tracks,
  settings,
  onToggleSubtitles,
  onSelectTrack,
  onUpdateSettings,
  onClose,
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);

  const fontSizeOptions = [
    { value: 'small', label: t.subtitles?.small || '小' },
    { value: 'medium', label: t.subtitles?.medium || '中' },
    { value: 'large', label: t.subtitles?.large || '大' },
  ];

  const textColorOptions = [
    { value: '#FFFFFF', label: '白色' },
    { value: '#FFFF00', label: '黄色' },
    { value: '#00FF00', label: '绿色' },
    { value: '#00FFFF', label: '青色' },
    { value: '#FF0000', label: '红色' },
    { value: '#0000FF', label: '蓝色' },
  ];

  const positionOptions = [
    { value: 'bottom', label: t.subtitles?.bottom || '底部' },
    { value: 'top', label: t.subtitles?.top || '顶部' },
  ];

  return (
    <div className="absolute bottom-20 left-4 right-4 z-50">
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Subtitles size={20} className="text-white" />
            <span className="text-white font-medium">{t.subtitles?.select || '字幕'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!showSettings ? (
            <div className="p-2">
              <button
                onClick={() => {
                  onToggleSubtitles();
                  onSelectTrack(undefined);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  !settings.enabled
                    ? 'bg-indigo-600/20 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{t.subtitles?.off || '关闭'}</span>
                {!settings.enabled && <Check size={18} className="text-indigo-500" />}
              </button>

              <button
                onClick={() => {
                  if (!settings.enabled) {
                    onToggleSubtitles();
                  }
                  onSelectTrack(undefined);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  settings.enabled && !settings.selectedTrackId
                    ? 'bg-indigo-600/20 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{t.subtitles?.on || '开启'}</span>
                {settings.enabled && !settings.selectedTrackId && (
                  <Check size={18} className="text-indigo-500" />
                )}
              </button>

              {tracks.length > 0 && (
                <div className="mt-2">
                  <p className="text-zinc-500 text-xs px-4 py-2">可用字幕</p>
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        if (!settings.enabled) {
                          onToggleSubtitles();
                        }
                        onSelectTrack(track.id);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        settings.selectedTrackId === track.id
                          ? 'bg-indigo-600/20 text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>{track.label}</span>
                        {track.language && (
                          <span className="text-xs text-zinc-500">{track.language}</span>
                        )}
                      </div>
                      {settings.selectedTrackId === track.id && (
                        <Check size={18} className="text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-2">{t.subtitles?.fontSize || '字体大小'}</p>
                <div className="flex gap-2">
                  {fontSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onUpdateSettings({ fontSize: option.value as any })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                        settings.fontSize === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-zinc-400 text-sm mb-2">{t.subtitles?.textColor || '文字颜色'}</p>
                <div className="flex gap-2">
                  {textColorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onUpdateSettings({ textColor: option.value })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        settings.textColor === option.value ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: option.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-zinc-400 text-sm mb-2">{t.subtitles?.position || '位置'}</p>
                <div className="flex gap-2">
                  {positionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onUpdateSettings({ position: option.value as any })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                        settings.position === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubtitleControls);

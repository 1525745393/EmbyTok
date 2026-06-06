import React, { useMemo } from 'react';
import { Zap, X } from 'lucide-react';
import type { SpeedControlPanelProps, PlaybackSpeed } from '../types';

const PRESET_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

const SpeedControlPanel: React.FC<SpeedControlPanelProps> = ({
  currentSpeed,
  onSpeedChange,
  onClose,
  language = 'zh',
}) => {
  const labels = useMemo(() => ({
    zh: {
      title: '播放速度',
      reset: '恢复1x',
    },
    en: {
      title: 'Playback Speed',
      reset: 'Reset to 1x',
    },
  }), []);

  const label = labels[language];

  const handleSpeedSelect = (speed: PlaybackSpeed) => {
    onSpeedChange(speed);
    if (speed === 1.0) {
      onClose();
    }
  };

  const handleReset = () => {
    onSpeedChange(1.0);
    onClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-zinc-900/95 backdrop-blur-md rounded-2xl p-4 min-w-[280px] max-w-[90vw] shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-lg">{label.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESET_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedSelect(speed)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                currentSpeed === speed
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {speed === 1.0 ? '1x' : `${speed}x`}
            </button>
          ))}
        </div>

        {currentSpeed !== 1.0 && (
          <button
            onClick={handleReset}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          >
            {label.reset}
          </button>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>0.5x</span>
            <span className="text-white font-medium">{currentSpeed}x</span>
            <span>5.0x</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            value={PRESET_SPEEDS.indexOf(currentSpeed)}
            onChange={(e) => handleSpeedSelect(PRESET_SPEEDS[parseInt(e.target.value)])}
            className="w-full mt-2 accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SpeedControlPanel);

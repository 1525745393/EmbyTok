import React from 'react';
import { SubtitleCue, SubtitleSettings } from '../types';

interface SubtitleRendererProps {
  cues: SubtitleCue[];
  currentTime: number;
  settings: SubtitleSettings;
}

const SubtitleRenderer: React.FC<SubtitleRendererProps> = ({ cues, currentTime, settings }) => {
  if (!settings.enabled) {
    return null;
  }

  const activeCue = cues.find((cue) => currentTime >= cue.startTime && currentTime <= cue.endTime);

  if (!activeCue) {
    return null;
  }

  const fontSizeClass = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  }[settings.fontSize];

  const positionClass = settings.position === 'bottom' ? 'bottom-8' : 'top-8';

  const renderText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className="text-center">
        {line}
      </p>
    ));
  };

  return (
    <div className={`absolute left-4 right-4 ${positionClass} z-40 pointer-events-none`}>
      <div className="flex justify-center">
        <div
          className={`inline-block px-6 py-3 rounded-lg ${fontSizeClass} font-medium text-shadow-lg`}
          style={{
            color: settings.textColor,
            backgroundColor: settings.backgroundColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {renderText(activeCue.text)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubtitleRenderer);

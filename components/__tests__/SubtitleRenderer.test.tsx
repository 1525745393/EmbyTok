import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubtitleRenderer from '../SubtitleRenderer';

describe('SubtitleRenderer Component', () => {
  const mockCues = [
    {
      id: '1',
      startTime: 0,
      endTime: 5,
      text: 'First subtitle',
    },
    {
      id: '2',
      startTime: 5,
      endTime: 10,
      text: 'Second subtitle\nwith two lines',
    },
  ];

  const mockSettings = {
    enabled: true,
    selectedTrackId: null,
    fontSize: 'medium' as const,
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'bottom' as const,
  };

  it('should not render when disabled', () => {
    const { container } = render(
      <SubtitleRenderer
        cues={mockCues}
        currentTime={3}
        settings={{ ...mockSettings, enabled: false }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when no active cue', () => {
    const { container } = render(
      <SubtitleRenderer cues={mockCues} currentTime={20} settings={mockSettings} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render active subtitle', () => {
    render(<SubtitleRenderer cues={mockCues} currentTime={3} settings={mockSettings} />);

    expect(screen.getByText('First subtitle')).toBeInTheDocument();
  });

  it('should render multi-line subtitle', () => {
    render(<SubtitleRenderer cues={mockCues} currentTime={7} settings={mockSettings} />);

    expect(screen.getByText('Second subtitle')).toBeInTheDocument();
  });

  it('should render with different font sizes', () => {
    const { rerender } = render(
      <SubtitleRenderer
        cues={mockCues}
        currentTime={3}
        settings={{ ...mockSettings, fontSize: 'small' }}
      />
    );

    expect(screen.getByText('First subtitle')).toBeInTheDocument();

    rerender(
      <SubtitleRenderer
        cues={mockCues}
        currentTime={3}
        settings={{ ...mockSettings, fontSize: 'large' }}
      />
    );

    expect(screen.getByText('First subtitle')).toBeInTheDocument();
  });
});

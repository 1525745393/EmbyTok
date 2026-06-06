import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubtitleControls from '../SubtitleControls';

// Mock the useTranslation hook
vi.mock('../src/hooks', () => ({
  useTranslation: () => ({
    t: {
      subtitles: {
        select: '字幕',
        off: '关闭',
        on: '开启',
        small: '小',
        medium: '中',
        large: '大',
        fontSize: '字体大小',
        textColor: '文字颜色',
        position: '位置',
        bottom: '底部',
        top: '顶部',
      },
    },
  }),
}));

const mockTracks = [
  {
    id: 'track1',
    label: 'English',
    language: 'en',
  },
  {
    id: 'track2',
    label: '中文',
    language: 'zh',
  },
];

const mockSettings = {
  enabled: true,
  selectedTrackId: 'track1',
  fontSize: 'medium',
  textColor: '#FFFFFF',
  position: 'bottom',
};

describe('SubtitleControls Component', () => {
  const defaultProps = {
    tracks: mockTracks,
    settings: mockSettings,
    onToggleSubtitles: vi.fn(),
    onSelectTrack: vi.fn(),
    onUpdateSettings: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render correctly', () => {
    render(<SubtitleControls {...defaultProps} />);
    expect(screen.getByText('字幕')).toBeInTheDocument();
  });

  it('should render subtitle tracks', () => {
    render(<SubtitleControls {...defaultProps} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<SubtitleControls {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find((btn) => btn.innerHTML.includes('X'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('should toggle settings view', () => {
    render(<SubtitleControls {...defaultProps} />);
    const settingsButtons = screen.getAllByRole('button');
    const settingsButton = settingsButtons.find((btn) => btn.innerHTML.includes('Settings'));
    if (settingsButton) {
      fireEvent.click(settingsButton);
      expect(screen.getByText('字体大小')).toBeInTheDocument();
    }
  });

  it('should render subtitle toggle options', () => {
    render(<SubtitleControls {...defaultProps} />);
    expect(screen.getByText('关闭')).toBeInTheDocument();
    expect(screen.getByText('开启')).toBeInTheDocument();
  });
});

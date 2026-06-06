import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import VideoPlayer from '../VideoPlayer';

describe('VideoPlayer Component', () => {
  const defaultProps = {
    videoRef: React.createRef<HTMLVideoElement>(),
    videoSrc: 'http://example.com/video.mp4',
    posterSrc: 'http://example.com/poster.jpg',
    isMuted: true,
    isPlaying: false,
    hasStarted: false,
    isUserPaused: false,
    error: undefined,
    playbackRate: 1.0,
    seekOffset: null,
    isAutoPlay: false,
    videoObjectFitClass: 'object-cover',
    onLoadStart: vi.fn(),
    onCanPlay: vi.fn(),
    onPlaying: vi.fn(),
    onTimeUpdate: vi.fn(),
    onLoadedMetadata: vi.fn(),
    onVideoEnded: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element with correct src', () => {
    render(<VideoPlayer {...defaultProps} />);

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'http://example.com/video.mp4');
  });

  it('renders poster image when provided and video has not started', () => {
    render(<VideoPlayer {...defaultProps} />);

    const poster = screen.getByAltText('');
    expect(poster).toBeInTheDocument();
    expect(poster).toHaveAttribute('src', 'http://example.com/poster.jpg');
  });

  it('does not render poster when video has started', () => {
    render(<VideoPlayer {...defaultProps} hasStarted={true} />);

    expect(screen.queryByAltText('')).not.toBeInTheDocument();
  });

  it('displays play button overlay when video is paused by user', () => {
    render(<VideoPlayer {...defaultProps} isPlaying={false} isUserPaused={true} />);

    // Check for play overlay container
    const overlay = document.querySelector('.absolute.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('does not display play button when video is playing', () => {
    render(<VideoPlayer {...defaultProps} isPlaying={true} isUserPaused={false} />);

    const overlays = document.querySelectorAll('.absolute.inset-0');
    // Should not have play overlay
    const hasPlayOverlay = Array.from(overlays).some(
      (el) => el.textContent?.includes('Play') || el.querySelector('[class*="Play"]')
    );
    expect(hasPlayOverlay).toBe(false);
  });

  it('displays double speed indicator when playbackRate is greater than 1', () => {
    render(<VideoPlayer {...defaultProps} playbackRate={2.0} />);

    expect(screen.getByText('Double Speed')).toBeInTheDocument();
  });

  it('does not display double speed indicator at normal speed', () => {
    render(<VideoPlayer {...defaultProps} playbackRate={1.0} />);

    expect(screen.queryByText('Double Speed')).not.toBeInTheDocument();
  });

  it('displays fast forward indicator when seekOffset is positive', () => {
    render(<VideoPlayer {...defaultProps} seekOffset={10} />);

    expect(screen.getByText('+10s')).toBeInTheDocument();
  });

  it('displays rewind indicator when seekOffset is negative', () => {
    render(<VideoPlayer {...defaultProps} seekOffset={-5} />);

    expect(screen.getByText('-5s')).toBeInTheDocument();
  });

  it('does not display seek indicator when seekOffset is null', () => {
    render(<VideoPlayer {...defaultProps} seekOffset={null} />);

    // Check if any seek time indicator exists
    const hasSeekIndicator =
      document.body.textContent?.includes('+') ||
      (document.body.textContent?.includes('-') && document.body.textContent?.includes('s'));
    expect(hasSeekIndicator).toBe(false);
  });

  it('displays error message when error occurs', () => {
    render(<VideoPlayer {...defaultProps} error="Failed to load video" />);

    expect(screen.getByText('Failed to load video')).toBeInTheDocument();
  });

  it('does not display error message when no error', () => {
    render(<VideoPlayer {...defaultProps} error={undefined} />);

    expect(screen.queryByText('Failed to load video')).not.toBeInTheDocument();
  });

  it('applies correct object fit class', () => {
    render(<VideoPlayer {...defaultProps} videoObjectFitClass="object-contain" />);

    const video = document.querySelector('video');
    expect(video).toHaveClass('object-contain');
  });

  it('mutes video when isMuted is true', () => {
    render(<VideoPlayer {...defaultProps} isMuted={true} />);

    const video = document.querySelector('video');
    expect(video).toHaveAttribute('muted');
  });

  it('does not mute video when isMuted is false', () => {
    render(<VideoPlayer {...defaultProps} isMuted={false} />);

    const video = document.querySelector('video');
    expect(video).not.toHaveAttribute('muted');
  });

  it('loops video when isAutoPlay is false', () => {
    render(<VideoPlayer {...defaultProps} isAutoPlay={false} />);

    const video = document.querySelector('video');
    expect(video).toHaveAttribute('loop');
  });

  it('does not loop video when isAutoPlay is true', () => {
    render(<VideoPlayer {...defaultProps} isAutoPlay={true} />);

    const video = document.querySelector('video');
    expect(video).not.toHaveAttribute('loop');
  });
});

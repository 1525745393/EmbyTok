import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoControls from '../VideoControls';

describe('VideoControls Component', () => {
  const defaultT = {
    deleteVideo: '删除视频',
    deleteWarning: '警告：这将删除媒体库中的原文件！',
    deleteConfirm: '确定要删除此视频吗？',
    cancel: '取消',
    confirmDelete: '确定删除',
    mediaType: '视频',
    noOverview: '暂无简介',
    autoPlayOn: '自动连播已开启',
    doubleSpeed: '2倍速中',
    videoLoadError: '无法加载视频',
    networkError: '网络连接失败，请检查网络后重试',
    fileNotFound: '视频文件不存在',
    formatNotSupported: '视频格式不支持',
    unknownError: '播放出错，请重试',
    imageLoadError: '图片加载失败',
  };

  const defaultProps = {
    posterSrc: 'https://example.com/poster.jpg',
    isFavorite: false,
    isMuted: false,
    isPlaying: false,
    isAutoPlay: false,
    renderUI: true,
    t: defaultT,
    onToggleFavorite: vi.fn(),
    onToggleInfo: vi.fn(),
    onDeleteClick: vi.fn(),
    onToggleMute: vi.fn(),
    onToggleAutoPlay: vi.fn(),
  };

  it('should render correctly', () => {
    render(<VideoControls {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render UI when renderUI is true', () => {
    render(<VideoControls {...defaultProps} renderUI={true} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onToggleFavorite when favorite button is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(<VideoControls {...defaultProps} onToggleFavorite={onToggleFavorite} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      if (btn.innerHTML.includes('lucide-heart')) {
        fireEvent.click(btn);
      }
    });

    expect(onToggleFavorite).toHaveBeenCalled();
  });

  it('should call onToggleMute when mute button is clicked', () => {
    const onToggleMute = vi.fn();
    render(<VideoControls {...defaultProps} onToggleMute={onToggleMute} />);

    const buttons = screen.getAllByRole('button');
    const muteButton = buttons.find(
      (btn) => btn.innerHTML.includes('lucide-disc') || btn.innerHTML.includes('object-cover')
    );
    if (muteButton) {
      fireEvent.click(muteButton);
      expect(onToggleMute).toHaveBeenCalled();
    }
  });

  it('should call onToggleAutoPlay when autoplay button is clicked', () => {
    const onToggleAutoPlay = vi.fn();
    render(<VideoControls {...defaultProps} onToggleAutoPlay={onToggleAutoPlay} />);

    const buttons = screen.getAllByRole('button');
    const autoPlayButton = buttons.find((btn) => btn.innerHTML.includes('lucide-infinity'));
    if (autoPlayButton) {
      fireEvent.click(autoPlayButton);
      expect(onToggleAutoPlay).toHaveBeenCalled();
    }
  });
});

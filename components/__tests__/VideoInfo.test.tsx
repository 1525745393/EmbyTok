import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoInfo from '../VideoInfo';

const mockItem = {
  Id: '1',
  Name: 'Test Video',
  ProductionYear: 2024,
  RunTimeTicks: 36000000000,
  MediaType: 'Video',
  Overview: 'This is a test video description.',
  Type: 'Movie',
  ServerId: 'server1',
  ImageTags: {},
  UserData: {},
};

describe('VideoInfo Component', () => {
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
    item: mockItem,
    showInfo: false,
    renderUI: true,
    isPlaying: false,
    t: defaultT,
    onToggleInfo: vi.fn(),
  };

  it('should not render when renderUI is false', () => {
    render(<VideoInfo {...defaultProps} renderUI={false} />);
    expect(screen.queryByText('Test Video')).not.toBeInTheDocument();
  });

  it('should render video name', () => {
    render(<VideoInfo {...defaultProps} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('should render production year and media type', () => {
    render(<VideoInfo {...defaultProps} />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('should render overview', () => {
    render(<VideoInfo {...defaultProps} />);
    expect(screen.getByText('This is a test video description.')).toBeInTheDocument();
  });

  it('should call onToggleInfo when overview is clicked', () => {
    const onToggleInfo = vi.fn();
    render(<VideoInfo {...defaultProps} onToggleInfo={onToggleInfo} />);

    const overviewElement = screen.getByText('This is a test video description.');
    fireEvent.click(overviewElement);
    expect(onToggleInfo).toHaveBeenCalled();
  });

  it('should render no overview text when no overview is available', () => {
    const itemWithoutOverview = { ...mockItem, Overview: undefined };
    render(<VideoInfo {...defaultProps} item={itemWithoutOverview} />);
    expect(screen.getByText('暂无简介')).toBeInTheDocument();
  });
});

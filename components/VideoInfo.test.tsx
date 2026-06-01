import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import VideoInfo from './VideoInfo';
import type { EmbyItem } from '../types';

const mockT = {
  deleteVideo: 'Delete Video',
  deleteWarning: 'Warning: This will delete the original file!',
  deleteConfirm: 'Are you sure you want to delete this video?',
  cancel: 'Cancel',
  confirmDelete: 'Confirm Delete',
  mediaType: 'Video',
  noOverview: 'No overview available',
  autoPlayOn: 'Auto Play On',
  doubleSpeed: '2x Speed',
  videoLoadError: 'Video Load Error',
};

const testItem: EmbyItem = {
  Id: '1',
  Name: 'Test Movie',
  Type: 'Movie',
  MediaType: 'Video',
  Overview: 'This is a test movie overview',
  ProductionYear: 2024,
  RunTimeTicks: 72000000000,
};

describe('VideoInfo', () => {
  it('should render nothing when renderUI is false', () => {
    const { container } = render(
      <VideoInfo
        item={testItem}
        showInfo={false}
        renderUI={false}
        t={mockT}
        onToggleInfo={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render video info when renderUI is true', () => {
    render(
      <VideoInfo
        item={testItem}
        showInfo={false}
        renderUI={true}
        t={mockT}
        onToggleInfo={() => {}}
      />
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('120 分钟')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('This is a test movie overview')).toBeInTheDocument();
  });

  it('should render no overview text when Overview is missing', () => {
    const itemWithoutOverview: EmbyItem = { ...testItem, Overview: undefined };

    render(
      <VideoInfo
        item={itemWithoutOverview}
        showInfo={false}
        renderUI={true}
        t={mockT}
        onToggleInfo={() => {}}
      />
    );

    expect(screen.getByText('No overview available')).toBeInTheDocument();
  });

  it('should call onToggleInfo when overview is clicked', () => {
    const onToggleInfo = vi.fn();

    render(
      <VideoInfo
        item={testItem}
        showInfo={false}
        renderUI={true}
        t={mockT}
        onToggleInfo={onToggleInfo}
      />
    );

    const overviewElement = screen.getByText('This is a test movie overview');
    fireEvent.click(overviewElement);

    expect(onToggleInfo).toHaveBeenCalledTimes(1);
  });
});

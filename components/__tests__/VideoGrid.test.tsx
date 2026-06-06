import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoGrid from '../VideoGrid';

const mockVideos = [
  {
    Id: '1',
    Name: 'First Video',
    ProductionYear: 2020,
    RunTimeTicks: 36000000000,
    Type: 'Movie',
    ServerId: 'server1',
    ImageTags: { Primary: 'image1' },
    UserData: {},
  },
  {
    Id: '2',
    Name: 'Second Video',
    ProductionYear: 2021,
    RunTimeTicks: 72000000000,
    Type: 'Movie',
    ServerId: 'server1',
    ImageTags: {},
    UserData: {
      PlaybackPositionTicks: 36000000000,
    },
  },
  {
    Id: '3',
    Name: 'TV Series',
    Type: 'Series',
    ServerId: 'server1',
    ImageTags: {},
    UserData: {},
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
};

describe('VideoGrid Component', () => {
  it('should render video items', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        client={mockClient}
        onSelect={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <VideoGrid
        videos={[]}
        client={mockClient}
        onSelect={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('暂无内容')).toBeInTheDocument();
  });

  it('should call onSelect when video is clicked', () => {
    const onSelect = vi.fn();
    render(
      <VideoGrid
        videos={mockVideos}
        client={mockClient}
        onSelect={onSelect}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const firstVideo = screen.getByText('First Video');
    fireEvent.click(firstVideo);
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('should call onNavigate for folder items', () => {
    const onNavigate = vi.fn();
    render(
      <VideoGrid
        videos={mockVideos}
        client={mockClient}
        onSelect={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
        onNavigate={onNavigate}
      />
    );

    const seriesItem = screen.getByText('TV Series');
    fireEvent.click(seriesItem);
    expect(onNavigate).toHaveBeenCalled();
  });

  it('should call onRefresh in empty state', () => {
    const onRefresh = vi.fn();
    render(
      <VideoGrid
        videos={[]}
        client={mockClient}
        onSelect={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={onRefresh}
      />
    );

    const refreshButton = screen.getByText('刷新');
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalled();
  });
});

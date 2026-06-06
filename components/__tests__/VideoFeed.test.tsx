import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoFeed from '../VideoFeed';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// @ts-ignore
window.IntersectionObserver = MockIntersectionObserver;

// Mock hooks
vi.mock('../src/hooks', () => ({
  useSmartVideoPreload: () => ({
    isPreloaded: vi.fn().mockReturnValue(true),
    getCacheStatus: vi.fn().mockReturnValue('idle'),
    updateScrollSpeed: vi.fn(),
  }),
}));

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
    UserData: {},
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
  getVideoUrl: vi.fn().mockReturnValue('https://example.com/video.mp4'),
};

describe('VideoFeed Component', () => {
  it('should render video feed with videos', () => {
    render(
      <VideoFeed
        videos={mockVideos}
        client={mockClient}
        favoriteIds={new Set()}
        onToggleFavorite={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
      />
    );

    // Check that component renders without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <VideoFeed
        videos={[]}
        client={mockClient}
        favoriteIds={new Set()}
        onToggleFavorite={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
        feedType="latest"
        hasMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('未找到视频')).toBeInTheDocument();
  });

  it('should call onRefresh in empty state', () => {
    const onRefresh = vi.fn();
    render(
      <VideoFeed
        videos={[]}
        client={mockClient}
        favoriteIds={new Set()}
        onToggleFavorite={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
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

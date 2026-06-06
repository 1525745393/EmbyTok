import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoCard from '../VideoCard';

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
  useLazyImage: () => ({
    setRef: vi.fn(),
    isLoaded: true,
    isError: false,
    retryLoad: vi.fn(),
    canRetry: true,
  }),
  useTranslation: () => ({
    t: {},
  }),
}));

const mockItem = {
  Id: '1',
  Name: 'Test Video',
  ProductionYear: 2024,
  RunTimeTicks: 36000000000,
  MediaType: 'Video',
  Overview: 'This is a test video description',
  Type: 'Movie',
  ServerId: 'server1',
  ImageTags: { Primary: 'image1' },
  UserData: {},
  Width: 1920,
  Height: 1080,
};

const mockClient = {
  getVideoUrl: vi.fn().mockReturnValue('https://example.com/video.mp4'),
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
};

describe('VideoCard Component', () => {
  it('should render correctly', () => {
    render(
      <VideoCard
        item={mockItem}
        client={mockClient}
        isActive={true}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
      />
    );

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('should render with favorite state', () => {
    render(
      <VideoCard
        item={mockItem}
        client={mockClient}
        isActive={true}
        isFavorite={true}
        onToggleFavorite={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
      />
    );

    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });
});

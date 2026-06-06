import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TVVideoPlayer from '../TVVideoPlayer';

const mockVideos = [
  {
    Id: '1',
    Name: 'First Video',
    ProductionYear: 2020,
    Type: 'Movie',
    ImageTags: { Primary: 'image1' },
    Overview: 'This is the first video overview',
  },
  {
    Id: '2',
    Name: 'Second Video',
    ProductionYear: 2021,
    Type: 'Movie',
    ImageTags: {},
    Overview: 'This is the second video overview',
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
  getVideoUrl: vi.fn().mockReturnValue('https://example.com/video.mp4'),
  getFavorites: vi.fn().mockResolvedValue(new Set()),
  toggleFavorite: vi.fn().mockResolvedValue(undefined),
};

describe('TVVideoPlayer Component', () => {
  it('should render video player', () => {
    render(
      <TVVideoPlayer
        videos={mockVideos}
        initialIndex={0}
        onBack={vi.fn()}
        client={mockClient}
        libraryName="Movies"
        language="zh"
      />
    );

    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('should render without poster', () => {
    render(
      <TVVideoPlayer
        videos={[mockVideos[1]]}
        initialIndex={0}
        onBack={vi.fn()}
        client={mockClient}
        libraryName="Movies"
        language="zh"
      />
    );

    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <TVVideoPlayer
        videos={mockVideos}
        initialIndex={0}
        onBack={onBack}
        client={mockClient}
        libraryName="Movies"
        language="zh"
      />
    );

    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it('should render English version', () => {
    render(
      <TVVideoPlayer
        videos={mockVideos}
        initialIndex={0}
        onBack={vi.fn()}
        client={mockClient}
        libraryName="Movies"
        language="en"
      />
    );

    expect(screen.getByText('First Video')).toBeInTheDocument();
  });
});

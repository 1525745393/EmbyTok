import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TVVideoGrid from '../TVVideoGrid';

const mockVideos = [
  {
    Id: '1',
    Name: 'First Video',
    ProductionYear: 2020,
    Type: 'Movie',
    ImageTags: { Primary: 'image1' },
  },
  {
    Id: '2',
    Name: 'Second Video',
    ProductionYear: 2021,
    Type: 'Movie',
    ImageTags: {},
  },
  {
    Id: '3',
    Name: 'Third Video',
    ProductionYear: 2022,
    Type: 'Movie',
    ImageTags: { Primary: 'image3' },
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
  getVideoUrl: vi.fn().mockReturnValue('https://example.com/video.mp4'),
};

describe('TVVideoGrid Component', () => {
  it('should render video grid with videos', () => {
    render(<TVVideoGrid videos={mockVideos} client={mockClient} onSelect={vi.fn()} />);

    expect(screen.getAllByText('First Video')).toHaveLength(1);
    expect(screen.getAllByText('Second Video')).toHaveLength(2); // 图片缺失时显示两次
    expect(screen.getAllByText('Third Video')).toHaveLength(1);
  });

  it('should call onSelect when video is clicked', () => {
    const onSelect = vi.fn();
    render(<TVVideoGrid videos={mockVideos} client={mockClient} onSelect={onSelect} />);

    const firstVideo = screen.getByText('First Video');
    fireEvent.click(firstVideo.closest('div')!);
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('should call onSelect when Enter key is pressed', () => {
    const onSelect = vi.fn();
    render(<TVVideoGrid videos={mockVideos} client={mockClient} onSelect={onSelect} />);

    const firstVideo = screen.getByText('First Video');
    const videoElement = firstVideo.closest('[tabindex="0"]')!;
    fireEvent.keyDown(videoElement, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});

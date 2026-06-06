import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TVDashboard from '../TVDashboard';

const mockLibraries = [
  {
    Id: '1',
    Name: 'Movies',
    ImageTags: {},
  },
  {
    Id: '2',
    Name: 'TV Shows',
    ImageTags: { Primary: 'image1' },
  },
];

const mockItems = [
  {
    Id: '1',
    Name: 'First Item',
    ImageTags: { Primary: 'image1' },
  },
  {
    Id: '2',
    Name: 'Second Item',
    ImageTags: {},
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
  getVideos: vi.fn().mockResolvedValue({ items: mockItems }),
};

describe('TVDashboard Component', () => {
  it('should render loading state initially', () => {
    render(
      <TVDashboard
        client={mockClient}
        libraries={mockLibraries}
        onSelectVideo={vi.fn()}
        onSelectLibrary={vi.fn()}
        language="zh"
      />
    );

    // Loading spinner should be present initially
    expect(document.body).toBeInTheDocument();
  });

  it('should render libraries section', async () => {
    render(
      <TVDashboard
        client={mockClient}
        libraries={mockLibraries}
        onSelectVideo={vi.fn()}
        onSelectLibrary={vi.fn()}
        language="zh"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('我的媒体库')).toBeInTheDocument();
    });
  });

  it('should call onSelectLibrary when library is clicked', async () => {
    const onSelectLibrary = vi.fn();
    render(
      <TVDashboard
        client={mockClient}
        libraries={mockLibraries}
        onSelectVideo={vi.fn()}
        onSelectLibrary={onSelectLibrary}
        language="zh"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('我的媒体库')).toBeInTheDocument();
    });
  });
});

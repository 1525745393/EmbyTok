import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchResults from '../SearchResults';

// Mock the useTranslation hook
vi.mock('../src/hooks', () => ({
  useTranslation: () => ({
    t: {
      search: {
        searching: '搜索中...',
        noResults: '未找到结果',
        results: '搜索结果',
      },
    },
  }),
}));

const mockResults = [
  {
    Id: '1',
    Name: 'Test Video 1',
    ProductionYear: 2024,
    Type: 'Movie',
    ServerId: 'server1',
    ImageTags: { Primary: 'image1' },
    UserData: {},
  },
  {
    Id: '2',
    Name: 'Test Video 2',
    ProductionYear: 2023,
    Type: 'Movie',
    ServerId: 'server1',
    ImageTags: {},
    UserData: {},
  },
];

const mockClient = {
  getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
};

describe('SearchResults Component', () => {
  it('should render loading state', () => {
    render(
      <SearchResults
        results={[]}
        loading={true}
        query="test"
        client={mockClient}
        onSelectVideo={vi.fn()}
      />
    );
    expect(screen.getByText('搜索中...')).toBeInTheDocument();
  });

  it('should render empty query state', () => {
    render(
      <SearchResults
        results={[]}
        loading={false}
        query=""
        client={mockClient}
        onSelectVideo={vi.fn()}
      />
    );
    expect(screen.getByText('输入关键词开始搜索')).toBeInTheDocument();
  });

  it('should render no results state', () => {
    render(
      <SearchResults
        results={[]}
        loading={false}
        query="test"
        client={mockClient}
        onSelectVideo={vi.fn()}
      />
    );
    expect(screen.getByText('未找到结果')).toBeInTheDocument();
  });

  it('should render search results', () => {
    render(
      <SearchResults
        results={mockResults}
        loading={false}
        query="test"
        client={mockClient}
        onSelectVideo={vi.fn()}
      />
    );
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
  });

  it('should call onSelectVideo when a result is clicked', () => {
    const onSelectVideo = vi.fn();
    render(
      <SearchResults
        results={mockResults}
        loading={false}
        query="test"
        client={mockClient}
        onSelectVideo={onSelectVideo}
      />
    );
    const videoItem = screen.getByText('Test Video 1');
    fireEvent.click(videoItem);
    expect(onSelectVideo).toHaveBeenCalledWith(mockResults[0]);
  });
});

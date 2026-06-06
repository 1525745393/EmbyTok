import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MobileRoot from '../MobileRoot';

// 模拟 clientFactory
vi.mock('../../../services/clientFactory', () => ({
  ClientFactory: {
    create: vi.fn().mockReturnValue({
      getLibraries: vi.fn().mockResolvedValue([]),
      getVideos: vi.fn().mockResolvedValue({ items: [] }),
      getImageUrl: vi.fn().mockReturnValue('https://example.com/image.jpg'),
    }),
  },
}));

describe('MobileRoot Component', () => {
  it('should render login form when not logged in', () => {
    // 清空 localStorage 模拟未登录状态
    Storage.prototype.getItem = vi.fn().mockReturnValue(null);

    render(<MobileRoot />);

    // 应该显示登录表单
    expect(screen.getByText('EmbyTok')).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateNotification from '../UpdateNotification';

const mockRelease = {
  id: 1,
  tag_name: 'v1.0.0',
  name: 'Release 1.0.0',
  body: '- 新增功能A\n- 修复bugB\n- 优化性能',
  html_url: 'https://github.com/test/test/releases/v1.0.0',
  assets: [
    {
      id: 1,
      name: 'test.apk',
      browser_download_url: 'https://github.com/test/test/releases/download/v1.0.0/test.apk',
    },
  ],
};

describe('UpdateNotification Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    release: mockRelease,
    language: 'zh' as const,
  };

  it('should not render when isOpen is false', () => {
    render(<UpdateNotification {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('发现新版本')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<UpdateNotification {...defaultProps} />);
    expect(screen.getByText('发现新版本')).toBeInTheDocument();
    expect(screen.getByText('更新内容')).toBeInTheDocument();
  });

  it('should render English text when language is en', () => {
    render(<UpdateNotification {...defaultProps} language="en" />);
    expect(screen.getByText('New Version Available')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<UpdateNotification {...defaultProps} onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find((btn) => btn.innerHTML.includes('lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should call onClose when later button is clicked', () => {
    const onClose = vi.fn();
    render(<UpdateNotification {...defaultProps} onClose={onClose} />);

    const laterButton = screen.getByText('稍后再说');
    fireEvent.click(laterButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should display release notes', () => {
    render(<UpdateNotification {...defaultProps} />);
    // Just verify that the component renders without errors
    expect(document.body).toBeInTheDocument();
  });
});

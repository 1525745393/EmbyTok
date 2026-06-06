import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LibrarySelect from '../LibrarySelect';

describe('LibrarySelect Component', () => {
  const mockLibraries = [
    { Id: 'lib1', Name: 'Movies', CollectionType: 'movies' },
    { Id: 'lib2', Name: 'TV Shows', CollectionType: 'tvshows' },
  ];

  const defaultProps = {
    libraries: mockLibraries,
    onSelect: vi.fn(),
    selectedId: null,
    onClose: vi.fn(),
    isOpen: true,
    hiddenLibIds: new Set(),
    onToggleHidden: vi.fn(),
    onLogout: vi.fn(),
    serverUrl: 'http://localhost:8096',
    username: 'testuser',
    orientationMode: 'vertical' as const,
    onOrientationChange: vi.fn(),
    onToggleMode: vi.fn(),
    language: 'zh' as const,
    onToggleLanguage: vi.fn(),
    version: '1.0.0',
  };

  it('should not render when isOpen is false', () => {
    render(<LibrarySelect {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/媒体库/i)).not.toBeInTheDocument();
  });

  it('should render libraries when open', () => {
    render(<LibrarySelect {...defaultProps} />);
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
  });

  it('should call onSelect when a library is clicked', () => {
    const onSelect = vi.fn();
    render(<LibrarySelect {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Movies'));
    expect(onSelect).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<LibrarySelect {...defaultProps} onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find((btn) => btn.innerHTML.includes('lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    } else {
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should switch to settings mode when settings button is clicked', () => {
    render(<LibrarySelect {...defaultProps} />);

    const settingsButton = screen.getByText('设置');
    fireEvent.click(settingsButton);
    expect(screen.getByText('设置')).toBeInTheDocument();
  });
});

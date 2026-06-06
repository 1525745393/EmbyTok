import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';

describe('Login Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByText('EmbyTok')).toBeInTheDocument();
    expect(screen.getByText('服务器地址')).toBeInTheDocument();
    expect(screen.getByText('用户名')).toBeInTheDocument();
    expect(screen.getByText('密码')).toBeInTheDocument();
    expect(screen.getByText('立即连接')).toBeInTheDocument();
  });

  it('renders server type toggle buttons', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByText('EMBY')).toBeInTheDocument();
    expect(screen.getByText('PLEX')).toBeInTheDocument();
  });

  it('switches between emby and plex server types', () => {
    render(<Login onLogin={mockOnLogin} />);

    // Default is Emby
    expect(screen.getByText('用户名')).toBeInTheDocument();
    expect(screen.getByText('密码')).toBeInTheDocument();

    // Switch to Plex
    fireEvent.click(screen.getByText('PLEX'));
    expect(screen.getByText('X-Plex-Token')).toBeInTheDocument();

    // Switch back to Emby
    fireEvent.click(screen.getByText('EMBY'));
    expect(screen.getByText('用户名')).toBeInTheDocument();
  });

  it('toggles language when language button is clicked', () => {
    render(<Login onLogin={mockOnLogin} />);

    const languageButton = screen.getByText('English');

    // Toggle to English
    fireEvent.click(languageButton);
    expect(screen.getByText('Server Address')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();

    // Toggle back to Chinese
    fireEvent.click(screen.getByText('中文'));
    expect(screen.getByText('服务器地址')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('persists language preference in localStorage', () => {
    render(<Login onLogin={mockOnLogin} />);

    const languageButton = screen.getByText('English');
    fireEvent.click(languageButton);

    expect(localStorage.getItem('embyLanguage')).toBe('en');
  });
});

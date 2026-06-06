import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import { ClientFactory } from '../../services/clientFactory';

vi.mock('../../services/clientFactory', () => ({
  ClientFactory: {
    authenticate: vi.fn()
  }
}));

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

  it('updates input fields on user input', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const serverUrlInput = screen.getByPlaceholderText('https://...');
    const usernameInput = screen.getAllByRole('textbox')[1];
    const passwordInput = screen.getByRole('textbox', { name: /密码/i });
    
    fireEvent.change(serverUrlInput, { target: { value: 'http://localhost:8096' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(serverUrlInput).toHaveValue('http://localhost:8096');
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls onLogin with valid credentials', async () => {
    const mockConfig = {
      url: 'http://localhost:8096',
      username: 'testuser',
      token: 'test-token',
      userId: 'user123',
      serverType: 'emby' as const
    };
    
    (ClientFactory.authenticate as any).mockResolvedValue(mockConfig);
    
    render(<Login onLogin={mockOnLogin} />);
    
    const serverUrlInput = screen.getByPlaceholderText('https://...');
    const usernameInput = screen.getAllByRole('textbox')[1];
    const passwordInput = screen.getByRole('textbox', { name: /密码/i });
    const submitButton = screen.getByText('立即连接');
    
    fireEvent.change(serverUrlInput, { target: { value: 'http://localhost:8096' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(ClientFactory.authenticate).toHaveBeenCalledWith(
        'emby',
        'http://localhost:8096',
        'testuser',
        'password123'
      );
      expect(mockOnLogin).toHaveBeenCalledWith(mockConfig);
    });
  });

  it('adds http prefix to server url if missing', async () => {
    const mockConfig = {
      url: 'http://localhost:8096',
      username: 'testuser',
      token: 'test-token',
      userId: 'user123',
      serverType: 'emby' as const
    };
    
    (ClientFactory.authenticate as any).mockResolvedValue(mockConfig);
    
    render(<Login onLogin={mockOnLogin} />);
    
    const serverUrlInput = screen.getByPlaceholderText('https://...');
    const usernameInput = screen.getAllByRole('textbox')[1];
    const passwordInput = screen.getByRole('textbox', { name: /密码/i });
    const submitButton = screen.getByText('立即连接');
    
    fireEvent.change(serverUrlInput, { target: { value: 'localhost:8096' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(ClientFactory.authenticate).toHaveBeenCalledWith(
        'emby',
        'http://localhost:8096',
        'testuser',
        'password123'
      );
    });
  });

  it('shows error message on login failure', async () => {
    (ClientFactory.authenticate as any).mockRejectedValue(new Error('Login failed'));
    
    render(<Login onLogin={mockOnLogin} />);
    
    const serverUrlInput = screen.getByPlaceholderText('https://...');
    const usernameInput = screen.getAllByRole('textbox')[1];
    const passwordInput = screen.getByRole('textbox', { name: /密码/i });
    const submitButton = screen.getByText('立即连接');
    
    fireEvent.change(serverUrlInput, { target: { value: 'http://localhost:8096' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('连接失败，请检查账号密码')).toBeInTheDocument();
    });
    expect(mockOnLogin).not.toHaveBeenCalled();
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

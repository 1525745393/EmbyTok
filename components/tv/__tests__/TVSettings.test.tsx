import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TVSettings from '../TVSettings';

const mockConfig = {
  url: 'https://example.com',
  username: 'testuser',
  userId: '123',
  token: 'token',
};

const mockLibraries = [
  {
    Id: '1',
    Name: 'Movies',
    ImageTags: {},
  },
  {
    Id: '2',
    Name: 'TV Shows',
    ImageTags: {},
  },
];

describe('TVSettings Component', () => {
  it('should render account tab', () => {
    render(
      <TVSettings
        config={mockConfig}
        libraries={mockLibraries}
        hiddenLibIds={new Set()}
        onToggleHidden={vi.fn()}
        orientationMode="vertical"
        onOrientationChange={vi.fn()}
        language="zh"
        onToggleLanguage={vi.fn()}
        onToggleMode={vi.fn()}
        onLogout={vi.fn()}
        activeTab="account"
        onTabChange={vi.fn()}
        version="1.0.0"
      />
    );

    expect(screen.getAllByText('账户')).toHaveLength(2); // 左侧 Tab 和右侧标题各一次
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should render libraries tab', () => {
    render(
      <TVSettings
        config={mockConfig}
        libraries={mockLibraries}
        hiddenLibIds={new Set()}
        onToggleHidden={vi.fn()}
        orientationMode="vertical"
        onOrientationChange={vi.fn()}
        language="zh"
        onToggleLanguage={vi.fn()}
        onToggleMode={vi.fn()}
        onLogout={vi.fn()}
        activeTab="libraries"
        onTabChange={vi.fn()}
        version="1.0.0"
      />
    );

    expect(screen.getAllByText('媒体库')).toHaveLength(2); // 左侧 Tab 和右侧标题各一次
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
  });

  it('should call onLogout when logout button is clicked', () => {
    const onLogout = vi.fn();
    render(
      <TVSettings
        config={mockConfig}
        libraries={mockLibraries}
        hiddenLibIds={new Set()}
        onToggleHidden={vi.fn()}
        orientationMode="vertical"
        onOrientationChange={vi.fn()}
        language="zh"
        onToggleLanguage={vi.fn()}
        onToggleMode={vi.fn()}
        onLogout={onLogout}
        activeTab="account"
        onTabChange={vi.fn()}
        version="1.0.0"
      />
    );

    const logoutButton = screen.getByText('退出登录');
    fireEvent.click(logoutButton);
    expect(onLogout).toHaveBeenCalled();
  });

  it('should call onToggleLanguage when language button is clicked', () => {
    const onToggleLanguage = vi.fn();
    render(
      <TVSettings
        config={mockConfig}
        libraries={mockLibraries}
        hiddenLibIds={new Set()}
        onToggleHidden={vi.fn()}
        orientationMode="vertical"
        onOrientationChange={vi.fn()}
        language="zh"
        onToggleLanguage={onToggleLanguage}
        onToggleMode={vi.fn()}
        onLogout={vi.fn()}
        activeTab="display"
        onTabChange={vi.fn()}
        version="1.0.0"
      />
    );

    const langButton = screen.getByText('当前：简体中文');
    fireEvent.click(langButton);
    expect(onToggleLanguage).toHaveBeenCalled();
  });
});

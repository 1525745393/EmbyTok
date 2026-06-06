import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  const defaultProps = {
    query: '',
    isFocused: false,
    searchHistory: [],
    onQueryChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onHistoryItemClick: vi.fn(),
    onClearHistory: vi.fn(),
    onClearQuery: vi.fn(),
  };

  it('should render correctly', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display search query', () => {
    render(<SearchBar {...defaultProps} query="test query" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should call onQueryChange when input changes', () => {
    const onQueryChange = vi.fn();
    render(<SearchBar {...defaultProps} onQueryChange={onQueryChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new query' } });

    expect(onQueryChange).toHaveBeenCalledWith('new query');
  });

  it('should call onFocus when input is focused', () => {
    const onFocus = vi.fn();
    render(<SearchBar {...defaultProps} onFocus={onFocus} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(onFocus).toHaveBeenCalled();
  });

  it('should show clear button when there is a query', () => {
    const onClearQuery = vi.fn();
    render(<SearchBar {...defaultProps} query="test" onClearQuery={onClearQuery} />);

    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find((btn) => btn.innerHTML.includes('lucide-x'));
    expect(clearButton).toBeInTheDocument();

    if (clearButton) {
      fireEvent.click(clearButton);
      expect(onClearQuery).toHaveBeenCalled();
    }
  });

  it('should display search history when focused', () => {
    const searchHistory = [
      { query: 'history 1', timestamp: Date.now() },
      { query: 'history 2', timestamp: Date.now() },
    ];

    render(<SearchBar {...defaultProps} isFocused={true} searchHistory={searchHistory} />);

    expect(screen.getByText('history 1')).toBeInTheDocument();
    expect(screen.getByText('history 2')).toBeInTheDocument();
  });

  it('should call onHistoryItemClick when history item is clicked', () => {
    const onHistoryItemClick = vi.fn();
    const searchHistory = [{ query: 'test history', timestamp: Date.now() }];

    render(
      <SearchBar
        {...defaultProps}
        isFocused={true}
        searchHistory={searchHistory}
        onHistoryItemClick={onHistoryItemClick}
      />
    );

    fireEvent.click(screen.getByText('test history'));
    expect(onHistoryItemClick).toHaveBeenCalledWith('test history');
  });

  it('should call onClearHistory when clear button is clicked', () => {
    const onClearHistory = vi.fn();
    const searchHistory = [{ query: 'test history', timestamp: Date.now() }];

    render(
      <SearchBar
        {...defaultProps}
        isFocused={true}
        searchHistory={searchHistory}
        onClearHistory={onClearHistory}
      />
    );

    const clearButtons = screen.getAllByRole('button');
    clearButtons.forEach((btn) => {
      if (btn.innerHTML.includes('清空') || btn.innerHTML.includes('clear')) {
        fireEvent.click(btn);
      }
    });

    expect(onClearHistory).toHaveBeenCalled();
  });
});

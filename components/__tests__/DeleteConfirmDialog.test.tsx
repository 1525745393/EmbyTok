import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog Component', () => {
  const defaultT = {
    deleteVideo: '删除视频',
    deleteWarning: '警告：这将删除媒体库中的原文件！',
    deleteConfirm: '确定要删除此视频吗？',
    cancel: '取消',
    confirmDelete: '确定删除',
  };

  const defaultProps = {
    show: false,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    t: defaultT,
  };

  it('should not render when show is false', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.queryByText(defaultT.deleteVideo)).not.toBeInTheDocument();
  });

  it('should render when show is true', () => {
    render(<DeleteConfirmDialog {...defaultProps} show={true} />);
    expect(screen.getByText(defaultT.deleteVideo)).toBeInTheDocument();
    expect(screen.getByText(defaultT.cancel)).toBeInTheDocument();
    expect(screen.getByText(defaultT.confirmDelete)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} show={true} onCancel={onCancel} />);

    fireEvent.click(screen.getByText(defaultT.cancel));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} show={true} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText(defaultT.confirmDelete));
    expect(onConfirm).toHaveBeenCalled();
  });
});

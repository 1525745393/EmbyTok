import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HeartAnimation from './HeartAnimation';

describe('HeartAnimation', () => {
  it('should render nothing when hearts array is empty', () => {
    const { container } = render(<HeartAnimation hearts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render hearts when hearts array is provided', () => {
    const testHearts = [
      { id: 1, x: 100, y: 100, rotate: 0 },
      { id: 2, x: 200, y: 200, rotate: 45 },
    ];

    const { container } = render(<HeartAnimation hearts={testHearts} />);
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
  });

  it('should render correct number of hearts', () => {
    const testHearts = [
      { id: 1, x: 100, y: 100, rotate: 0 },
      { id: 2, x: 200, y: 200, rotate: 45 },
      { id: 3, x: 300, y: 300, rotate: 90 },
    ];

    const { container } = render(<HeartAnimation hearts={testHearts} />);
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(3);
  });
});

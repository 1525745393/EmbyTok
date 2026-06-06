import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import VideoSkeleton from '../VideoSkeleton';

describe('VideoSkeleton Component', () => {
  it('should render correctly', () => {
    const { container } = render(<VideoSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should contain skeleton elements', () => {
    const { container } = render(<VideoSkeleton />);

    // Check that there are some div elements (skeleton placeholders)
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});

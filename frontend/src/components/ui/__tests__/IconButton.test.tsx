import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
  it('uses its accessible label as a tooltip when no title is provided', () => {
    render(<IconButton aria-label="Copy account number" icon={<span aria-hidden="true">copy</span>} />);

    expect(screen.getByRole('button', { name: 'Copy account number' }))
      .toHaveAttribute('title', 'Copy account number');
  });
});

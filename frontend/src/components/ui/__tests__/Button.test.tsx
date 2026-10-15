/**
 * Component and Accessibility Tests for Button
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with children text and correct variant class', () => {
    render(<Button variant="primary">Confirm Transfer</Button>);
    const btn = screen.getByRole('button', { name: 'Confirm Transfer' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('btn-primary');
  });

  it('handles click events when enabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click events and sets aria-busy when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Saving...
      </Button>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has zero accessibility violations according to axe', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="danger">Danger Button</Button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

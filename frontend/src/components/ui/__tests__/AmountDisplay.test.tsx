/**
 * Component and Accessibility Tests for AmountDisplay
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { AmountDisplay } from '../AmountDisplay';

describe('AmountDisplay Component', () => {
  it('renders formatted Indian Rupee amounts with Lakh/Crore grouping', () => {
    render(<AmountDisplay amount="1234567.89" />);
    expect(screen.getByText('₹12,34,567.89')).toBeInTheDocument();
  });

  it('applies sign-based styling classes when colorBySign is true', () => {
    const { rerender } = render(<AmountDisplay amount="5000.00" colorBySign />);
    expect(screen.getByText('₹5,000.00')).toHaveClass('amount-positive');

    rerender(<AmountDisplay amount="-5000.00" colorBySign />);
    expect(screen.getByText('-₹5,000.00')).toHaveClass('amount-negative');
  });

  it('has zero accessibility violations according to axe', async () => {
    const { container } = render(
      <div>
        <AmountDisplay amount="250000.00" />
        <AmountDisplay amount="-150.00" colorBySign />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

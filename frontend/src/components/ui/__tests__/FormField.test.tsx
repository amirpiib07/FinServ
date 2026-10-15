/**
 * Component and Accessibility Tests for FormField and Input
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { FormField } from '../FormField';
import { Input } from '../Input';

describe('FormField & Input Accessibility', () => {
  it('associates label, input, and hint text via ARIA attributes', () => {
    render(
      <FormField
        label="Account Holder Name"
        required
        hint="Enter full legal name as per PAN"
        htmlFor="holder-name"
      >
        <Input id="holder-name" placeholder="John Doe" />
      </FormField>
    );

    const input = screen.getByLabelText(/Account Holder Name/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', 'holder-name-hint');
    expect(screen.getByText('Enter full legal name as per PAN')).toHaveAttribute(
      'id',
      'holder-name-hint'
    );
  });

  it('wires error message with role="alert" and aria-invalid="true"', () => {
    render(
      <FormField
        label="PAN Card Number"
        error="Invalid PAN format. Must be 5 letters, 4 digits, 1 letter."
        htmlFor="pan-input"
      >
        <Input id="pan-input" />
      </FormField>
    );

    const input = screen.getByLabelText('PAN Card Number');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'pan-input-error');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid PAN format');
  });

  it('has zero accessibility violations according to axe', async () => {
    const { container } = render(
      <form>
        <FormField
          label="Customer Mobile Number"
          required
          hint="10-digit Indian mobile"
          htmlFor="cust-mobile"
        >
          <Input id="cust-mobile" type="tel" defaultValue="9876543210" />
        </FormField>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

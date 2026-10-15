/**
 * Component and Accessibility Tests for Modal
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  it('renders modal content when open is true', () => {
    render(
      <Modal
        open={true}
        onOpenChange={vi.fn()}
        title="Regulatory Compliance Disclosure"
        description="Please review mandatory RBI requirements."
      >
        <div>Compliance body content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Compliance Disclosure')).toBeInTheDocument();
    expect(screen.getByText('Compliance body content')).toBeInTheDocument();
  });

  it('has zero accessibility violations according to axe', async () => {
    const { container } = render(
      <Modal
        open={true}
        onOpenChange={vi.fn()}
        title="Accessible Banking Modal"
        description="Axe accessibility verification test."
      >
        <p>Accessible modal content</p>
      </Modal>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

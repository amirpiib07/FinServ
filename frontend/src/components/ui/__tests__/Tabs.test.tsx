/**
 * Component and Accessibility Tests for Tabs
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { Tabs } from '../Tabs';

describe('Tabs Component', () => {
  const tabs = [
    { id: 'tab1', label: 'Overview', content: <div>Overview Content</div> },
    { id: 'tab2', label: 'Transactions', content: <div>Transactions Content</div> },
  ];

  it('renders tab list and default active tab content', () => {
    render(<Tabs tabs={tabs} defaultValue="tab1" />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Transactions' })).toBeInTheDocument();
    expect(screen.getByText('Overview Content')).toBeInTheDocument();
  });

  it('switches tab panel when a different tab is clicked', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} defaultValue="tab1" />);
    await user.click(screen.getByRole('tab', { name: 'Transactions' }));
    expect(await screen.findByText('Transactions Content')).toBeInTheDocument();
  });

  it('has zero accessibility violations according to axe', async () => {
    const { container } = render(<Tabs tabs={tabs} defaultValue="tab1" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

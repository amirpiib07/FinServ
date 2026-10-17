import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '../AppLayout';

import { ThemeProvider } from '@/context/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders() {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/app']}>
          <AppLayout />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('AppLayout Mobile Drawer Focus Management', () => {
  it('traps focus in mobile drawer and returns focus to trigger on close', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const triggerButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(triggerButton).toBeInTheDocument();

    // Open mobile drawer
    await user.click(triggerButton);

    // Verify drawer dialog content is mounted
    const drawerDialog = screen.getByRole('dialog', { name: /mobile navigation menu/i });
    expect(drawerDialog).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close navigation menu/i });
    expect(closeButton).toBeInTheDocument();

    // Close mobile drawer by clicking close button
    await user.click(closeButton);

    // Verify mobile drawer is closed
    expect(screen.queryByRole('dialog', { name: /mobile navigation menu/i })).not.toBeInTheDocument();

    // Verify focus is restored to the trigger button
    expect(triggerButton).toHaveFocus();
  });
});

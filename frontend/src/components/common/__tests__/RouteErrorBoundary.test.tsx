import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as reactRouterDom from 'react-router-dom';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useRouteError: vi.fn(),
    isRouteErrorResponse: vi.fn(),
  };
});

describe('RouteErrorBoundary', () => {
  it('renders 404 message when route error is a 404 response', () => {
    vi.mocked(reactRouterDom.isRouteErrorResponse).mockReturnValue(true);
    vi.mocked(reactRouterDom.useRouteError).mockReturnValue({
      status: 404,
      statusText: 'Not Found',
      data: null,
      internal: false,
    });

    render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>
    );

    expect(screen.getByText(/404 — Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
  });

  it('renders application error with diagnostics and reload button for runtime errors', () => {
    vi.mocked(reactRouterDom.isRouteErrorResponse).mockReturnValue(false);
    vi.mocked(reactRouterDom.useRouteError).mockReturnValue(new Error('Chunk loading failed for /assets/lazyScreen.js'));

    render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>
    );

    expect(screen.getByText(/banking application error/i)).toBeInTheDocument();
    expect(screen.getByText(/Chunk loading failed for \/assets\/lazyScreen\.js/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
  });
});

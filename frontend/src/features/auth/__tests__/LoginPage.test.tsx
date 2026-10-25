import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

const { loginMock, reducedMotion } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  reducedMotion: { current: false },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => reducedMotion.current,
}));

const confirmedLogin = {
  accessToken: 'confirmed-access-token',
  refreshToken: 'confirmed-refresh-token',
  expiresInSeconds: 900,
  user: {
    id: 'customer-id',
    username: 'customer',
    email: 'customer@example.test',
    phoneNumber: '+910000000000',
    status: 'ACTIVE',
    roles: ['ROLE_CUSTOMER'],
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: null,
  },
};

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/dashboard" element={<h1>Dashboard is ready</h1>} />
        <Route path="/onboarding" element={<h1>Onboarding is ready</h1>} />
        <Route path="/admin/dashboard" element={<h1>Admin dashboard is ready</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /username or email/i }), 'customer');
  await user.type(screen.getByPlaceholderText('Enter your password'), 'valid-password');
}

describe('LoginPage confirmed transitions', () => {
  beforeEach(() => {
    loginMock.mockReset();
    reducedMotion.current = false;
  });

  it('starts the transition only after the login request confirms success', async () => {
    let resolveLogin: (response: typeof confirmedLogin) => void = () => undefined;
    loginMock.mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );
    const user = userEvent.setup();
    const { container } = renderLogin();
    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledOnce());
    expect(container.querySelector('.auth-login-card--success')).toBeNull();
    expect(screen.getByRole('button', { name: /signing in securely/i })).toBeDisabled();

    await act(async () => resolveLogin(confirmedLogin));

    expect(await screen.findByRole('button', { name: /continue now/i })).toBeInTheDocument();
    expect(container.querySelector('.auth-login-card--success')).toBeInTheDocument();
  }, 15000);

  it('does not play a success transition when login fails', async () => {
    loginMock.mockRejectedValue({ userMessage: 'Invalid credentials' });
    const user = userEvent.setup();
    const { container } = renderLogin();
    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(container.querySelector('.auth-login-card--success')).toBeNull();
    expect(screen.queryByRole('heading', { name: /dashboard is ready/i })).not.toBeInTheDocument();
  });

  it('skips movement and navigates immediately when reduced motion is requested', async () => {
    reducedMotion.current = true;
    loginMock.mockResolvedValue(confirmedLogin);
    const user = userEvent.setup();
    renderLogin();
    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('heading', { name: /dashboard is ready/i })).toBeInTheDocument();
  });

  it('shows inline validation before sending a request', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Enter a username or email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});

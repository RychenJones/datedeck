import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalAuthStore } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../../lib/pocketbase.js';
import AuthProvider from '../AuthProvider/AuthProvider.jsx';
import AuthPanel from './AuthPanel.jsx';

vi.mock('../../lib/pocketbase.js', () => ({
  pb: {
    authStore: null,
    collection: vi.fn(),
  },
}));

const users = {
  authWithPassword: vi.fn(),
  create: vi.fn(),
};

const gabriel = { id: 'user-1', name: 'Gabriel', email: 'gabriel@example.com' };

function fakeToken() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

// A PocketBase error with field details, like the SDK's ClientResponseError.
function pocketBaseError(status, data = {}) {
  return Object.assign(new Error('Failed'), { status, response: { status, data } });
}

function renderPanel() {
  return render(
    <AuthProvider>
      <AuthPanel />
    </AuthProvider>,
  );
}

describe('AuthPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pb.authStore = new LocalAuthStore();
    pb.collection.mockReturnValue(users);
    users.authWithPassword.mockImplementation(async () => {
      pb.authStore.save(fakeToken(), gabriel);
    });
    users.create.mockResolvedValue(gabriel);
  });

  it('signs you in with your email and password', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(users.authWithPassword).toHaveBeenCalledWith('gabriel@example.com', 'secret-password', {
      requestKey: null,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Signed in as Gabriel');
  });

  it('tells you when the email or password is missing', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Add a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Add your password.')).toBeInTheDocument();
    expect(users.authWithPassword).not.toHaveBeenCalled();
  });

  it('says so when the email and password do not match an account', async () => {
    const user = userEvent.setup();
    users.authWithPassword.mockRejectedValue(pocketBaseError(400));
    renderPanel();

    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password do not match an account.',
    );
    expect(screen.getByLabelText('Email')).toHaveValue('gabriel@example.com');
  });

  it('creates an account with your name, email and password', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'Gabriel');
    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Gabriel',
        email: 'gabriel@example.com',
        password: 'secret-password',
        passwordConfirm: 'secret-password',
      }),
      { requestKey: null },
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Signed in as Gabriel');
  });

  it('asks for a longer password when creating an account', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'Gabriel');
    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(users.create).not.toHaveBeenCalled();
  });

  it('says so when the email already has an account', async () => {
    const user = userEvent.setup();
    users.create.mockRejectedValue(
      pocketBaseError(400, { email: { code: 'validation_not_unique', message: 'Taken' } }),
    );
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'Gabriel');
    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There is already an account with that email. Sign in instead.',
    );
  });

  it('signs you out', async () => {
    const user = userEvent.setup();
    pb.authStore.save(fakeToken(), gabriel);
    renderPanel();

    expect(screen.getByRole('status')).toHaveTextContent('Signed in as Gabriel');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(pb.authStore.isValid).toBe(false);
  });
});

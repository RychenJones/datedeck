import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalAuthStore } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { pb } from '../lib/pocketbase.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    authStore: null,
    collection: vi.fn(),
    filter: vi.fn(),
    files: { getURL: vi.fn() },
  },
}));

const gabriel = { id: 'user-1', name: 'Gabriel', email: 'gabriel@example.com' };

function fakeToken() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

describe('Home account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    pb.authStore = new LocalAuthStore();
    pb.collection.mockReturnValue({
      getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }),
      authWithPassword: vi.fn(async () => pb.authStore.save(fakeToken(), gabriel)),
    });
  });

  it('closes the sign-in panel and shows no account card once you sign in', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.type(screen.getByLabelText('Email'), 'gabriel@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-password');
    await user.click(screen.getAllByRole('button', { name: 'Sign in' }).at(-1));

    expect(await screen.findByRole('button', { name: 'Signed in as Gabriel' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Your account' })).not.toBeInTheDocument(),
    );
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('signs you out from the menu on your name', async () => {
    const user = userEvent.setup();
    pb.authStore.save(fakeToken(), gabriel);
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Signed in as Gabriel' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(pb.authStore.isValid).toBe(false);
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveFocus();
    expect(screen.getByLabelText('Email')).not.toBeVisible();
  });
});

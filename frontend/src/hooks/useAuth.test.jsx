import { act, renderHook } from '@testing-library/react';
import { LocalAuthStore } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthProvider from '../components/AuthProvider/AuthProvider.jsx';
import { pb } from '../lib/pocketbase.js';
import { makeUsername, useAuth } from './useAuth.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    authStore: null,
    collection: vi.fn(),
  },
}));

const users = {
  authWithPassword: vi.fn(),
  create: vi.fn(),
};

// A token the SDK treats as valid: it only checks the expiry in the middle part.
function fakeToken() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

const gabriel = { id: 'user-1', name: 'Gabriel', email: 'gabriel@example.com' };

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pb.authStore = new LocalAuthStore();
    pb.collection.mockReturnValue(users);
    users.authWithPassword.mockImplementation(async () => {
      pb.authStore.save(fakeToken(), gabriel);
      return { token: pb.authStore.token, record: gabriel };
    });
    users.create.mockResolvedValue(gabriel);
  });

  it('starts signed out', () => {
    const { result } = renderAuth();

    expect(result.current.user).toBeNull();
  });

  it('signs you in with your email and password', async () => {
    const { result } = renderAuth();

    await act(() => result.current.signIn('gabriel@example.com', 'secret-password'));

    expect(pb.collection).toHaveBeenCalledWith('users');
    expect(users.authWithPassword).toHaveBeenCalledWith('gabriel@example.com', 'secret-password', {
      requestKey: null,
    });
    expect(result.current.user).toEqual(gabriel);
  });

  it('creates an account in the users collection and signs you in', async () => {
    const { result } = renderAuth();

    await act(() =>
      result.current.signUp({
        name: 'Gabriel',
        email: 'gabriel@example.com',
        password: 'secret-password',
      }),
    );

    expect(users.create).toHaveBeenCalledWith(
      {
        name: 'Gabriel',
        email: 'gabriel@example.com',
        password: 'secret-password',
        passwordConfirm: 'secret-password',
        username: expect.stringMatching(/^gabriel_[a-z0-9]+$/),
      },
      { requestKey: null },
    );
    expect(users.authWithPassword).toHaveBeenCalledOnce();
    expect(result.current.user).toEqual(gabriel);
  });

  it('stays signed in after a reload', async () => {
    const { result, unmount } = renderAuth();
    await act(() => result.current.signIn('gabriel@example.com', 'secret-password'));
    unmount();

    // A reload builds a new auth store from what the SDK saved in localStorage.
    pb.authStore = new LocalAuthStore();
    const reloaded = renderAuth();

    expect(reloaded.result.current.user).toEqual(gabriel);
  });

  it('signs you out and forgets the saved sign-in', async () => {
    const { result } = renderAuth();
    await act(() => result.current.signIn('gabriel@example.com', 'secret-password'));

    act(() => result.current.signOut());

    expect(result.current.user).toBeNull();
    expect(new LocalAuthStore().isValid).toBe(false);
  });
});

describe('makeUsername', () => {
  it('builds a username from the part of the email before the @', () => {
    expect(makeUsername('Gabriel.Wargha+dates@example.com')).toMatch(
      /^gabrielwarghadates_[a-z0-9]+$/,
    );
  });

  it('stays under the 50 character limit', () => {
    expect(makeUsername(`${'a'.repeat(80)}@example.com`).length).toBeLessThanOrEqual(50);
  });
});

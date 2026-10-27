import { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase.js';

export const AuthContext = createContext(null);

// The SDK keeps the sign-in in localStorage, so it is still there after a reload.
function currentUser() {
  return pb.authStore.isValid ? pb.authStore.record : null;
}

// The users collection needs a unique username, so build one from the email.
export function makeUsername(email) {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'user'}_${suffix}`;
}

/** The signed-in user behind AuthProvider (DD-10). Use useAuth() in components. */
export function useAuthState() {
  const [user, setUser] = useState(currentUser);

  // Follows sign in and sign out, including from other code that uses pb.authStore.
  useEffect(() => pb.authStore.onChange(() => setUser(currentUser())), []);

  async function signIn(email, password) {
    await pb.collection('users').authWithPassword(email, password, { requestKey: null });
  }

  async function signUp({ name, email, password }) {
    await pb
      .collection('users')
      .create(
        { name, email, password, passwordConfirm: password, username: makeUsername(email) },
        { requestKey: null },
      );
    await signIn(email, password);
  }

  function signOut() {
    pb.authStore.clear();
  }

  return { user, signIn, signUp, signOut };
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>.');
  return auth;
}

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

import './AuthPanel.css';

const EMPTY_FORM = { name: '', email: '', password: '' };
// PocketBase rejects passwords shorter than this.
const MIN_PASSWORD = 8;

function validate(values, mode) {
  const errors = {};

  if (mode === 'signup' && !values.name.trim()) errors.name = 'Add your name.';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Add a valid email address.';
  if (!values.password) {
    errors.password = 'Add your password.';
  } else if (mode === 'signup' && values.password.length < MIN_PASSWORD) {
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  }

  return errors;
}

// Turns a PocketBase error into words the person can act on.
function errorMessage(error, mode) {
  if (error?.response?.data?.email?.code === 'validation_not_unique') {
    return 'There is already an account with that email. Sign in instead.';
  }
  if (mode === 'signin' && error?.status === 400) {
    return 'That email and password do not match an account.';
  }
  if (mode === 'signup' && error?.status === 400) {
    return 'We could not create that account. Check your details and try again.';
  }
  return 'We could not reach DateDeck. Check your connection and try again.';
}

/** Sign in, create an account, or sign out (DD-10). */
export default function AuthPanel({ onClose }) {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('signin');
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function switchMode() {
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
    setErrors({});
    setMessage(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const newErrors = validate(values, mode);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setBusy(true);
    try {
      const email = values.email.trim();
      if (mode === 'signup') {
        await signUp({ name: values.name.trim(), email, password: values.password });
      } else {
        await signIn(email, values.password);
      }
      setValues(EMPTY_FORM);
    } catch (error) {
      setMessage(errorMessage(error, mode));
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    signOut();
    setMode('signin');
    setMessage(null);
  }

  function fieldProps(name) {
    return {
      id: `auth-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? 'true' : undefined,
      'aria-describedby': errors[name] ? `auth-${name}-error` : undefined,
    };
  }

  function fieldError(name) {
    if (!errors[name]) return null;
    return (
      <p className="auth__error" id={`auth-${name}-error`}>
        {errors[name]}
      </p>
    );
  }

  const closeButton = onClose && (
    <button className="auth__secondary" type="button" onClick={onClose}>
      Close
    </button>
  );

  if (user) {
    return (
      <div className="auth">
        <h2 id="auth-heading">Your account</h2>
        <p role="status">
          Signed in as <strong>{user.name || user.email}</strong>
        </p>
        {user.name && <p className="auth__muted">{user.email}</p>}
        <div className="auth__actions">
          <button className="auth__submit" type="button" onClick={handleSignOut}>
            Sign out
          </button>
          {closeButton}
        </div>
      </div>
    );
  }

  const signingUp = mode === 'signup';

  return (
    <form className="auth" onSubmit={handleSubmit} noValidate aria-labelledby="auth-heading">
      <h2 id="auth-heading">{signingUp ? 'Create your account' : 'Sign in'}</h2>
      <p className="auth__muted">
        {signingUp
          ? 'An account lets you add ideas, and your choices can follow you to any device.'
          : 'Sign in to add ideas with your name on them.'}
      </p>

      {signingUp && (
        <div className="auth__field">
          <label htmlFor="auth-name">Name</label>
          <input type="text" autoComplete="name" {...fieldProps('name')} />
          {fieldError('name')}
        </div>
      )}

      <div className="auth__field">
        <label htmlFor="auth-email">Email</label>
        <input type="email" autoComplete="email" inputMode="email" {...fieldProps('email')} />
        {fieldError('email')}
      </div>

      <div className="auth__field">
        <label htmlFor="auth-password">Password</label>
        <input
          type="password"
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          {...fieldProps('password')}
        />
        {fieldError('password')}
      </div>

      <div className="auth__actions">
        <button className="auth__submit" type="submit" disabled={busy}>
          {busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
        {closeButton}
      </div>

      {message && (
        <p className="auth__message" role="alert">
          {message}
        </p>
      )}

      <p className="auth__switch">
        {signingUp ? 'Already have an account?' : 'New to DateDeck?'}{' '}
        <button className="auth__link" type="button" onClick={switchMode}>
          {signingUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}

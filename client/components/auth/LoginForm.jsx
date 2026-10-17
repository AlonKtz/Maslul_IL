import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import FormError from '../common/FormError';

/*
  The sign in form. Checks the input here first so the member hears about an
  empty field straight away; the server checks it again anyway.
*/
export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) return setError('Please fill in both fields.');

    setBusy(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      window.location.href = res.redirect || '/feed';
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="login-username">Username</label>
      <input type="text" id="login-username" autoComplete="username" required
             value={username} onChange={(e) => setUsername(e.target.value)} />

      <label htmlFor="login-password">Password</label>
      <input type="password" id="login-password" autoComplete="current-password" required
             value={password} onChange={(e) => setPassword(e.target.value)} />

      <FormError message={error} />

      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

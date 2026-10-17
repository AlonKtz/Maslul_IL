import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import FormError from '../common/FormError';

/*
  The sign up form. The same rules as the server (src/routes/auth.jsx), so a
  mistake is caught before anything is sent.
*/
export default function RegisterForm() {
  const [form, setForm] = useState({ username: '', displayName: '', password: '', location: '', bio: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      username: form.username.trim(),
      displayName: form.displayName.trim(),
      password: form.password,
      location: form.location.trim(),
      bio: form.bio.trim(),
    };
    if (payload.username.length < 3 || payload.username.length > 20) {
      return setError('Username must be 3-20 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(payload.username)) {
      return setError('Username may only contain letters, numbers and underscore.');
    }
    if (payload.password.length < 6) return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      const res = await api.post('/auth/register', payload);
      window.location.href = res.redirect || '/feed';
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="reg-username">Username</label>
      <input type="text" id="reg-username" autoComplete="username" required minLength="3" maxLength="20"
             value={form.username} onChange={set('username')} />
      <small className="hint">3-20 characters: letters, numbers and underscore.</small>

      <label htmlFor="reg-display">Display name</label>
      <input type="text" id="reg-display" maxLength="40" value={form.displayName} onChange={set('displayName')} />

      <label htmlFor="reg-password">Password</label>
      <input type="password" id="reg-password" autoComplete="new-password" required minLength="6"
             value={form.password} onChange={set('password')} />

      <label htmlFor="reg-location">Location</label>
      <input type="text" id="reg-location" maxLength="60" placeholder="Tel Aviv"
             value={form.location} onChange={set('location')} />

      <label htmlFor="reg-bio">Short bio</label>
      <textarea id="reg-bio" maxLength="300" rows="3" placeholder="What do you drive?"
                value={form.bio} onChange={set('bio')} />

      <FormError message={error} />

      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}

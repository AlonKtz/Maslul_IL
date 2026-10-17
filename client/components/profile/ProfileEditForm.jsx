import React, { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';
import FormError from '../common/FormError';
import DeleteAccountButton from './DeleteAccountButton';

/*
  Editing my own profile: name, location, photo, bio, and a new password
  (which needs the current one). Closed until "Edit profile" is pressed
  (ProfileActions sends profile:edit). The page reloads after saving.
*/
export default function ProfileEditForm({ profileId, user }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    location: user.location || '',
    bio: user.bio || '',
    currentPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    document.addEventListener('profile:edit', toggle);
    return () => document.removeEventListener('profile:edit', toggle);
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword && form.newPassword.length < 6) return setError('The new password must be at least 6 characters.');
    if (form.newPassword && !form.currentPassword) return setError('Enter your current password to change it.');

    const payload = { displayName: form.displayName.trim(), location: form.location.trim(), bio: form.bio.trim() };
    // the password boxes left empty means keep the current password
    if (form.newPassword) {
      payload.newPassword = form.newPassword;
      payload.currentPassword = form.currentPassword;
    }

    setBusy(true);
    try {
      const file = fileRef.current && fileRef.current.files[0];
      if (file) payload.avatar = (await api.uploadImage(file)).url;
      await api.put('/api/users/' + profileId, payload);
      toast('Profile saved');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <section className="card">
      <h2>Edit your profile</h2>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div>
            <label htmlFor="p-name">Display name</label>
            <input id="p-name" type="text" maxLength="40" value={form.displayName} onChange={set('displayName')} />
          </div>
          <div>
            <label htmlFor="p-location">Location</label>
            <input id="p-location" type="text" maxLength="60" value={form.location} onChange={set('location')} />
          </div>
          <div>
            <label htmlFor="p-avatar">Profile photo</label>
            <input id="p-avatar" type="file" accept="image/*" ref={fileRef} />
          </div>
        </div>

        <label htmlFor="p-bio">Bio</label>
        <textarea id="p-bio" rows="3" maxLength="300" value={form.bio} onChange={set('bio')} />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />
        <p className="hint">Leave the password fields empty to keep your current password.</p>

        <div className="form-grid">
          <div>
            <label htmlFor="p-current">Current password</label>
            <input id="p-current" type="password" autoComplete="current-password"
                   value={form.currentPassword} onChange={set('currentPassword')} />
          </div>
          <div>
            <label htmlFor="p-new">New password</label>
            <input id="p-new" type="password" autoComplete="new-password"
                   value={form.newPassword} onChange={set('newPassword')} />
          </div>
        </div>

        <FormError message={error} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          <DeleteAccountButton profileId={profileId} />
        </div>
      </form>
    </section>
  );
}

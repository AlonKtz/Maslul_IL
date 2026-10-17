import React, { useState } from 'react';
import { api, errorText } from '../../lib/api';
import { toast } from '../../lib/toast';

/*
  "Demo User" on the landing and sign in pages: one click signs in as the
  shared demo member (POST /auth/demo), so nobody needs an account to look
  around. className lets each page give it its own button size.
*/
export default function DemoLoginButton({ className }) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const res = await api.post('/auth/demo');
      window.location.href = res.redirect || '/feed';
    } catch (err) {
      toast(errorText(err), true);
      setBusy(false);
    }
  }

  return (
    <button className={className || 'btn btn-ghost btn-block'} type="button" onClick={go} disabled={busy}>
      {busy ? 'Opening the demo...' : 'Demo User'}
    </button>
  );
}

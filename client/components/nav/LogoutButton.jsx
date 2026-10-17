import React from 'react';
import { api } from '../../lib/api';

export default function LogoutButton() {
  function logout() {
    api.post('/auth/logout').finally(() => { window.location.href = '/'; });
  }
  return <button className="btn btn-ghost" type="button" onClick={logout}>Log out</button>;
}

import React, { useEffect, useState } from 'react';

/*
  The little message that slides in at the bottom of the screen. Anything
  can show one with toast() from lib/toast.jsx.
*/
export default function Toast() {
  const [state, setState] = useState({ message: '', isError: false, visible: false });

  useEffect(() => {
    let timer = null;
    function show(e) {
      setState({ message: e.detail.message, isError: e.detail.isError, visible: true });
      clearTimeout(timer);
      timer = setTimeout(() => setState((s) => ({ ...s, visible: false })), 3200);
    }
    document.addEventListener('maslul:toast', show);
    return () => {
      document.removeEventListener('maslul:toast', show);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={'toast' + (state.visible ? ' is-visible' : '') + (state.isError ? ' is-error' : '')}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </div>
  );
}

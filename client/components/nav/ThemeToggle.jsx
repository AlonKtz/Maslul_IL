import React, { useEffect, useState } from 'react';
import { t, smoothSwitch } from '../../lib/i18n';

/*
  Light / dark mode.

  The whole palette lives in CSS variables, and the dark one takes over when
  <html> has data-theme="dark", so switching is just moving that attribute.
  The choice goes in a cookie so the server can put the attribute on the next
  page before it is drawn (views/partials/head.ejs). Charts listen for the
  theme:change event and redraw in the new colours.
*/
const root = document.documentElement;
const readTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme());
  const [, setLangTick] = useState(0);

  // the label is translated with t(), so redraw it when the language changes
  useEffect(() => {
    const onLang = () => setLangTick((n) => n + 1);
    document.addEventListener('i18n:change', onLang);
    return () => document.removeEventListener('i18n:change', onLang);
  }, []);

  function apply(next) {
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    document.cookie = 'theme=' + next + '; path=/; max-age=31536000; SameSite=Lax';
    setTheme(next);
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: next } }));
  }

  function onClick(e) {
    const next = readTheme() === 'dark' ? 'light' : 'dark';
    // the new colours grow out of the button in a circle
    const box = e.currentTarget.getBoundingClientRect();
    smoothSwitch(() => apply(next), { x: box.left + box.width / 2, y: box.top + box.height / 2 });
  }

  const label = t(theme === 'dark' ? 'Light mode' : 'Dark mode');
  return (
    <button type="button" className="theme-toggle" onClick={onClick}
            aria-label={label} title={label} aria-pressed={theme === 'dark'}>
      <svg className="icon-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="icon-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </g>
      </svg>
    </button>
  );
}

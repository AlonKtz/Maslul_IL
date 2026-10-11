/*
  Light / dark mode.

  The whole palette lives in CSS variables in style.css, and the dark one
  takes over when <html> has data-theme="dark". So switching is just moving
  that attribute: every colour on the page changes at once, no reload.

  The choice goes in a cookie so the server can put the attribute on the next
  page before it is drawn (see the head partial). Pages that draw their own
  colours, like the D3 charts, listen for the theme:change event and redraw.
*/
(function () {
  'use strict';

  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  // the button's label says what clicking it will do
  function label() {
    var text = current() === 'dark' ? 'Light mode' : 'Dark mode';
    if (window.I18N) text = window.I18N.t(text);
    document.querySelectorAll('[data-toggle-theme]').forEach(function (b) {
      b.setAttribute('aria-label', text);
      b.setAttribute('title', text);
      b.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false');
    });
  }

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    document.cookie = 'theme=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
    label();
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: theme } }));
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-toggle-theme]');
    if (!btn) return;
    var next = current() === 'dark' ? 'light' : 'dark';
    // the new colours grow out of the button in a circle (smoothSwitch is in
    // i18n.js, which loads first)
    var box = btn.getBoundingClientRect();
    var origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    if (window.smoothSwitch) window.smoothSwitch(function () { apply(next); }, origin);
    else apply(next);
  });

  // the language switch rewrites labels, so put ours back in the new language
  document.addEventListener('i18n:change', label);

  label();
  window.Theme = { current: current, set: apply };
})();

/*
  The menu button on phones.

  On narrow screens the links in the top bar are folded away behind a three
  line button. Pressing it opens them as a panel under the bar. On a computer
  the button is hidden by the css and none of this does anything.
*/
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var button = document.querySelector('.nav-burger');
  if (!header || !button) return;

  function setOpen(open) {
    header.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    var text = open ? 'Close menu' : 'Menu';
    button.setAttribute('aria-label', window.I18N ? window.I18N.t(text) : text);
  }

  button.addEventListener('click', function () {
    setOpen(!header.classList.contains('menu-open'));
  });

  // close it again: on the Escape key, on a tap outside the bar, and when a
  // link inside it is used
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('menu-open') && !header.contains(e.target)) setOpen(false);
  });
  header.querySelectorAll('.nav-menu a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  // turning a tablet sideways can make the screen wide enough for the normal
  // bar, so drop the open state then
  var wide = window.matchMedia('(min-width: 901px)');
  (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(function (e) {
    if (e.matches) setOpen(false);
  });
})();

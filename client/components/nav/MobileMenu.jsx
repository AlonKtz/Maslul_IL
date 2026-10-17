import React, { useEffect, useState } from 'react';
import { t } from '../../lib/i18n';

/*
  The three line menu button on phones. On narrow screens the links in the
  top bar fold away behind it (see .nav-burger in style.css); on a computer
  the button is hidden and this does nothing. The panel itself is the
  server rendered .nav-menu, this only opens and closes it.
*/
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  // the header carries the open state, the css does the rest
  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (header) header.classList.toggle('menu-open', open);
  }, [open]);

  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (!header) return undefined;

    // close it on Escape, on a tap outside the bar, and when a link is used
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (!header.contains(e.target)) setOpen(false);
      else if (e.target.closest('.nav-menu a')) setOpen(false);
    };
    // turning a tablet sideways can make the normal bar fit again
    const wide = window.matchMedia('(min-width: 901px)');
    const onWide = (e) => { if (e.matches) setOpen(false); };

    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      wide.removeEventListener('change', onWide);
    };
  }, []);

  return (
    <button type="button" className="nav-burger" aria-controls="nav-menu" aria-expanded={open}
            aria-label={t(open ? 'Close menu' : 'Menu')} onClick={() => setOpen(!open)}>
      <span></span><span></span><span></span>
    </button>
  );
}

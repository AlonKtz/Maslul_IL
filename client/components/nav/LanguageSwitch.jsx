import React, { useEffect, useState } from 'react';
import { currentLang } from '../../lib/i18n';

/*
  עב | EN in the top bar. The buttons carry data-set-lang, and lib/i18n.jsx
  does the actual switch (no reload). The two labels are never translated,
  each one is always written in its own language (data-no-i18n).
*/
export default function LanguageSwitch() {
  const [lang, setLang] = useState(currentLang());

  useEffect(() => {
    const onChange = (e) => setLang(e.detail.lang);
    document.addEventListener('i18n:change', onChange);
    return () => document.removeEventListener('i18n:change', onChange);
  }, []);

  return (
    <div className="lang-switch" data-no-i18n role="group" aria-label="Language">
      <button type="button" data-set-lang="he" className={lang === 'he' ? 'is-active' : ''} lang="he">עב</button>
      <button type="button" data-set-lang="en" className={lang === 'en' ? 'is-active' : ''} lang="en">EN</button>
    </div>
  );
}

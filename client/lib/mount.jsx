import React from 'react';
import { createRoot } from 'react-dom/client';

/*
  Puts React components onto the server rendered pages.

  An EJS page marks the spot with <div data-react="Name" data-props='{...}'>,
  and each page bundle calls mount({ Name: Component, ... }) with the
  components it brings. Whatever the server put inside the div (the same
  markup, rendered on the server) is shown until React takes over, so there
  is no blank flash.
*/
export function mount(components) {
  document.querySelectorAll('[data-react]').forEach((node) => {
    const name = node.getAttribute('data-react');
    const Component = components[name];
    if (!Component || node.dataset.mounted) return;

    let props = {};
    const raw = node.getAttribute('data-props');
    if (raw) {
      try {
        props = JSON.parse(raw);
      } catch (err) {
        console.warn('[react] could not read the props for ' + name, err);
      }
    }
    node.dataset.mounted = '1';
    createRoot(node).render(<Component {...props} />);
  });
}

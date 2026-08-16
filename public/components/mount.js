/**
 * Mounts the React components into the pages that ask for them.
 *
 * A page marks a spot with <div data-react="CanvasMap" data-props='…'></div>
 * and this file renders the matching component there. It is the equivalent of
 * the "use client" boundary in other frameworks: the rest of the site is
 * server-rendered EJS, and React is used only where it earns its place.
 */
(function () {
  'use strict';

  // Babel compiles the .jsx files in the background, so a component may not
  // exist yet when this runs. Each placeholder waits for its component to
  // appear rather than failing on the first try.
  function whenReady(name, callback, waited) {
    waited = waited || 0;

    if (typeof window[name] === 'function') return callback(window[name]);

    if (waited > 8000) {
      console.warn('[react] component ' + name + ' never became available');
      return;
    }
    window.setTimeout(function () { whenReady(name, callback, waited + 50); }, 50);
  }

  function mountAll() {
    var nodes = document.querySelectorAll('[data-react]');

    Array.prototype.forEach.call(nodes, function (node) {
      var name = node.getAttribute('data-react');

      var props = {};
      var raw = node.getAttribute('data-props');
      if (raw) {
        try {
          props = JSON.parse(raw);
        } catch (err) {
          console.warn('[react] could not read props for ' + name, err);
        }
      }

      whenReady(name, function (Component) {
        var root = ReactDOM.createRoot(node);
        root.render(React.createElement(Component, props));
        // Kept so a page can re-render a component with new props later.
        node._reactRoot = root;
        node._reactComponent = Component;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();

/*
  This is what puts the React components onto the pages that want them.

  A page marks the spot with a div carrying data-react="CanvasMap" and the
  props as json, and this file finds those divs and renders the right
  component into each one.

  I did it this way because the rest of the site is normal EJS rendered on the
  server. React is only used for the two bits that actually need it, the map
  and the video player, rather than taking over the whole site.
*/
(function () {
  'use strict';

  // Babel compiles the jsx files in the background, which means the component
  // might not exist yet at the moment this runs. That was a real bug, the map
  // just did not appear sometimes. So instead of giving up on the first try,
  // each spot waits and keeps checking until its component shows up.
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
        // I keep these so a page can re-render the component with different props
        // later on. the search page uses it when you switch the dropdown.
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

/*
  The little message at the bottom of the screen. Any component calls
  toast('Saved') or toast('Something failed', true); the Toast component
  (components/common/Toast.jsx) listens and shows it.
*/
export function toast(message, isError) {
  document.dispatchEvent(new CustomEvent('maslul:toast', { detail: { message, isError: Boolean(isError) } }));
}

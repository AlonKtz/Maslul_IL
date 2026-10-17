/*
  Who is looking at the page. The server puts the signed in member's id and
  role on the body tag (views/partials/head.ejs). Used only to decide what to
  show, never for permissions: the server checks those itself.
*/
export const currentUserId = document.body.dataset.userId || '';
export const currentRole = document.body.dataset.userRole || 'guest';
export const isAdmin = currentRole === 'admin';

export function isMine(id) {
  return Boolean(id) && String(id) === String(currentUserId);
}

/*
  Dates and prices, written the same way everywhere on the site.
  Dates are always written in English here; the Hebrew switch (i18n.jsx)
  swaps the month names on the page.
*/
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "14 Aug 2026, 19:30"
export function formatDateTime(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hh + ':' + mm;
}

// "14 Aug 2026"
export function formatDate(value) {
  return formatDateTime(value).split(',')[0];
}

// "₪ 12,500"
export function formatPrice(value) {
  return '₪ ' + (Number(value) || 0).toLocaleString('en-US');
}

// the value a datetime-local input wants: "2026-08-14T19:30"
export function toInputDateTime(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

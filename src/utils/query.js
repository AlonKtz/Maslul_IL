/**
 * Small helpers shared by the search/list controllers.
 */

// Escapes user text before putting it inside a RegExp, so a search for
// "c++" or "(" cannot break the query or become a slow/hostile pattern.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Builds a case-insensitive "contains" matcher from user input.
function contains(text) {
  return new RegExp(escapeRegex(String(text).trim()), 'i');
}

// Reads page/limit from a query string safely and clamps them, so a request
// like ?limit=999999 cannot be used to pull the whole database.
function paginate(reqQuery, defaultLimit = 20, maxLimit = 50) {
  const page = Math.max(1, parseInt(reqQuery.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(reqQuery.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

// Parses a number from user input, returning null when it is absent/invalid.
function num(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Parses a date from user input, returning null when it is absent/invalid.
function date(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { escapeRegex, contains, paginate, num, date };

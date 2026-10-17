/*
  Small helper functions that the search and list controllers all share.
*/

// cleans up text before I drop it into a regex. without this, searching for
// something like "c++" or "(" would either break the query or make a really
// slow pattern that hammers the database.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// builds a "contains this text" matcher that ignores upper and lower case
function contains(text) {
  return new RegExp(escapeRegex(String(text).trim()), 'i');
}

// reads page and limit off the query string and keeps them in sane bounds.
// stops someone asking for ?limit=999999 and pulling the whole database out.
function paginate(reqQuery, defaultLimit = 20, maxLimit = 50) {
  const page = Math.max(1, parseInt(reqQuery.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(reqQuery.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

// turns user input into a number, or null if it is missing or not a number
function num(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// turns user input into a date, or null if it is missing or not a real date
function date(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { escapeRegex, contains, paginate, num, date };

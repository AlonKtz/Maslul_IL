/**
 * Decides whether a request should be answered with JSON or with a page.
 *
 * We look at the path and at whether it is an Ajax call, rather than at the
 * Accept header: a plain request carries "Accept: * / *", which would make a
 * content-negotiation check answer "json" and send raw JSON to somebody who
 * typed the address into their browser.
 */
function wantsJson(req) {
  return req.path.startsWith('/api') || req.xhr === true;
}

module.exports = wantsJson;

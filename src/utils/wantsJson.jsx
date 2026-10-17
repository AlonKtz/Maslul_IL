/*
  Works out whether to answer a request with json or with a normal html page.

  I check the url and whether it is an ajax call. I do not check the Accept
  header, which was my first try. The problem is a plain request sends
  Accept: star slash star, which matches json, so someone who just typed the
  address in their browser got raw json back instead of the page.
*/
function wantsJson(req) {
  return req.path.startsWith('/api') || req.xhr === true;
}

module.exports = wantsJson;

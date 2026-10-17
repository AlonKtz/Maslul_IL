/*
  Every call the browser makes to the server goes through here, so the json
  headers and the error handling are written once.

  Each function returns a promise with the json the server sent back. When the
  server answers with an error the promise is rejected with an Error whose
  message is the server's own message, so a component can just show it.
*/

const NO_SERVER = 'Cannot reach the server. Check your connection.';
const GENERIC = 'Something went wrong. Please try again.';

async function request(method, url, body, isForm) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: isForm ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body)),
    });
  } catch (err) {
    throw Object.assign(new Error(NO_SERVER), { status: 0 });
  }

  let data = null;
  try { data = await res.json(); } catch (err) { /* empty or not json */ }

  if (!res.ok) {
    const message = (data && data.error) || GENERIC;
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data;
}

// turns { a: 1, b: '' } into ?a=1, leaving out empty values
function query(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? '?' + s : '';
}

export const api = {
  get: (url, params) => request('GET', url + query(params)),
  post: (url, body) => request('POST', url, body === undefined ? {} : body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),

  // one image, gives back { url }
  uploadImage(file) {
    const form = new FormData();
    form.append('image', file);
    return request('POST', '/api/upload', form, true);
  },

  // up to six images, gives back { urls }
  uploadImages(files) {
    const form = new FormData();
    Array.from(files).slice(0, 6).forEach((f) => form.append('images', f));
    return request('POST', '/api/upload/many', form, true);
  },

  // a video for the motorsport page, gives back { url, clips }
  uploadVideo(file, title) {
    const form = new FormData();
    form.append('video', file);
    if (title) form.append('title', title);
    return request('POST', '/api/upload/video', form, true);
  },
};

// the message to show for anything that went wrong
export function errorText(err) {
  return (err && err.message) || GENERIC;
}

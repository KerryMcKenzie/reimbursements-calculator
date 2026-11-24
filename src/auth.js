// Talks to the Netlify Edge Function in netlify/edge-functions/auth.js.
// The real user name/password check happens on Netlify's server; the browser
// only ever receives an HttpOnly session cookie it cannot read.

const post = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });

export async function login(username, password) {
  try {
    const res = await post('/api/login', { username, password });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Incorrect user name or password.' };

    // Local `npm run dev` has no Netlify server, so /api/login doesn't exist.
    // Let developers in locally; production always goes through the server check.
    if (import.meta.env.DEV && res.status === 404) {
      console.warn('[auth] No Netlify server running locally — skipping password check (dev only).');
      return { ok: true };
    }
    return { ok: false, error: 'Sign-in is unavailable right now. Please try again later.' };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
}

export async function logout() {
  try {
    await post('/api/logout');
  } catch {
    // Even if the request fails, the session cookie still ends when the browser closes.
  }
}

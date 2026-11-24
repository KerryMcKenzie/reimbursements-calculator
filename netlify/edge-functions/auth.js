// Server-side sign-in for the app's own login page (runs on Netlify, never in the browser).
//
//   POST /api/login   { username, password }  → checks against Netlify env vars,
//                                               sets an HttpOnly session cookie
//   POST /api/logout                          → clears the session cookie
//   GET  /app/*       (the protected tool)    → only served with a valid session
//
// The session cookie has no expiry date, so the browser deletes it when it closes.
// A 12-hour limit is also signed into the cookie as a backstop.
//
// Netlify environment variables (Site configuration → Environment variables):
//   SITE_PASSWORD    required — the password you give people
//   SITE_USERNAME    optional — if set, the user name must match exactly
// After changing either one, trigger a new deploy. Changing the password also
// signs everyone out (old sessions stop working).

/* global Netlify */ // provided by Netlify's edge runtime

const COOKIE = 'rc_session';
const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
const enc = new TextEncoder();

// ---- helpers ---------------------------------------------------------------
const json = (status, body, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Compare two strings without leaking timing information.
const safeEqual = async (a, b) => {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
};

// Signing key is derived from the password, so a new password invalidates old sessions.
const signingKey = (password) =>
  crypto.subtle.importKey(
    'raw',
    enc.encode(`session-key:${password}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

const sign = async (payload, password) =>
  b64url(await crypto.subtle.sign('HMAC', await signingKey(password), enc.encode(payload)));

const makeToken = async (password) => {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + MAX_SESSION_MS })));
  return `${payload}.${await sign(payload, password)}`;
};

const isValidToken = async (token, password) => {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!(await safeEqual(sig, await sign(payload, password)))) return false;
  try {
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(padded));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
};

const readCookie = (request, name) => {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
};

// No Max-Age/Expires → a "session cookie" that the browser deletes when it closes.
const sessionCookie = (token) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`;
const clearCookie = () =>
  `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

const sameOrigin = (request) => {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- handler ---------------------------------------------------------------
export default async (request, context) => {
  const { pathname } = new URL(request.url);
  const password = Netlify.env.get('SITE_PASSWORD');
  const expectedUser = Netlify.env.get('SITE_USERNAME');

  // Fail closed: without a configured password nobody can sign in.
  if (!password) return json(503, { error: 'Site password is not configured.' });

  // ---- sign in ----
  if (pathname === '/api/login') {
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
    if (!sameOrigin(request)) return json(403, { error: 'Forbidden' });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return json(400, { error: 'Bad request' });
    const username = String(body.username ?? '').trim();
    const pass = String(body.password ?? '');

    const passOk = await safeEqual(pass, password);
    const userOk = expectedUser ? await safeEqual(username, expectedUser.trim()) : true;

    if (!passOk || !userOk) {
      await wait(800); // slow down password guessing
      return json(401, { error: 'Incorrect user name or password.' });
    }
    return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(await makeToken(password)) });
  }

  // ---- sign out ----
  if (pathname === '/api/logout') {
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
    return json(200, { ok: true }, { 'Set-Cookie': clearCookie() });
  }

  // ---- protected tool files (/app/*) ----
  if (!(await isValidToken(readCookie(request, COOKIE), password))) {
    return json(401, { error: 'Sign in required.' });
  }
  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'private, no-store'); // don't keep a copy after sign-out
  return out;
};

export const config = { path: ['/api/login', '/api/logout', '/app/*'] };

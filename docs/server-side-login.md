# Server-side password login for a Vite + React app on Netlify (free plan)

A reusable recipe for putting a real password in front of a static Vite/React site
hosted on Netlify, **without** Netlify Pro and **without** the password ever appearing in
the browser's files. First used in *scoping-discovery*; this copy is set up for *reimbursements-calculator*.

## What you get

- Your own styled login page (no browser pop-up box).
- The user name and password are checked **on Netlify's server** by an Edge Function.
  The values live only in Netlify environment variables, not in code or GitHub.
- The app itself (everything after login) is **not downloadable** until the password is
  accepted, so it can't be bypassed with browser developer tools.
- The sign-in ends when the **browser closes** or the user clicks **Sign out**
  (with a 12-hour limit as a backstop).
- Changing the password signs everyone out.

## How it works

```
Browser                                   Netlify Edge Function (server)
-------                                   ------------------------------
Login page (public)  ── POST /api/login ──▶ compare with SITE_USERNAME / SITE_PASSWORD
                     ◀── Set-Cookie ─────── signed HttpOnly session cookie (no expiry date)
Load the tool        ── GET /app/*.js  ───▶ valid cookie? serve file : 401
Sign out             ── POST /api/logout ─▶ clear cookie
```

- **Public:** `index.html`, the login page bundle (`/assets/*`), `robots.txt`.
- **Protected:** `/app/*` (the main tool), served only with a valid cookie.
- The cookie is `HttpOnly` (JavaScript can't read it), `Secure` (HTTPS only),
  `SameSite=Strict` (not sent from other sites) and has no `Max-Age`, so it's a
  session cookie the browser deletes when it closes.

## Files

| File | Purpose |
|---|---|
| `netlify/edge-functions/auth.js` | Server-side check: `/api/login`, `/api/logout`, guards `/app/*` |
| `src/auth.js` | `login()` / `logout()` helpers that call the endpoints |
| `src/Root.jsx` | Shows `LoginPage` until signed in, then lazy-loads `App.jsx` |
| `src/LoginPage.jsx` | The login form (public) |
| `src/App.jsx` | The protected tool; receives `user` and `onLogout` props |
| `src/main.jsx` | Renders `<Root />` instead of `<App />` |
| `vite.config.js` | Builds `App.jsx` into `dist/app/` so it can be protected |

Anything the login page imports (shared components, styles) ends up in the **public**
bundle. Keep anything sensitive inside `App.jsx` or files only it imports.

## Adding this to another project

1. **Copy** `netlify/edge-functions/auth.js`, `src/auth.js` and `src/Root.jsx`.
   Change `COOKIE` in `auth.js` to a name unique to the project (e.g. `rc_session`).
2. **Split the login page** into its own file (`src/LoginPage.jsx`). On submit it should:
   ```js
   const result = await login(username, password);       // from src/auth.js
   if (!result.ok) return setError(result.error);
   try { await onLogin({ name, email }); }                // loads the protected app
   catch { setError('Signed in, but the app could not load. Please refresh.'); }
   ```
   Use a real `<form onSubmit={...}>` so Enter works.
3. **Make the main app a prop-driven component:**
   `export default function App({ user, onLogout })`. Remove its own login state, and
   wire its Sign out button to `onLogout`.
4. **Point `src/main.jsx` at `Root`:** `import Root from './Root.jsx'` and render `<Root />`.
5. **Add the build split to `vite.config.js`:**
   ```js
   build: {
     rollupOptions: {
       output: {
         chunkFileNames: (chunk) =>
           chunk.facadeModuleId?.replace(/\\/g, '/').endsWith('/src/App.jsx')
             ? 'app/[name]-[hash].js'
             : 'assets/[name]-[hash].js',
       },
     },
   },
   ```
   Check: after `npm run build` there should be a `dist/app/App-xxxx.js` file, and your
   app's text should appear only in that file.
6. **If ESLint complains** about `Netlify` being undefined, keep the
   `/* global Netlify */` comment at the top of the edge function.

## Netlify setup (free plan)

1. **Site configuration → Environment variables → Add a variable**
   - `SITE_PASSWORD`: the password you hand out (required)
   - `SITE_USERNAME`: e.g. `demo` (optional; if unset, any user name is accepted)
   - Don't tick **Contains secret values** (it can lock the variable on the free plan).
   - Scopes can't be chosen on the free plan; the default "all scopes" is fine.
2. **Never prefix these with `VITE_`.** Vite copies `VITE_*` variables into the browser
   bundle, which would expose the password.
3. Push to GitHub, or use **Deploys → Trigger deploy**. Variable changes only take effect
   after a new deploy.
4. Remove any old Basic-Auth edge function or `Basic-Auth` header, otherwise the browser
   pop-up will still appear.

## Testing

- **Locally (`npm run dev`):** there's no Netlify server, so `/api/login` returns 404 and
  `src/auth.js` lets you in with any password (dev only, with a console warning).
  To test the real check locally, run `npx netlify-cli dev`.
- **On Netlify:** use a private or incognito window.
  1. A wrong password shows "Incorrect user name or password."
  2. The right one opens the tool.
  3. Sign out returns you to the login page; opening `/app/...` directly should give 401.
  4. Fully close the browser and reopen; you should be asked to sign in again.

## Good to know

- **"Close the browser" means fully quit.** Chrome on Windows can keep running in the
  background, and "Continue where you left off" can restore session cookies. If people
  stay signed in after closing, that setting is why. The 12-hour limit still applies.
- **Changing the password** (then redeploying) signs everyone out immediately.
- **Password guessing** is slowed by an 0.8 s delay on each wrong attempt. Edge Functions
  don't keep memory between requests, so there's no lockout; use a long passphrase.
- **Chrome may offer to save the password.** That's the user's choice and stays in their
  browser only.
- **One shared password = no individual accounts.** For per-person logins, look at
  Netlify Identity or an auth provider instead.

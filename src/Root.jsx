import { useState, lazy, Suspense } from 'react';
import LoginPage from './LoginPage.jsx';
import { logout } from './auth.js';

// The tool itself (App.jsx) is built into a separate file under /app/, which the
// Netlify Edge Function only serves to signed-in browsers. It is downloaded
// only after a successful login — never before.
const loadApp = () => import('./App.jsx');
const App = lazy(loadApp);

const Loading = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f6fb',
    color: '#6b7a99',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }}>
    Loading…
  </div>
);

export default function Root() {
  const [user, setUser] = useState(null);

  // Called by LoginPage after the server accepts the password.
  // Downloads the protected app first; throws if the server refuses it.
  const handleLogin = async (u) => {
    await loadApp();
    setUser(u);
  };

  const handleLogout = async () => {
    await logout(); // server clears the session cookie
    setUser(null);  // unmounting App also clears all entered data
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <Suspense fallback={<Loading />}>
      <App user={user} onLogout={handleLogout} />
    </Suspense>
  );
}

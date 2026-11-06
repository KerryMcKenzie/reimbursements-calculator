import { useState, useEffect } from 'react';

// ---- Form helpers ---------------------------------------------------------
const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#1a2b4a',
      marginBottom: '6px',
      letterSpacing: '0.02em',
    }}>
      {label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
    </label>
    {hint && (
      <div style={{ fontSize: '12px', color: '#6b7a99', marginBottom: '8px', fontStyle: 'italic' }}>
        {hint}
      </div>
    )}
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  background: '#fff',
  color: '#1a2b4a',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  outline: 'none',
};

const TextInput = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={inputStyle}
    onFocus={(e) => { e.target.style.borderColor = '#2E8CFF'; e.target.style.boxShadow = '0 0 0 3px rgba(46,140,255,0.25)'; }}
    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
  />
);


// ---- Legal content (Privacy Policy / Terms of Use) --------------------------
const LEGAL_UPDATED = 'November 6, 2026';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Demo environment',
        body: 'This Discovery Tool is a demonstration application. It is provided for testing and evaluation purposes only.',
      },
      {
        heading: 'No personal information is collected or stored',
        body: 'We do not capture, save, or transmit any Personally Identifiable Information (PII), such as your name or email address. Anything you type into this site stays in your browser only while the page is open and is cleared when you sign out, refresh, or close the tab. Nothing is sent to a server, database, or third party.',
      },
      {
        heading: 'Use test details only',
        body: 'Please do not enter real personal or company information. For demo testing, sign in with:',
        demo: true,
      },
      {
        heading: 'Cookies and tracking',
        body: 'This site does not use cookies, analytics, or tracking technologies.',
      },
      {
        heading: 'Exports',
        body: 'If you export a PDF or JSON file, it is created locally in your browser and saved only to your own device.',
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    sections: [
      {
        heading: 'Demo purposes only',
        body: 'This Discovery Tool is a demonstration application for testing and evaluation. It is not a production service.',
      },
      {
        heading: 'Provided "as is"',
        body: 'The site is provided "as is" without warranties of any kind. Features such as SSO sign-in and Salesforce attachment are simulated and do not connect to real systems.',
      },
      {
        heading: 'Acceptable use',
        body: 'Use only fictional or test data. Do not enter confidential, sensitive, or personal information.',
      },
      {
        heading: 'No liability',
        body: 'We are not liable for any loss or damage arising from your use of this demo, including any decisions made based on its output.',
      },
      {
        heading: 'Changes',
        body: 'These terms may be updated at any time. Continued use of the site means you accept the current version.',
      },
    ],
  },
};

const LegalModal = ({ type, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = LEGAL_CONTENT[type];
  if (!content) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,29,58,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(26,43,74,0.25)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h2 id="legal-title" style={{ fontSize: '19px', fontWeight: 700, color: '#1a2b4a', margin: 0 }}>
            {content.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              lineHeight: 1,
              color: '#8a97b3',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#8a97b3', margin: '0 0 18px' }}>
          Last updated {LEGAL_UPDATED}
        </p>

        {content.sections.map((s) => (
          <div key={s.heading} style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2b4a', margin: '0 0 4px' }}>
              {s.heading}
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#4a5878', margin: 0 }}>
              {s.body}
            </p>
            {s.demo && (
              <div style={{
                marginTop: '8px',
                background: '#F7F9FC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#1a2b4a',
              }}>
                <div><strong>Name:</strong> User Test</div>
                <div><strong>Email:</strong> user.test@company.com</div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '4px',
            padding: '10px',
            background: '#2E8CFF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const legalLinkStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#2E8CFF',
  fontSize: '12px',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontFamily: 'inherit',
};

// ---- Login Page -----------------------------------------------------------
const LoginPage = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [legal, setLegal] = useState(null); // 'privacy' | 'terms' | null

  const canSubmit = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setLoading(true);
    // Simulate federated SSO roundtrip
    setTimeout(() => onLogin({ name: name.trim(), email: email.trim() }), 700);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F9FC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative gradient accent */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,140,255,0.10) 0%, rgba(46,140,255,0) 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,201,167,0.08) 0%, rgba(0,201,167,0) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 10px 40px rgba(26,43,74,0.08), 0 2px 8px rgba(26,43,74,0.04)',
        border: '1px solid #E2E8F0',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0B1D3A, #122B52)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C9A7',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>
            RC
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#1a2b4a',
            margin: '0 0 14px',
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: '#00A88A' }}>Reimbursements</span> Calculator
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7a99', margin: 0 }}>
            Use Demo Credentials: User Test, user.test@company.com
          </p>
           <p style={{ fontSize: '14px', color: '#6b7a99', margin: 0 }}>
            This is a simulated SSO login
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Field label="Full Name" required>
          <TextInput value={name} onChange={setName} placeholder="User Test" />
        </Field>

        <Field label="Work Email" required>
          <TextInput value={email} onChange={setEmail} placeholder="user.test@company.com" type="email" />
        </Field>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            background: canSubmit
              ? '#2E8CFF'
              : '#c5ccdd',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.15s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Authenticating…' : 'Sign in with SSO'}
        </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eef1f8',
          fontSize: '12px',
          color: '#8a97b3',
          textAlign: 'center',
        }}>
          Secured by Federated Identity · Demo Environment
          <div style={{ marginTop: '10px' }}>
            <button type="button" style={legalLinkStyle} onClick={() => setLegal('privacy')}>
              Privacy Policy
            </button>
            <span style={{ margin: '0 8px' }}>·</span>
            <button type="button" style={legalLinkStyle} onClick={() => setLegal('terms')}>
              Terms of Use
            </button>
          </div>
        </div>
      </div>

      {legal && <LegalModal type={legal} onClose={() => setLegal(null)} />}
    </div>
  );
};

export default LoginPage;

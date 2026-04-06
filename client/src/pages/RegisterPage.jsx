import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function RegisterPage({ goToLogin }) {
  const { signIn, signUpWithEmail, error, setError } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [localErr, setLocalErr] = useState('');

  const displayError = localErr || error;

  const strength = (() => {
    let s = 0;
    if (password.length >= 6)           s++;
    if (/[A-Z]/.test(password))         s++;
    if (/[0-9!@#$%^&*]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-accent'][strength];
  const strengthText  = ['', 'text-red-400', 'text-yellow-400', 'text-accent'][strength];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalErr('');
    if (!name.trim())       return setLocalErr('Name is required.');
    if (!email.trim())      return setLocalErr('Email is required.');
    if (password.length < 6) return setLocalErr('Password must be at least 6 characters.');
    if (password !== confirm) return setLocalErr('Passwords do not match.');
    setLoading(true);
    const result = await signUpWithEmail(name.trim(), email, password);
    setLoading(false);
    if (result.success) setSuccess(true);
    else setLocalErr(result.error);
  };

  const handleGoogle = async () => {
    setLocalErr(''); setError('');
    await signIn();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="bg-bg-secondary border border-border rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent-faint border border-accent/20 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Account created!</h1>
          <p className="text-sm text-text-secondary">You're signed in and ready to go. Taking you to Lumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent opacity-[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">Lumen</p>
          <h1 className="text-xl font-semibold text-text-primary mb-1">Create an account</h1>
          <p className="text-sm text-text-secondary mb-6">Your documents, your conversations — private and yours.</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-bg-card border border-border rounded-xl text-sm font-medium text-text-primary hover:border-border-light hover:bg-bg-hover transition-all duration-150 mb-4"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3.5" noValidate>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Full name</label>
              <input
                type="text"
                placeholder="Harsh Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder-text-hint outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder-text-hint outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder-text-hint outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPass ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-border'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[11px] font-medium ${strengthText} min-w-[32px] text-right`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder-text-hint outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {displayError && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-bg-primary text-sm font-semibold rounded-xl hover:bg-accent-soft transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            Already have an account?{' '}
            <button
              onClick={goToLogin}
              className="text-accent hover:text-accent-soft font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
function EyeOn()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }

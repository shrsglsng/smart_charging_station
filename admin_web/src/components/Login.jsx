import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

const Login = ({ onLoginSuccess, theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.email);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Sleek background details */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30 dark:opacity-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-muted rounded-full blur-3xl opacity-20 dark:opacity-5" />

      {/* Main card matching Shadcn */}
      <div className="w-full max-w-[420px] bg-card text-card-foreground rounded-lg shadow-xl border border-border p-10 relative z-10 transition-colors duration-300">
        <div className="flex flex-col items-center mb-8">
          {/* Logo element identical to Navbar */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shadow-md text-primary-foreground">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-foreground uppercase">
              Charging<span className="text-primary">Station</span>
            </span>
          </div>

          <h2 className="text-lg font-bold text-foreground text-center uppercase tracking-wider">
            Admin Portal
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Secure Administrator Login
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3.5 rounded-md mb-6 text-sm font-semibold transition-all duration-300 animate-shake">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email input block */}
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-input text-foreground placeholder-muted-foreground/60 rounded-md py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
              />
            </div>
          </div>

          {/* Password input block */}
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-input text-foreground placeholder-muted-foreground/60 rounded-md py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-3 text-sm font-bold shadow-md transition-all duration-300 hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                VERIFYING...
              </span>
            ) : (
              'LOGIN TO DASHBOARD'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

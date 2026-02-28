'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { login, loginError, loginLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    try {
      await login(email.trim(), password);
    } catch {
      // Error is handled in auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg viewBox="0 0 80 100" className="w-10 h-12 text-brand-accent">
            <circle cx="40" cy="35" r="30" fill="currentColor" />
            <rect x="12" y="75" width="56" height="14" rx="3" fill="currentColor" />
          </svg>
          <h1 className="font-heading text-3xl font-bold text-brand-accent tracking-tight">LexStream</h1>
        </div>

        <div className="text-center mb-6">
          <p className="text-brand-body font-heading font-semibold text-lg">
            Legal Intelligence Platform
          </p>
          <p className="text-brand-muted text-sm mt-1">
            Sign in with your Academy credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-body mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-body mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your academy password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
            />
          </div>

          {loginError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading || !email.trim() || !password}
            className="w-full px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-brand-muted text-xs text-center mt-6">
          Use your LexStream Academy credentials to access the platform.
        </p>
      </div>
    </div>
  );
}

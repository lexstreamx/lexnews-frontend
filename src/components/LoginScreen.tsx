'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { register, forgotPassword, resendVerification } from '@/lib/api';

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

async function getRecaptchaToken(action: string): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) return undefined;
  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(() => resolve(undefined));
    });
  });
}

type View = 'signin' | 'register' | 'forgot' | 'check-email';

export default function LoginScreen() {
  const { login, loginError, loginLoading } = useAuth();
  const [view, setView] = useState<View>('signin');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Forgot password fields
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Check-email (post-register) state
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  function switchView(v: View) {
    setView(v);
    setRegisterError(null);
    setForgotError(null);
    setForgotSuccess(false);
    setResendMessage(null);
  }

  // ─── Sign In ──────────────────────────────────────────────────
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    try {
      const token = await getRecaptchaToken('login');
      await login(email.trim(), password, token);
    } catch {
      // Error handled in auth context
    }
  }

  // ─── Register ─────────────────────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegisterError(null);

    if (!displayName.trim()) {
      setRegisterError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setRegisterError('Please enter your email.');
      return;
    }
    if (password.length < 8) {
      setRegisterError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }

    setRegisterLoading(true);
    try {
      const token = await getRecaptchaToken('register');
      await register(email.trim(), password, displayName.trim(), token);
      setRegisteredEmail(email.trim());
      setView('check-email');
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  }

  // ─── Forgot Password ─────────────────────────────────────────
  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setForgotError(null);

    if (!email.trim()) {
      setForgotError('Please enter your email.');
      return;
    }

    setForgotLoading(true);
    try {
      const token = await getRecaptchaToken('forgot_password');
      await forgotPassword(email.trim(), token);
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setForgotLoading(false);
    }
  }

  // ─── Resend Verification ─────────────────────────────────────
  async function handleResend() {
    setResendLoading(true);
    setResendMessage(null);
    try {
      const token = await getRecaptchaToken('resend_verification');
      await resendVerification(registeredEmail, token);
      setResendMessage('Verification email sent! Check your inbox.');
    } catch {
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-brand-bg p-6">
      <div className="w-full max-w-sm">
        {/* Logo banner */}
        <div className="bg-brand-sidebar rounded-xl px-6 py-8 mb-6 flex flex-col items-center">
          <img src="/logo-white.svg" alt="LexLens" className="h-10 mb-3" />
          <p className="text-[#8A9A7C] text-sm">
            Legal Intelligence Platform
          </p>
        </div>

        {/* ─── Sign In View ──────────────────────────────────── */}
        {view === 'signin' && (
          <>
            <div className="text-center mb-6">
              <p className="text-brand-muted text-sm">
                Sign in to continue to LexLens.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-brand-body">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-xs text-brand-accent hover:text-brand-accent/80 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
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

            <p className="text-brand-muted text-sm text-center mt-6">
              New to LexLens?{' '}
              <button
                onClick={() => switchView('register')}
                className="text-brand-accent hover:text-brand-accent/80 font-medium transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </>
        )}

        {/* ─── Register View ─────────────────────────────────── */}
        {view === 'register' && (
          <>
            <div className="text-center mb-6">
              <h2 className="font-heading text-lg font-bold text-brand-heading mb-1">Create your account</h2>
              <p className="text-brand-muted text-sm">
                Get started with LexLens in seconds.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-brand-body mb-1.5">
                  Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-brand-body mb-1.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-brand-body mb-1.5">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-brand-body mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              {registerError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {registerLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-brand-muted text-sm text-center mt-6">
              Already have an account?{' '}
              <button
                onClick={() => switchView('signin')}
                className="text-brand-accent hover:text-brand-accent/80 font-medium transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {/* ─── Check Email View (post-register) ──────────────── */}
        {view === 'check-email' && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-bold text-brand-heading">Check your email</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              We sent a verification link to<br />
              <span className="font-medium text-brand-body">{registeredEmail}</span>
            </p>
            <p className="text-brand-muted text-xs">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>

            <div className="pt-2">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : "Didn't receive it? Resend"}
              </button>
              {resendMessage && (
                <p className="text-xs text-brand-muted mt-2">{resendMessage}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => switchView('signin')}
                className="text-sm text-brand-muted hover:text-brand-body transition-colors cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ─── Forgot Password View ──────────────────────────── */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-6">
              <h2 className="font-heading text-lg font-bold text-brand-heading mb-1">Reset your password</h2>
              <p className="text-brand-muted text-sm">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {!forgotSuccess ? (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-brand-body mb-1.5">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                  />
                </div>

                {forgotError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading || !email.trim()}
                  className="w-full px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-brand-muted text-sm leading-relaxed">
                  If an account exists with that email, you&apos;ll receive a password reset link shortly.
                </p>
              </div>
            )}

            <p className="text-brand-muted text-sm text-center mt-6">
              <button
                onClick={() => switchView('signin')}
                className="text-brand-accent hover:text-brand-accent/80 font-medium transition-colors cursor-pointer"
              >
                Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

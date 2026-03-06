'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error' | 'invalid'>(
    token ? 'form' : 'invalid'
  );
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await resetPassword(token!, password);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Reset failed');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md w-full bg-white border border-brand-border rounded-xl p-8 shadow-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="font-heading text-2xl font-bold text-brand-heading">LexLens</span>
        </div>

        {/* Form */}
        {(status === 'form' || status === 'loading') && (
          <>
            <div className="text-center mb-6">
              <h1 className="font-heading text-xl font-bold text-brand-heading mb-1">Set a new password</h1>
              <p className="text-brand-muted text-sm">
                Choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-brand-body mb-1.5">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-body mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-body placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
                />
              </div>

              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === 'loading' ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Password reset!</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              Your password has been updated successfully.
            </p>
            <a
              href="/"
              className="inline-block mt-2 px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md"
            >
              Sign in
            </a>
          </div>
        )}

        {/* Error (after submit) */}
        {status === 'error' && (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Reset failed</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              {errorMessage || 'This reset link is invalid or has expired.'}
            </p>
            <button
              onClick={() => { setStatus('form'); setErrorMessage(''); }}
              className="inline-block mt-2 text-sm text-brand-accent hover:text-brand-accent/80 font-medium transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Invalid (no token) */}
        {status === 'invalid' && (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Invalid link</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              This password reset link is missing or invalid. Please request a new one.
            </p>
            <a
              href="/"
              className="inline-block mt-2 text-sm text-brand-accent hover:text-brand-accent/80 font-medium transition-colors"
            >
              Go to sign in
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-brand-border text-center">
          <p className="text-xs text-brand-muted">
            LexLens — Legal Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

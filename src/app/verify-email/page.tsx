'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmail } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    verifyEmail(token)
      .then((data) => {
        setStatus('success');
        // Set user in auth context — auto-login
        if (data.user) {
          setUser(data.user);
        }
        // Redirect to onboarding (or dashboard if already onboarded)
        setTimeout(() => {
          if (data.user && !data.user.onboarding_completed) {
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        }, 2000);
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Verification failed');
        setStatus('error');
      });
  }, [token, setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md w-full bg-white border border-brand-border rounded-xl p-8 text-center shadow-sm">
        {/* Logo */}
        <div className="mb-6">
          <span className="font-heading text-2xl font-bold text-brand-heading">LexLens</span>
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-brand-muted text-sm">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Email verified!</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              Your account has been activated. Redirecting you now...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Verification failed</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>
            <a
              href="/"
              className="inline-block mt-2 text-sm text-brand-accent hover:text-brand-accent/80 font-medium transition-colors"
            >
              Go to sign in
            </a>
          </div>
        )}

        {status === 'invalid' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-brand-heading">Invalid link</h1>
            <p className="text-brand-muted text-sm leading-relaxed">
              This verification link is missing or invalid. If you arrived here from an email, the link may have expired.
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
        <div className="mt-8 pt-4 border-t border-brand-border">
          <p className="text-xs text-brand-muted">
            LexLens — Legal Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

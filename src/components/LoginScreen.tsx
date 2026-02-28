'use client';

import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* LexStream logo */}
        <div className="flex items-center justify-center gap-3">
          <svg viewBox="0 0 80 100" className="w-10 h-12 text-brand-accent">
            <circle cx="40" cy="35" r="30" fill="currentColor" />
            <rect x="12" y="75" width="56" height="14" rx="3" fill="currentColor" />
          </svg>
          <h1 className="font-heading text-3xl font-bold text-brand-accent tracking-tight">LexStream</h1>
        </div>

        <div className="space-y-2">
          <p className="text-brand-body font-heading font-semibold text-lg">
            Legal Intelligence Platform
          </p>
          <p className="text-brand-muted text-sm leading-relaxed">
            AI-categorized legal news, blogposts, judgments and regulatory updates — personalized to your areas of practice.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={login}
            className="px-8 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md hover:shadow-lg cursor-pointer"
          >
            Sign in via Academy
          </button>
          <p className="text-brand-muted text-xs mt-3">
            Use your LexStream Academy credentials to access the platform.
          </p>
        </div>
      </div>
    </div>
  );
}

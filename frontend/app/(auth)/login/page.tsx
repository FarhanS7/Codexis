'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

// Build the OAuth URL from the environment variable.
// NEXT_PUBLIC_ prefix makes it available in the browser bundle.
// Fallback to localhost:4000 only for local development.
const GITHUB_AUTH_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api') +
  '/auth/github';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If the user is already authenticated, skip the login page entirely.
  // router.replace() removes /login from history — back-button won't return here.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While auth state is resolving, show a spinner.
  // Without this, a logged-in user would briefly see the login form before redirect.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If auth has resolved and the user exists, render nothing while useEffect fires.
  // This prevents a one-frame flash of the login card.
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            {/* GitHub mark — public domain SVG */}
            <svg
              className="w-7 h-7 text-gray-900"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">AI Code Reviewer</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to review pull requests</p>
        </div>

        {/*
         * OAuth button — MUST be <a>, not <button onClick={...}>.
         * Full-page navigation allows the browser to follow the redirect chain
         * and accept the Set-Cookie header from the NestJS callback endpoint.
         * fetch() / axios cannot set httpOnly cookies cross-origin.
         */}
        <a
          href={GITHUB_AUTH_URL}
          className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          Continue with GitHub
        </a>

        <p className="text-center text-gray-500 text-xs mt-6">
          By signing in, you authorize read access to your GitHub repositories.
        </p>
      </div>
    </div>
  );
}

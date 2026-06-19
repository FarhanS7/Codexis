'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

function CodeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

// Build the OAuth URL from the environment variable.
const GITHUB_AUTH_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api') +
  '/auth/github';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If the user is already authenticated, skip the login page entirely.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While auth state is resolving, show a spinner.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-6 h-6 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-900/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-6 page-fade-in">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/30 p-8 shadow-2xl" style={{ backdropFilter: 'blur(10px)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            {/* Codexis Logo */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <CodeIcon className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Welcome to Codexis</h1>
            <p className="text-neutral-500 text-sm mt-1.5">Sign in to review pull requests with AI</p>
          </div>

          {/* OAuth button */}
          <a
            href={GITHUB_AUTH_URL}
            className="flex items-center justify-center gap-3 w-full bg-white hover:bg-neutral-100 active:bg-neutral-200 text-black font-medium py-3 px-4 rounded-full transition-all duration-200 shadow-lg shadow-white/5 hover:shadow-white/10 group"
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-sm">Continue with GitHub</span>
            <svg className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>

          <p className="text-center text-neutral-600 text-xs mt-6 leading-relaxed">
            By signing in, you authorize read access to your GitHub repositories.
          </p>
        </div>

        {/* Back to landing */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            ← Back to Codexis
          </Link>
        </div>
      </div>
    </div>
  );
}

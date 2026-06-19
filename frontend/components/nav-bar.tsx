'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

function CodeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Don't render nav if there's no user (handles loading state + post-logout)
  if (!user) return null;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/5 px-6 shrink-0"
      style={{
        background: 'rgba(5, 5, 5, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-[1600px] mx-auto h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
            <CodeIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight text-sm bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Codexis
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/[0.08]'
                    : 'text-neutral-500 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/5">
            <Image
              src={user.avatarUrl}
              alt={`${user.login}'s avatar`}
              width={24}
              height={24}
              className="rounded-full ring-1 ring-white/10"
              priority={false}
            />
            <span className="text-neutral-300 text-xs font-medium hidden sm:inline">{user.login}</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-neutral-500 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign out"
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  );
}

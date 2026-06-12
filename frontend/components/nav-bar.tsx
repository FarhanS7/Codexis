'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      // Reset in case logout() throws — prevents button being stuck disabled
      setLoggingOut(false);
    }
  };

  // Don't render nav if there's no user (handles loading state + post-logout)
  if (!user) return null;

  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
      {/* Brand / home link */}
      <Link
        href="/dashboard"
        className="text-white font-semibold text-sm hover:text-gray-300 transition-colors"
      >
        AI Code Reviewer
      </Link>

      {/* User section */}
      <div className="flex items-center gap-3">
        {/* GitHub avatar — requires avatars.githubusercontent.com in next.config.ts */}
        <Image
          src={user.avatarUrl}
          alt={`${user.login}'s avatar`}
          width={32}
          height={32}
          className="rounded-full ring-1 ring-gray-700"
          priority={false}
        />

        {/* Username */}
        <span className="text-gray-300 text-sm font-medium">{user.login}</span>

        {/* Divider */}
        <span className="text-gray-700 select-none">|</span>

        {/* Logout button — disabled while request is in flight */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:underline"
          aria-label="Sign out"
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}

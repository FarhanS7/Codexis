'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  login: string;
  avatarUrl: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

// Initialized to null (not a default value object) so useAuth() can detect
// when it's called outside the provider tree and throw a helpful error.
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // loading starts true — prevents flash of "not logged in" UI before /me resolves
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the single source of truth for auth state.
    // The httpOnly JWT cookie either exists (user logged in) or it doesn't.
    // We ask the backend to verify and decode it — the frontend never touches the token.
    axios
      .get<User>('/api/auth/me', { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null)) // 401 = not logged in — valid state, not an error
      .finally(() => setLoading(false)); // always unblock the UI
  }, []); // empty deps: run once on mount

  const logout = useCallback(async () => {
    // The backend MUST clear the httpOnly cookie — JavaScript cannot delete it.
    // Skipping this call means the cookie persists and the user can refresh to
    // restore their session even after "logging out".
    try {
      await axios.get('/api/auth/logout', { withCredentials: true });
    } catch (error) {
      console.warn('Logout request failed — clearing local auth state anyway', error);
    } finally {
      setUser(null);
    }
    // Navigation after logout is the caller's responsibility.
    // Context should not import useRouter — that couples state to routing.
  }, []); // stable reference for the entire provider lifetime

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the authenticated user, loading state, and logout function.
 * Must be used inside <AuthProvider>. Throws a descriptive error if not.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth() must be used within an <AuthProvider>. ' +
        'Wrap your component tree with <AuthProvider> in layout.tsx.',
    );
  }
  return context;
}

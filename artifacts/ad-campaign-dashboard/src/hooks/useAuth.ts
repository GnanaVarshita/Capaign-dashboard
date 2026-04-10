import { useState, useCallback } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../lib/mock-data';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';
const API_URL   = import.meta.env.VITE_API_URL as string | undefined;

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (loginId: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);

    // --- Try backend API ---
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Login failed');
          setAuthLoading(false);
          return false;
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setCurrentUser(data.user);
        setAuthLoading(false);
        return true;
      } catch {
        // fall through to local mock
      }
    }

    // --- Local mock fallback ---
    const storedRaw = localStorage.getItem('ad_campaign_db');
    const allUsers: User[] = storedRaw
      ? (JSON.parse(storedRaw).users ?? INITIAL_USERS)
      : INITIAL_USERS;

    const user = allUsers.find(
      u => u.loginId.toLowerCase() === loginId.toLowerCase() &&
           u.password === password &&
           u.status === 'active'
    );

    if (!user) {
      setAuthError('Invalid credentials');
      setAuthLoading(false);
      return false;
    }

    const { password: _p, ...safeUser } = user as any;
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    setAuthLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  const getToken = useCallback(() => getStoredToken(), []);

  return { currentUser, setCurrentUser, login, logout, authLoading, authError, getToken };
}

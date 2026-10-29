import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getCurrentUser,
  register as registerAccount,
  signIn as signInWithPassword,
  signOut as signOutRequest,
  updateCurrentUser,
} from '@/services/auth-service';
import { ApiError, SESSION_EXPIRED_EVENT } from '@/services/http';
import { clearAccessToken, getAccessToken } from '@/services/session-store';

import { AuthContext } from './auth-context';

/**
 * @typedef {object} AuthProviderProps
 * @property {import('react').ReactNode} children
 */

/**
 * @param {AuthProviderProps} props
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(
    /** @type {'loading' | 'anonymous' | 'authenticated'} */ (
      getAccessToken() ? 'loading' : 'anonymous'
    ),
  );
  const [user, setUser] = useState(
    /** @type {import('../../types/user').CurrentUser | null} */ (null),
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getAccessToken()) {
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch (error) {
        clearAccessToken();
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error('Failed to restore session', error);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setStatus('anonymous');
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const currentUser = await signInWithPassword({ email, password });
    setUser(currentUser);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async ({ email, password, displayName }) => {
    const currentUser = await registerAccount({ email, password, displayName });
    setUser(currentUser);
    setStatus('authenticated');
  }, []);

  const updateProfile = useCallback(async ({ displayName }) => {
    const currentUser = await updateCurrentUser({ displayName });
    setUser(currentUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutRequest();
    } catch (error) {
      console.error('Sign-out request failed', error);
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      signIn,
      register,
      updateProfile,
      signOut,
    }),
    [register, signIn, signOut, status, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

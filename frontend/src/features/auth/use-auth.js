import { useContext } from 'react';

import { AuthContext } from './auth-context';

/**
 * @returns {import('./auth-context').AuthContextValue}
 */
export function useAuth() {
  const value = useContext(AuthContext);
  if (value == null) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return value;
}

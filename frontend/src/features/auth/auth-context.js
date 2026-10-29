import { createContext } from 'react';

/** @typedef {import('../../types/user').CurrentUser} CurrentUser */

/**
 * @typedef {object} AuthContextValue
 * @property {'loading' | 'anonymous' | 'authenticated'} status
 * @property {CurrentUser | null} user
 * @property {(params: { email: string, password: string }) => Promise<void>} signIn
 * @property {(params: { email: string, password: string, displayName?: string }) => Promise<void>} register
 * @property {(params: { displayName: string | null }) => Promise<void>} updateProfile
 * @property {() => Promise<void>} signOut
 */

export const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

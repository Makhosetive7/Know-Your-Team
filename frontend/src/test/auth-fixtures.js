import { vi } from 'vitest';

/**
 * @param {Partial<import('../features/auth/auth-context').AuthContextValue>} [overrides]
 * @returns {import('../features/auth/auth-context').AuthContextValue}
 */
export function anonymousAuth(overrides = {}) {
  return {
    status: 'anonymous',
    user: null,
    signIn: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * @param {Partial<import('../features/auth/auth-context').AuthContextValue>} [overrides]
 * @returns {import('../features/auth/auth-context').AuthContextValue}
 */
export function authenticatedAuth(overrides = {}) {
  return anonymousAuth({
    status: 'authenticated',
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      displayName: 'Ada',
      isSuperuser: false,
    },
    ...overrides,
  });
}

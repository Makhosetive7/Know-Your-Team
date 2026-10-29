import { afterEach, describe, expect, it, vi } from 'vitest';

import { register, signIn, signOut, updateCurrentUser } from './auth-service';
import { ApiError } from './http';
import { ACCESS_TOKEN_KEY, getAccessToken, setAccessToken } from './session-store';

const CURRENT_USER_JSON = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ada@example.com',
  display_name: 'Ada',
  is_active: true,
  is_superuser: false,
  is_verified: true,
};

/**
 * @param {Record<string, { status?: number, body?: unknown }>} routes
 * @returns {void}
 */
function stubFetch(routes) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path, init) => {
      const route = routes[`${init?.method ?? 'GET'} ${path}`];
      if (!route) {
        throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${path}`);
      }
      if (route.status === 204) {
        return { ok: true, status: 204 };
      }
      const status = route.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => route.body,
      };
    }),
  );
}

describe('auth-service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  });

  it('stores the token and returns the current user after sign-in', async () => {
    stubFetch({
      'POST /api/v1/auth/login': {
        body: { access_token: 'jwt-token', token_type: 'bearer' },
      },
      'GET /api/v1/users/me': { body: CURRENT_USER_JSON },
    });

    const user = await signIn({ email: 'ada@example.com', password: 'password1' });

    expect(getAccessToken()).toBe('jwt-token');
    expect(user).toEqual({
      id: CURRENT_USER_JSON.id,
      email: 'ada@example.com',
      displayName: 'Ada',
      isSuperuser: false,
    });
  });

  it('registers then signs in so the new account has a session', async () => {
    stubFetch({
      'POST /api/v1/auth/register': { status: 201, body: CURRENT_USER_JSON },
      'POST /api/v1/auth/login': {
        body: { access_token: 'jwt-token', token_type: 'bearer' },
      },
      'GET /api/v1/users/me': { body: CURRENT_USER_JSON },
    });

    const user = await register({
      email: 'ada@example.com',
      password: 'password1',
      displayName: 'Ada',
    });

    expect(user.displayName).toBe('Ada');
    expect(getAccessToken()).toBe('jwt-token');
  });

  it('does not keep a token when login fails', async () => {
    stubFetch({
      'POST /api/v1/auth/login': {
        status: 401,
        body: {
          error: { code: 'login_bad_credentials', message: 'Incorrect email or password.' },
        },
      },
    });

    const error = await signIn({ email: 'ada@example.com', password: 'wrong' }).catch(
      (caught) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('login_bad_credentials');
    expect(getAccessToken()).toBeNull();
  });

  it('clears the token after sign-out even if logout fails', async () => {
    setAccessToken('jwt-token');
    stubFetch({
      'POST /api/v1/auth/logout': {
        status: 401,
        body: { error: { code: 'unauthenticated', message: 'Not authenticated.' } },
      },
    });

    await signOut();
    expect(getAccessToken()).toBeNull();
  });

  it('maps a profile update', async () => {
    stubFetch({
      'PATCH /api/v1/users/me': {
        body: { ...CURRENT_USER_JSON, display_name: 'Ada Lovelace' },
      },
    });

    await expect(updateCurrentUser({ displayName: 'Ada Lovelace' })).resolves.toEqual({
      id: CURRENT_USER_JSON.id,
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      isSuperuser: false,
    });
  });
});

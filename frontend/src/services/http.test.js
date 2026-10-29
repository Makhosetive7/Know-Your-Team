import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest } from './http';

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns JSON for a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-1' }),
      }),
    );

    await expect(apiRequest('/api/v1/users/me')).resolves.toEqual({ id: 'user-1' });
  });

  it('returns null for 204 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      }),
    );

    await expect(apiRequest('/api/v1/auth/logout', { method: 'POST' })).resolves.toBeNull();
  });

  it('maps the API error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: 'login_bad_credentials', message: 'Incorrect email or password.' },
        }),
      }),
    );

    const error = await apiRequest('/api/v1/auth/login', { method: 'POST' }).catch(
      (caught) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('login_bad_credentials');
    expect(error.message).toBe('Incorrect email or password.');
    expect(error.status).toBe(401);
  });

  it('throws a network error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await apiRequest('/api/v1/users/me').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('network_error');
  });

  it('sends JSON, form, and bearer headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      json: { email: 'ada@example.com' },
    });
    await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      form: new URLSearchParams({ username: 'ada@example.com' }),
    });
    await apiRequest('/api/v1/users/me', { token: 'jwt' });

    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
    expect(fetchMock.mock.calls[1][1].headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer jwt');
  });
});

/** @typedef {import('../types/user').CurrentUser} CurrentUser */

import { ApiError, apiRequest } from './http';
import { clearAccessToken, getAccessToken, setAccessToken } from './session-store';

/**
 * @param {object} body
 * @returns {CurrentUser}
 */
function toCurrentUser(body) {
  return {
    id: body.id,
    email: body.email,
    displayName: body.display_name ?? null,
    isSuperuser: body.is_superuser === true,
  };
}

/**
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<string>}
 */
async function requestAccessToken({ email, password }) {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  const body = await apiRequest('/api/v1/auth/login', { method: 'POST', form });
  const token = body?.access_token;
  if (typeof token !== 'string' || token === '') {
    throw new Error('Login did not return an access token.');
  }
  return token;
}

/**
 * @returns {Promise<CurrentUser>}
 */
export async function getCurrentUser() {
  const token = getAccessToken();
  const body = await apiRequest('/api/v1/users/me', { token });
  return toCurrentUser(body);
}

/**
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<CurrentUser>}
 */
export async function signIn({ email, password }) {
  const token = await requestAccessToken({ email, password });
  setAccessToken(token);
  return getCurrentUser();
}

/**
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.displayName]
 * @returns {Promise<CurrentUser>}
 */
export async function register({ email, password, displayName }) {
  /** @type {{ email: string, password: string, display_name?: string }} */
  const json = { email, password };
  if (displayName) {
    json.display_name = displayName;
  }
  await apiRequest('/api/v1/auth/register', { method: 'POST', json });
  return signIn({ email, password });
}

/**
 * @param {object} params
 * @param {string | null} params.displayName
 * @returns {Promise<CurrentUser>}
 */
export async function updateCurrentUser({ displayName }) {
  const body = await apiRequest('/api/v1/users/me', {
    method: 'PATCH',
    json: { display_name: displayName },
  });
  return toCurrentUser(body);
}

/**
 * @returns {Promise<void>}
 */
export async function signOut() {
  const token = getAccessToken();
  try {
    if (token) {
      await apiRequest('/api/v1/auth/logout', { method: 'POST', token });
    }
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
  } finally {
    clearAccessToken();
  }
}

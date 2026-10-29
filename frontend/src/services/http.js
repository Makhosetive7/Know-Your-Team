import { clearAccessToken, getAccessToken } from './session-store';

export const SESSION_EXPIRED_EVENT = 'kyt:session-expired';

export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {string} params.code
   * @param {string} params.message
   * @param {number} [params.status]
   */
  constructor({ code, message, status }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status ?? null;
  }
}

/**
 * @param {Response} response
 * @returns {Promise<ApiError>}
 */
async function toApiError(response) {
  try {
    const body = await response.json();
    const error = body?.error;
    if (error && typeof error.code === 'string' && typeof error.message === 'string') {
      return new ApiError({
        code: error.code,
        message: error.message,
        status: response.status,
      });
    }
  } catch {
    return new ApiError({
      code: 'http_error',
      message: 'Request failed.',
      status: response.status,
    });
  }

  return new ApiError({
    code: 'http_error',
    message: 'Request failed.',
    status: response.status,
  });
}

/**
 * @param {string} path
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {unknown} [options.json]
 * @param {URLSearchParams} [options.form]
 * @param {string | null} [options.token]
 * @returns {Promise<unknown>}
 */
export async function apiRequest(path, { method = 'GET', json, form, token } = {}) {
  const accessToken = token === undefined ? getAccessToken() : token;
  /** @type {Record<string, string>} */
  const headers = {};
  /** @type {RequestInit} */
  const init = { method, headers };

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  } else if (form !== undefined) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = form;
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError({
      code: 'network_error',
      message: 'Could not reach the server. Check your connection and try again.',
    });
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401 && accessToken) {
      clearAccessToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }

  return response.json();
}

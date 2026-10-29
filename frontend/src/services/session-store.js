export const ACCESS_TOKEN_KEY = 'kyt.accessToken';

/**
 * @returns {string | null}
 */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * @param {string} token
 * @returns {void}
 */
export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * @returns {void}
 */
export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

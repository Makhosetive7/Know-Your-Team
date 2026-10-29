/**
 * Allow only in-app relative paths after sign-in.
 *
 * @param {string | null} value
 * @returns {string}
 */
export function safeNextPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/teams';
  }
  return value;
}

/**
 * Guest auth path that keeps a safe `next` query when one was requested.
 *
 * @param {string} path
 * @param {string | null} nextValue
 * @returns {string}
 */
export function guestHref(path, nextValue) {
  const next = safeNextPath(nextValue);
  if (next === '/teams') {
    return path;
  }
  return `${path}?next=${encodeURIComponent(next)}`;
}

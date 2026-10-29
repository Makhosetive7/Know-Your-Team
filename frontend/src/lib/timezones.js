const FALLBACK_TIMEZONES = Object.freeze([
  'UTC',
  'Africa/Johannesburg',
  'America/Chicago',
  'America/Los_Angeles',
  'America/New_York',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
]);

/**
 * @returns {string[]}
 */
export function listTimezones() {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  return [...FALLBACK_TIMEZONES];
}

/**
 * @returns {string}
 */
export function guessTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

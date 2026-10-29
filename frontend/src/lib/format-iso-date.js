/**
 * @param {string} value ISO date (`YYYY-MM-DD`) or datetime
 * @returns {string}
 */
export function formatIsoDate(value) {
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

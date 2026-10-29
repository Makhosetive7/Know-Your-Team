/**
 * @param {object} params
 * @param {number} params.completedCount
 * @param {number} params.memberCount
 * @returns {number}
 */
export function formatParticipation({ completedCount, memberCount }) {
  if (memberCount === 0) {
    return 0;
  }
  return Math.round((completedCount / memberCount) * 100);
}

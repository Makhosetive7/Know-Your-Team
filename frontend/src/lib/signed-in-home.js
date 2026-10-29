/** @typedef {import('../types/team').Team} Team */

import { listTeams } from '@/services/team-service';

import { safeNextPath } from './safe-next-path';

/**
 * Default signed-in home: today when the caller has one team, otherwise the team list.
 *
 * @param {Team[]} teams
 * @returns {string}
 */
export function pathForTeams(teams) {
  if (teams.length === 1) {
    const team = teams[0];
    if (team) {
      return `/teams/${team.id}`;
    }
  }
  return '/teams';
}

/**
 * Honour an explicit in-app next path. The default `/teams` becomes today when
 * the caller belongs to exactly one team.
 *
 * @param {string | null} requestedNext
 * @returns {Promise<string>}
 */
export async function resolveSignedInPath(requestedNext) {
  const next = safeNextPath(requestedNext);
  if (next !== '/teams') {
    return next;
  }
  const teams = await listTeams();
  return pathForTeams(teams);
}

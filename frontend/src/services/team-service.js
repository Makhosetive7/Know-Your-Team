/** @typedef {import('../types/team').Team} Team */
/** @typedef {import('../types/team').TeamMember} TeamMember */

import { apiRequest } from './http';

/**
 * @param {object} body
 * @returns {Team}
 */
function toTeam(body) {
  return {
    id: body.id,
    name: body.name,
    timezone: body.timezone,
    role: body.role,
    createdAt: body.created_at,
  };
}

/**
 * @param {object} body
 * @returns {TeamMember}
 */
function toMember(body) {
  return {
    userId: body.user_id,
    email: body.email,
    displayName: body.display_name ?? null,
    role: body.role,
  };
}

/**
 * @returns {Promise<Team[]>}
 */
export async function listTeams() {
  const body = await apiRequest('/api/v1/teams');
  return body.map(toTeam);
}

/**
 * @param {string} teamId
 * @returns {Promise<Team>}
 */
export async function getTeam(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}`);
  return toTeam(body);
}

/**
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.timezone
 * @returns {Promise<Team>}
 */
export async function createTeam({ name, timezone }) {
  const body = await apiRequest('/api/v1/teams', {
    method: 'POST',
    json: { name, timezone },
  });
  return toTeam(body);
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {string} [params.name]
 * @param {string} [params.timezone]
 * @returns {Promise<Team>}
 */
export async function updateTeam({ teamId, name, timezone }) {
  /** @type {{ name?: string, timezone?: string }} */
  const json = {};
  if (name !== undefined) {
    json.name = name;
  }
  if (timezone !== undefined) {
    json.timezone = timezone;
  }
  const body = await apiRequest(`/api/v1/teams/${teamId}`, { method: 'PATCH', json });
  return toTeam(body);
}

/**
 * @param {string} teamId
 * @returns {Promise<TeamMember[]>}
 */
export async function listMembers(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/members`);
  return body.map(toMember);
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {string} params.userId
 * @returns {Promise<void>}
 */
export async function removeOrLeaveMember({ teamId, userId }) {
  await apiRequest(`/api/v1/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
}

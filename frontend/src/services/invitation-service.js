/** @typedef {import('../types/invitation').CreatedInvitation} CreatedInvitation */
/** @typedef {import('../types/invitation').Invitation} Invitation */
/** @typedef {import('../types/team').Team} Team */

import { apiRequest } from './http';

/**
 * @param {string} token
 * @returns {Promise<string>}
 */
export async function previewInvitation(token) {
  const params = new URLSearchParams({ token });
  const body = await apiRequest(`/api/v1/teams/join?${params.toString()}`, { token: null });
  return body.team_name;
}

/**
 * @param {string} token
 * @returns {Promise<Team>}
 */
export async function joinTeam(token) {
  const body = await apiRequest('/api/v1/teams/join', {
    method: 'POST',
    json: { token },
  });
  return {
    id: body.id,
    name: body.name,
    timezone: body.timezone,
    role: body.role,
    createdAt: body.created_at,
  };
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {number} [params.expiresInDays]
 * @returns {Promise<CreatedInvitation>}
 */
export async function createInvitation({ teamId, expiresInDays }) {
  /** @type {{ expires_in_days?: number }} */
  const json = {};
  if (expiresInDays !== undefined) {
    json.expires_in_days = expiresInDays;
  }
  const body = await apiRequest(`/api/v1/teams/${teamId}/invitations`, {
    method: 'POST',
    json,
  });
  return {
    id: body.id,
    token: body.token,
    expiresAt: body.expires_at,
    revokedAt: body.revoked_at ?? null,
  };
}

/**
 * @param {string} teamId
 * @returns {Promise<Invitation[]>}
 */
export async function listInvitations(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/invitations`);
  return body.map((row) => ({
    id: row.id,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at ?? null,
    createdAt: row.created_at,
  }));
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {string} params.invitationId
 * @returns {Promise<void>}
 */
export async function revokeInvitation({ teamId, invitationId }) {
  await apiRequest(`/api/v1/teams/${teamId}/invitations/${invitationId}/revoke`, {
    method: 'POST',
  });
}

/**
 * @param {string} token
 * @returns {string}
 */
export function invitationJoinPath(token) {
  return `/join?token=${encodeURIComponent(token)}`;
}

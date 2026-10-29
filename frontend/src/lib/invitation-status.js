/** @typedef {import('../types/invitation').Invitation} Invitation */
/** @typedef {'active' | 'expired' | 'revoked'} InvitationStatus */

export const INVITATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
});

/**
 * @param {Invitation} invitation
 * @param {Date} [at]
 * @returns {InvitationStatus}
 */
export function invitationStatus(invitation, at = new Date()) {
  if (invitation.revokedAt) {
    return INVITATION_STATUS.REVOKED;
  }
  if (new Date(invitation.expiresAt).getTime() <= at.getTime()) {
    return INVITATION_STATUS.EXPIRED;
  }
  return INVITATION_STATUS.ACTIVE;
}

/**
 * @param {Invitation[]} invitations
 * @param {Date} [at]
 * @returns {{ active: Invitation[], expired: Invitation[], revoked: Invitation[] }}
 */
export function groupInvitations(invitations, at = new Date()) {
  /** @type {{ active: Invitation[], expired: Invitation[], revoked: Invitation[] }} */
  const groups = { active: [], expired: [], revoked: [] };
  for (const invitation of invitations) {
    groups[invitationStatus(invitation, at)].push(invitation);
  }
  return groups;
}

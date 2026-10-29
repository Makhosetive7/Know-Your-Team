/**
 * @typedef {string} TeamId
 * @typedef {string} UserId
 */

/**
 * @typedef {'member' | 'team_administrator'} MembershipRole
 */

/**
 * @typedef {object} Team
 * @property {TeamId} id
 * @property {string} name
 * @property {string} timezone
 * @property {MembershipRole} role
 * @property {string} createdAt
 */

/**
 * @typedef {object} TeamMember
 * @property {UserId} userId
 * @property {string} email
 * @property {string | null} displayName
 * @property {MembershipRole} role
 */

export const MEMBERSHIP_ROLE = Object.freeze({
  MEMBER: 'member',
  TEAM_ADMINISTRATOR: 'team_administrator',
});

export {};

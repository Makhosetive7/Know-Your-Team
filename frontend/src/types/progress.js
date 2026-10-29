/** @typedef {import('./activity').Activity} Activity */

/**
 * @typedef {object} TeamProgress
 * @property {string} date
 * @property {number} memberCount
 * @property {number} completedCount
 * @property {number} skippedCount
 * @property {number} participationPercent
 * @property {Activity | null} activity
 */

/**
 * @typedef {object} TeamProgressHistoryItem
 * @property {string} date
 * @property {number} memberCount
 * @property {number} completedCount
 * @property {number} skippedCount
 * @property {number} participationPercent
 * @property {Activity} activity
 */

export {};

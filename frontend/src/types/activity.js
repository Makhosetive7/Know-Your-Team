/**
 * @typedef {'icebreaker' | 'reflection' | 'appreciation' | 'fun'} ActivityCategory
 * @typedef {'completed' | 'skipped'} CompletionOutcome
 * @typedef {'available' | 'completed' | 'skipped'} DailyActivityStatus
 */

/**
 * @typedef {object} Activity
 * @property {string} id
 * @property {string} title
 * @property {string} instructions
 * @property {ActivityCategory} category
 * @property {number} estimatedMinutes
 */

/**
 * @typedef {object} Completion
 * @property {CompletionOutcome} outcome
 * @property {string} createdAt
 */

/**
 * @typedef {object} DailyActivity
 * @property {string} id
 * @property {string} date
 * @property {Activity} activity
 * @property {Completion | null} completion
 */

/**
 * Activity row for the platform library, including whether it can be assigned.
 *
 * @typedef {Activity & { isActive: boolean }} AdminActivity
 */

export const ACTIVITY_CATEGORY = Object.freeze({
  ICEBREAKER: 'icebreaker',
  REFLECTION: 'reflection',
  APPRECIATION: 'appreciation',
  FUN: 'fun',
});

export const ACTIVITY_CATEGORY_LABEL = Object.freeze({
  icebreaker: 'Icebreaker',
  reflection: 'Reflection',
  appreciation: 'Appreciation',
  fun: 'Fun',
});

export const COMPLETION_OUTCOME = Object.freeze({
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
});

export {};

/** @typedef {import('../types/activity').Activity} Activity */
/** @typedef {import('../types/activity').ActivityCategory} ActivityCategory */
/** @typedef {import('../types/activity').AdminActivity} AdminActivity */
/** @typedef {import('../types/activity').Completion} Completion */
/** @typedef {import('../types/activity').DailyActivity} DailyActivity */

import { apiRequest } from './http';

/**
 * @param {object} body
 * @returns {Activity}
 */
function toActivity(body) {
  return {
    id: body.id,
    title: body.title,
    instructions: body.instructions,
    category: body.category,
    estimatedMinutes: body.estimated_minutes,
  };
}

/**
 * @param {object} body
 * @returns {AdminActivity}
 */
function toAdminActivity(body) {
  return {
    ...toActivity(body),
    isActive: body.is_active === true,
  };
}

/**
 * @param {object | null} body
 * @returns {Completion | null}
 */
function toCompletion(body) {
  if (body == null) {
    return null;
  }
  return {
    outcome: body.outcome,
    createdAt: body.created_at,
  };
}

/**
 * @param {object} body
 * @returns {DailyActivity}
 */
function toDailyActivity(body) {
  return {
    id: body.id,
    date: body.date,
    activity: toActivity(body.activity),
    completion: toCompletion(body.completion),
  };
}

/**
 * @param {string} teamId
 * @returns {Promise<DailyActivity>}
 */
export async function getDailyActivity(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/daily-activity`);
  return toDailyActivity(body);
}

/**
 * @param {string} teamId
 * @returns {Promise<DailyActivity[]>}
 */
export async function listActivityHistory(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/activities/history`);
  return body.map(toDailyActivity);
}

/**
 * @param {string} teamId
 * @returns {Promise<Completion>}
 */
export async function completeDailyActivity(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/daily-activity/complete`, {
    method: 'POST',
  });
  const completion = toCompletion(body);
  if (completion == null) {
    throw new Error('Complete did not return a completion.');
  }
  return completion;
}

/**
 * @returns {Promise<AdminActivity[]>}
 */
export async function listAdminActivities() {
  const body = await apiRequest('/api/v1/admin/activities');
  return body.map(toAdminActivity);
}

/**
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.instructions
 * @param {ActivityCategory} params.category
 * @param {number} params.estimatedMinutes
 * @returns {Promise<AdminActivity>}
 */
export async function createAdminActivity({ title, instructions, category, estimatedMinutes }) {
  const body = await apiRequest('/api/v1/admin/activities', {
    method: 'POST',
    json: {
      title,
      instructions,
      category,
      estimated_minutes: estimatedMinutes,
    },
  });
  return toAdminActivity(body);
}

/**
 * @param {string} teamId
 * @returns {Promise<Completion>}
 */
export async function skipDailyActivity(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/daily-activity/skip`, {
    method: 'POST',
  });
  const completion = toCompletion(body);
  if (completion == null) {
    throw new Error('Skip did not return a completion.');
  }
  return completion;
}

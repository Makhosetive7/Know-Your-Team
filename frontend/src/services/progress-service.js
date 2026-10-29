/** @typedef {import('../types/progress').TeamProgress} TeamProgress */
/** @typedef {import('../types/progress').TeamProgressHistoryItem} TeamProgressHistoryItem */

import { apiRequest } from './http';

/**
 * @param {object} body
 * @returns {TeamProgress}
 */
function toProgress(body) {
  return {
    date: body.date,
    memberCount: body.member_count,
    completedCount: body.completed_count,
    skippedCount: body.skipped_count,
    participationPercent: body.participation_percent,
    activity: body.activity
      ? {
          id: body.activity.id,
          title: body.activity.title,
          instructions: body.activity.instructions,
          category: body.activity.category,
          estimatedMinutes: body.activity.estimated_minutes,
        }
      : null,
  };
}

/**
 * @param {string} teamId
 * @returns {Promise<TeamProgress>}
 */
export async function getTeamProgress(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/progress`);
  return toProgress(body);
}

/**
 * @param {string} teamId
 * @returns {Promise<TeamProgressHistoryItem[]>}
 */
export async function listProgressHistory(teamId) {
  const body = await apiRequest(`/api/v1/teams/${teamId}/progress/history`);
  return body.map((item) => ({
    ...toProgress(item),
    activity: {
      id: item.activity.id,
      title: item.activity.title,
      instructions: item.activity.instructions,
      category: item.activity.category,
      estimatedMinutes: item.activity.estimated_minutes,
    },
  }));
}

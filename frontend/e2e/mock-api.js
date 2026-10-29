export const CURRENT_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ada@example.com',
  display_name: 'Ada',
  is_active: true,
  is_superuser: false,
  is_verified: true,
};

export const TEAM = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Studio',
  timezone: 'UTC',
  role: 'team_administrator',
  created_at: '2026-10-28T12:00:00Z',
};

const ACTIVITY = {
  id: 'act-1',
  title: 'Two truths',
  instructions: 'Share two truths and a lie.',
  category: 'icebreaker',
  estimated_minutes: 5,
};

/**
 * @param {import('@playwright/test').Route} route
 * @param {number} status
 * @param {unknown} [body]
 * @returns {Promise<void>}
 */
async function json(route, status, body) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

/**
 * Mock the MVP API for browser journeys.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {boolean} [options.withTeam]
 * @param {number} [options.memberCount]
 * @param {number} [options.priorCompletedCount]
 * @returns {Promise<void>}
 */
export async function mockAppApi(
  page,
  { withTeam = false, memberCount = 1, priorCompletedCount = 0 } = {},
) {
  /** @type {typeof TEAM | null} */
  let team = withTeam ? TEAM : null;
  /** @type {{ outcome: string, created_at: string } | null} */
  let completion = null;
  /** @type {Array<{ id: string, expires_at: string, revoked_at: null, created_at: string }>} */
  let invitations = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (pathname === '/api/v1/auth/register' && method === 'POST') {
      await json(route, 201, CURRENT_USER);
      return;
    }
    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      await json(route, 200, { access_token: 'jwt-token', token_type: 'bearer' });
      return;
    }
    if (pathname === '/api/v1/auth/logout' && method === 'POST') {
      await json(route, 204);
      return;
    }
    if (pathname === '/api/v1/users/me' && method === 'GET') {
      await json(route, 200, CURRENT_USER);
      return;
    }
    if (pathname === '/api/v1/users/me' && method === 'PATCH') {
      await json(route, 200, CURRENT_USER);
      return;
    }
    if (pathname === '/api/v1/teams/join' && method === 'GET') {
      const token = url.searchParams.get('token');
      if (token === 'share-token') {
        await json(route, 200, { team_name: 'Studio' });
        return;
      }
      await json(route, 404, {
        error: { code: 'invitation_invalid', message: 'Invitation not found.' },
      });
      return;
    }
    if (pathname === '/api/v1/teams' && method === 'GET') {
      await json(route, 200, team ? [team] : []);
      return;
    }
    if (pathname === '/api/v1/teams' && method === 'POST') {
      const posted = request.postDataJSON();
      team = {
        ...TEAM,
        name: posted?.name ?? TEAM.name,
        timezone: posted?.timezone ?? TEAM.timezone,
      };
      await json(route, 201, team);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}` && method === 'GET') {
      await json(route, 200, team);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/daily-activity` && method === 'GET') {
      await json(route, 200, {
        id: 'daily-1',
        date: '2026-10-28',
        activity: ACTIVITY,
        completion,
      });
      return;
    }
    if (
      team &&
      pathname === `/api/v1/teams/${team.id}/daily-activity/complete` &&
      method === 'POST'
    ) {
      completion = { outcome: 'completed', created_at: '2026-10-28T12:00:00Z' };
      await json(route, 200, completion);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/daily-activity/skip` && method === 'POST') {
      completion = { outcome: 'skipped', created_at: '2026-10-28T12:00:00Z' };
      await json(route, 200, completion);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/members` && method === 'GET') {
      await json(route, 200, [
        {
          user_id: CURRENT_USER.id,
          email: CURRENT_USER.email,
          display_name: CURRENT_USER.display_name,
          role: 'team_administrator',
        },
      ]);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/invitations` && method === 'GET') {
      await json(route, 200, invitations);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/invitations` && method === 'POST') {
      const created = {
        id: 'invite-1',
        expires_at: '2026-11-04T12:00:00Z',
        revoked_at: null,
        created_at: '2026-10-28T12:00:00Z',
      };
      invitations = [created, ...invitations];
      await json(route, 201, { ...created, token: 'share-token' });
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/progress` && method === 'GET') {
      const userCompleted = completion?.outcome === 'completed' ? 1 : 0;
      const skippedCount = completion?.outcome === 'skipped' ? 1 : 0;
      const completedCount = priorCompletedCount + userCompleted;
      const participationPercent =
        memberCount === 0 ? 0 : Math.round((completedCount / memberCount) * 100);
      await json(route, 200, {
        date: '2026-10-28',
        member_count: memberCount,
        completed_count: completedCount,
        skipped_count: skippedCount,
        participation_percent: participationPercent,
        activity: ACTIVITY,
      });
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/progress/history` && method === 'GET') {
      await json(route, 200, []);
      return;
    }
    if (team && pathname === `/api/v1/teams/${team.id}/activities/history` && method === 'GET') {
      await json(route, 200, []);
      return;
    }

    await json(route, 404, { error: { code: 'not_found', message: 'Not found.' } });
  });
}

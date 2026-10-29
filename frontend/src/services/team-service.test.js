import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTeam, listTeams } from './team-service';

describe('team-service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps team list JSON into UI shapes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'team-1',
            name: 'Studio',
            timezone: 'Africa/Johannesburg',
            role: 'team_administrator',
            created_at: '2026-10-28T12:00:00Z',
          },
        ],
      }),
    );

    await expect(listTeams()).resolves.toEqual([
      {
        id: 'team-1',
        name: 'Studio',
        timezone: 'Africa/Johannesburg',
        role: 'team_administrator',
        createdAt: '2026-10-28T12:00:00Z',
      },
    ]);
  });

  it('creates a team', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'team-1',
        name: 'Studio',
        timezone: 'UTC',
        role: 'team_administrator',
        created_at: '2026-10-28T12:00:00Z',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const team = await createTeam({ name: 'Studio', timezone: 'UTC' });
    expect(team.name).toBe('Studio');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'Studio',
      timezone: 'UTC',
    });
  });
});

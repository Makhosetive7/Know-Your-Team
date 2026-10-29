import { describe, expect, it, vi } from 'vitest';

import { listTeams } from '@/services/team-service';

import { pathForTeams, resolveSignedInPath } from './signed-in-home';

vi.mock('@/services/team-service', () => ({
  listTeams: vi.fn(),
}));

const STUDIO = {
  id: 'team-1',
  name: 'Studio',
  timezone: 'UTC',
  role: 'team_administrator',
  createdAt: '2026-10-28T12:00:00Z',
};

describe('pathForTeams', () => {
  it('sends a single-team member to today', () => {
    expect(pathForTeams([STUDIO])).toBe('/teams/team-1');
  });

  it('keeps the team list when there are none or several', () => {
    expect(pathForTeams([])).toBe('/teams');
    expect(pathForTeams([STUDIO, { ...STUDIO, id: 'team-2', name: 'Lab' }])).toBe('/teams');
  });
});

describe('resolveSignedInPath', () => {
  it('honours an explicit next path without listing teams', async () => {
    await expect(resolveSignedInPath('/join?token=abc')).resolves.toBe('/join?token=abc');
    expect(listTeams).not.toHaveBeenCalled();
  });

  it('uses today when the default home is one team', async () => {
    vi.mocked(listTeams).mockResolvedValue([STUDIO]);
    await expect(resolveSignedInPath(null)).resolves.toBe('/teams/team-1');
  });
});
